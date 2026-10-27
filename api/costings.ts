import type { VercelRequest, VercelResponse } from './_lib/types.js';
import { verifyAuthHeader, checkWorkPermission } from './_lib/authMiddleware.js';
import { batchReadAllTabs, appendRow, updateRowById, SHEET_TABS } from './_lib/sheetsService.js';
import { reimburseCosting, DEFAULT_REASONS } from './_lib/mathEngine.js';
import type { Costing } from './_lib/models.js';

const DEFAULT_METRIC_MAP: Record<string, string> = {
  m1: 'ব্যাগ / Bags',
  m2: 'পিস / Nos',
  m3: 'বর্গফুট / sqft',
  m4: 'টন / Tons',
  m5: 'দিন / Days',
  m6: 'লিটার / Liters',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = (req.headers['x-sheet-id'] as string) || (req.query.sheetId as string) || process.env.SHEET_ID;

    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      if (req.method === 'GET') {
        return res.status(200).json({ costings: [] });
      }
      return res.status(400).json({ error: 'Spreadsheet ID and GOOGLE_SERVICE_ACCOUNT_JSON are required.' });
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
      const userRows = allTabs[SHEET_TABS.USERS] || [];
      const reasonRows = allTabs[SHEET_TABS.REASONS] || [];
      const metricRows = allTabs[SHEET_TABS.METRICS] || [];

      const userMap = new Map<string, string>(userRows.map((r) => [r[0], r[2] || r[1] || r[3]]));
      const reasonMap = new Map<string, string>();
      DEFAULT_REASONS.forEach((r) => reasonMap.set(r.id, r.name_bn || r.name));
      reasonRows.forEach((r) => reasonMap.set(r[0], r[2] || r[1]));

      const metricMap = new Map<string, string>();
      Object.entries(DEFAULT_METRIC_MAP).forEach(([k, v]) => metricMap.set(k, v));
      metricRows.forEach((r) => metricMap.set(r[0], r[2] || r[1]));

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
        userName: userMap.get(r[2]) || r[2],
        reasonName: reasonMap.get(r[3]) || r[3],
        metricName: r[5] ? metricMap.get(r[5]) || r[5] : undefined,
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
        // Reimbursement rule: ONLY the expense owner can mark it as reimbursed
        const expenseOwnerId = row[2];
        if (expenseOwnerId !== authUser.uid) {
          return res.status(403).json({ error: 'Only the expense owner can reimburse this personal expense' });
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
