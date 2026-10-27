import type { VercelRequest, VercelResponse } from './types';
import { verifyAuthHeader, checkWorkPermission } from './authMiddleware';
import { batchReadAllTabs, appendRow, updateRowById, SHEET_TABS } from './sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = process.env.SHEET_ID;

    if (!spreadsheetId) {
      return res.status(500).json({ error: 'SHEET_ID is not configured' });
    }

    if (req.method === 'GET') {
      const allTabs = await batchReadAllTabs(spreadsheetId);
      const userRows = allTabs[SHEET_TABS.USERS] || [];
      const users = userRows.map((r) => ({
        uid: r[0],
        name: r[1],
        name_bn: r[2],
        email: r[3],
        role: r[4] || 'user',
        createdAt: r[5],
      }));

      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const { workId, userId, investment } = req.body;
      if (!workId || !userId) {
        return res.status(400).json({ error: 'workId and userId are required' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      // Only Work Admin or Main Admin can assign members
      const workUsers = (allTabs[SHEET_TABS.WORK_USERS] || []).filter((r) => r[0] === workId);
      const perm = checkWorkPermission(authUser, workId, work[7], workUsers.map((r) => r[1]));

      if (!perm.isWorkAdmin && !authUser.isMainAdmin) {
        return res.status(403).json({ error: 'Only Work Admin or Main Admin can assign members' });
      }

      const newRow = [workId, userId, String(investment || 0)];
      await appendRow(spreadsheetId, SHEET_TABS.WORK_USERS, newRow);

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        new Date().toISOString(),
        authUser.uid,
        'ASSIGN_USER',
        `WorkUser/${workId}/${userId}`,
        '',
        JSON.stringify({ investment }),
      ]);

      return res.status(201).json({ success: true, workUser: { workId, userId, investment: Number(investment) || 0 } });
    }

    if (req.method === 'PATCH') {
      const { workId, userId, investment } = req.body;
      if (!workId || !userId || investment === undefined) {
        return res.status(400).json({ error: 'workId, userId, and investment are required' });
      }

      // Check permission: user can edit their own investment, or admin can edit anyone's
      const allTabs = await batchReadAllTabs(spreadsheetId);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      const workUsers = (allTabs[SHEET_TABS.WORK_USERS] || []).filter((r) => r[0] === workId);
      const perm = checkWorkPermission(authUser, workId, work[7], workUsers.map((r) => r[1]));

      const isSelf = authUser.uid === userId;
      if (!isSelf && !perm.isWorkAdmin && !authUser.isMainAdmin) {
        return res.status(403).json({ error: 'Permission denied: Cannot edit another user investment' });
      }

      // Find the row in WorkUsers tab
      const sheetsClient = (await import('./sheetsService')).getGoogleSheetsClient();
      const resData = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_TABS.WORK_USERS}!A:C`,
      });

      const rows = resData.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] === workId && r[1] === userId);

      if (rowIndex === -1) {
        // Not found, append
        await appendRow(spreadsheetId, SHEET_TABS.WORK_USERS, [workId, userId, String(investment)]);
      } else {
        const rowNum = rowIndex + 1;
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_TABS.WORK_USERS}!A${rowNum}:C${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[workId, userId, String(investment)]],
          },
        });
      }

      (await import('./sheetsService')).invalidateCache();

      return res.status(200).json({ success: true, investment: Number(investment) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

