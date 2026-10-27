import type { VercelRequest, VercelResponse } from './types';
import { verifyAuthHeader, checkWorkPermission } from './authMiddleware';
import { batchReadAllTabs, appendRow, updateRowById, SHEET_TABS } from './sheetsService';
import { reimburseCosting } from '../src/services/mathEngine';
import { Costing } from '../src/types/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = process.env.SHEET_ID;

    if (!spreadsheetId) {
      return res.status(500).json({ error: 'SHEET_ID is not configured' });
    }

    if (req.method === 'GET') {
      const { workId } = req.query;
      if (!workId || typeof workId !== 'string') {
        return res.status(400).json({ error: 'workId is required' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId);
      const workRows = allTabs[SHEET_TABS.WORKS] || [];
      const work = workRows.find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      const workUsers = (allTabs[SHEET_TABS.WORK_USERS] || []).filter((r) => r[0] === workId);
      const perm = checkWorkPermission(authUser, workId, work[7], workUsers.map((r) => r[1]));
      if (!perm.isAllowed) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const costingRows = (allTabs[SHEET_TABS.COSTINGS] || []).filter((r) => r[1] === workId);
      const costings: Costing[] = costingRows.map((r) => ({
        costingId: r[0],
        workId: r[1],
        userId: r[2],
        reasonId: r[3],
        materialAmount: r[4] ? Number(r[4]) : undefined,
        metricId: r[5],
        costAmount: Number(r[6]) || 0,
        source: (r[7] as any) || 'BUDGET',
        reimbursedAt: r[8] || null,
        reimbursedBy: r[9] || null,
        note: r[10],
        createdAt: r[11],
      }));

      return res.status(200).json({ costings });
    }

    if (req.method === 'POST') {
      const { workId, reasonId, materialAmount, metricId, costAmount, source, note } = req.body;
      if (!workId || !reasonId || costAmount === undefined || !source) {
        return res.status(400).json({ error: 'Missing required costing fields' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      const workUsers = (allTabs[SHEET_TABS.WORK_USERS] || []).filter((r) => r[0] === workId);
      const perm = checkWorkPermission(authUser, workId, work[7], workUsers.map((r) => r[1]));
      if (!perm.isAllowed) {
        return res.status(403).json({ error: 'Forbidden: You cannot log expenses for this work' });
      }

      const costingId = `cost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const createdAt = new Date().toISOString();

      const newRow = [
        costingId,
        workId,
        authUser.uid,
        reasonId,
        materialAmount !== undefined && materialAmount !== null ? String(materialAmount) : '',
        metricId || '',
        String(costAmount),
        source,
        '', // reimbursedAt
        '', // reimbursedBy
        note || '',
        createdAt,
      ];

      await appendRow(spreadsheetId, SHEET_TABS.COSTINGS, newRow);

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        createdAt,
        authUser.uid,
        'ADD_COSTING',
        `Costing/${costingId}`,
        '',
        JSON.stringify({ costAmount, source, reasonId }),
      ]);

      return res.status(201).json({
        costing: {
          costingId,
          workId,
          userId: authUser.uid,
          reasonId,
          materialAmount,
          metricId,
          costAmount,
          source,
          reimbursedAt: null,
          reimbursedBy: null,
          note,
          createdAt,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { costingId, action, workId } = req.body;
      if (!costingId) return res.status(400).json({ error: 'costingId is required' });

      const allTabs = await batchReadAllTabs(spreadsheetId, true);
      const costingRows = allTabs[SHEET_TABS.COSTINGS] || [];
      const row = costingRows.find((r) => r[0] === costingId);
      if (!row) return res.status(404).json({ error: 'Costing not found' });

      const cWorkId = row[1];
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === cWorkId);
      if (!work) return res.status(404).json({ error: 'Associated work not found' });

      const workUsers = (allTabs[SHEET_TABS.WORK_USERS] || []).filter((r) => r[0] === cWorkId);
      const perm = checkWorkPermission(authUser, cWorkId, work[7], workUsers.map((r) => r[1]));

      if (action === 'REIMBURSE') {
        // Reimbursement rule: ONLY work admin or main admin can press Reimburse!
        if (!perm.isWorkAdmin && !authUser.isMainAdmin) {
          return res.status(403).json({ error: 'Only a Work Admin or Main Admin can reimburse personal expenses' });
        }

        const costing: Costing = {
          costingId: row[0],
          workId: row[1],
          userId: row[2],
          reasonId: row[3],
          materialAmount: row[4] ? Number(row[4]) : undefined,
          metricId: row[5],
          costAmount: Number(row[6]) || 0,
          source: row[7] as any,
          reimbursedAt: row[8] || null,
          reimbursedBy: row[9] || null,
          note: row[10],
          createdAt: row[11],
        };

        const timestamp = new Date().toISOString();
        const updatedCosting = reimburseCosting(costing, authUser.uid, timestamp);

        const updatedRow = [
          updatedCosting.costingId,
          updatedCosting.workId,
          updatedCosting.userId,
          updatedCosting.reasonId,
          updatedCosting.materialAmount ? String(updatedCosting.materialAmount) : '',
          updatedCosting.metricId || '',
          String(updatedCosting.costAmount),
          updatedCosting.source,
          updatedCosting.reimbursedAt,
          updatedCosting.reimbursedBy,
          updatedCosting.note || '',
          updatedCosting.createdAt,
        ];

        await updateRowById(spreadsheetId, SHEET_TABS.COSTINGS, costingId, updatedRow);

        // Audit log
        await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
          timestamp,
          authUser.uid,
          'REIMBURSE',
          `Costing/${costingId}`,
          'reimbursedAt=null',
          `reimbursedAt=${timestamp}, reimbursedBy=${authUser.uid}`,
        ]);

        return res.status(200).json({ costing: updatedCosting });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
