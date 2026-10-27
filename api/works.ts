import type { VercelRequest, VercelResponse } from './_lib/types';
import { verifyAuthHeader, checkWorkPermission } from './_lib/authMiddleware';
import { batchReadAllTabs, appendRow, updateRowById, SHEET_TABS } from './_lib/sheetsService';
import { Work } from '../src/types/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = (req.headers['x-sheet-id'] as string) || (req.query.sheetId as string) || process.env.SHEET_ID;

    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      if (req.method === 'GET') {
        return res.status(200).json({ works: [] });
      }
      return res.status(400).json({ error: 'Spreadsheet ID and GOOGLE_SERVICE_ACCOUNT_JSON are required.' });
    }

    if (req.method === 'GET') {
      const allTabs = await batchReadAllTabs(spreadsheetId);
      const workRows = allTabs[SHEET_TABS.WORKS] || [];
      const workUserRows = allTabs[SHEET_TABS.WORK_USERS] || [];

      const allWorks: Work[] = workRows.map((r) => ({
        workId: r[0],
        name: r[1],
        name_bn: r[2],
        department: r[3],
        address: r[4],
        totalBudget: Number(r[5]) || 0,
        createdAt: r[6],
        createdBy: r[7],
        isCompleted: r[8] === 'TRUE' || r[8] === 'true',
      }));

      if (authUser.isMainAdmin) {
        return res.status(200).json({ works: allWorks });
      }

      // Filter for works assigned to or created by this user
      const assignedWorkIds = new Set(
        workUserRows.filter((r) => r[1] === authUser.uid).map((r) => r[0])
      );

      const accessibleWorks = allWorks.filter(
        (w) => w.createdBy === authUser.uid || assignedWorkIds.has(w.workId)
      );

      return res.status(200).json({ works: accessibleWorks });
    }

    if (req.method === 'POST') {
      const { name, name_bn, department, address, totalBudget } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Work name is required' });
      }

      const workId = `work-${Date.now()}`;
      const createdAt = new Date().toISOString();

      const newRow = [
        workId,
        name,
        name_bn || name,
        department || '',
        address || '',
        String(totalBudget || 0),
        createdAt,
        authUser.uid,
        'FALSE',
      ];

      await appendRow(spreadsheetId, SHEET_TABS.WORKS, newRow);

      // Automatically assign creator to WorkUsers
      await appendRow(spreadsheetId, SHEET_TABS.WORK_USERS, [workId, authUser.uid, '0']);

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        createdAt,
        authUser.uid,
        'CREATE_WORK',
        `Work/${workId}`,
        '',
        JSON.stringify({ name, totalBudget }),
      ]);

      return res.status(201).json({
        work: {
          workId,
          name,
          name_bn: name_bn || name,
          department,
          address,
          totalBudget: Number(totalBudget) || 0,
          createdAt,
          createdBy: authUser.uid,
          isCompleted: false,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { workId, isCompleted, name, name_bn, department, address, totalBudget } = req.body;
      if (!workId) return res.status(400).json({ error: 'workId is required' });

      const allTabs = await batchReadAllTabs(spreadsheetId, true);
      const workRows = allTabs[SHEET_TABS.WORKS] || [];
      const row = workRows.find((r) => r[0] === workId);
      if (!row) return res.status(404).json({ error: 'Work not found' });

      // Permission check: only work creator or main admin can update work
      if (!authUser.isMainAdmin && row[7] !== authUser.uid) {
        return res.status(403).json({ error: 'Only the Work Admin or Main Admin can modify this work' });
      }

      const updatedRow = [
        row[0],
        name !== undefined ? name : row[1],
        name_bn !== undefined ? name_bn : row[2],
        department !== undefined ? department : row[3],
        address !== undefined ? address : row[4],
        totalBudget !== undefined ? String(totalBudget) : row[5],
        row[6],
        row[7],
        isCompleted !== undefined ? (isCompleted ? 'TRUE' : 'FALSE') : row[8],
      ];

      await updateRowById(spreadsheetId, SHEET_TABS.WORKS, workId, updatedRow);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
