import type { VercelRequest, VercelResponse } from './_lib/types.js';
import { verifyAuthHeader, checkWorkPermission } from './_lib/authMiddleware.js';
import {
  batchReadAllTabs,
  appendRow,
  updateRowById,
  SHEET_TABS,
  getGoogleSheetsClient,
  invalidateCache,
} from './_lib/sheetsService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = (req.headers['x-sheet-id'] as string) || (req.query.sheetId as string) || process.env.SHEET_ID;

    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      if (req.method === 'GET') {
        return res.status(200).json({ users: [], workUsers: [] });
      }
      return res.status(400).json({ error: 'Spreadsheet ID and GOOGLE_SERVICE_ACCOUNT_JSON are required.' });
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
      const body = req.body || {};
      const { action, user, workId, userId, investment } = body;

      // 1. Sync / Register newly signed-in user into Google Sheets 'Users' tab
      if (action === 'sync_user' || user) {
        const targetUser = user || body;
        if (!targetUser.uid || !targetUser.email) {
          return res.status(400).json({ error: 'uid and email are required to sync user' });
        }

        const allTabs = await batchReadAllTabs(spreadsheetId, true);
        const userRows = allTabs[SHEET_TABS.USERS] || [];
        const existingIndex = userRows.findIndex(
          (r) => r[0] === targetUser.uid || r[3]?.toLowerCase() === targetUser.email?.toLowerCase()
        );

        const sheetsClient = getGoogleSheetsClient();
        const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || 'ifti.k.hoq@gmail.com').toLowerCase().trim();
        const role = targetUser.email.toLowerCase().trim() === mainAdminEmail ? 'main_admin' : (targetUser.role || 'user');

        if (existingIndex === -1) {
          // New user, append to Users tab
          const newRow = [
            targetUser.uid,
            targetUser.name || targetUser.email.split('@')[0],
            targetUser.name_bn || targetUser.name || '',
            targetUser.email,
            role,
            targetUser.createdAt || new Date().toISOString(),
          ];
          await appendRow(spreadsheetId, SHEET_TABS.USERS, newRow);
        } else {
          // Update existing user row if name/role changed
          const rowNum = existingIndex + 2;
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_TABS.USERS}!A${rowNum}:F${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[
                targetUser.uid,
                targetUser.name || userRows[existingIndex][1],
                targetUser.name_bn || userRows[existingIndex][2] || '',
                targetUser.email,
                role,
                userRows[existingIndex][5] || new Date().toISOString(),
              ]],
            },
          });
        }

        invalidateCache();
        return res.status(200).json({ success: true, user: { ...targetUser, role } });
      }

      // 2. Assign User to Work with initial investment
      if (!workId || !userId) {
        return res.status(400).json({ error: 'workId and userId are required' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId, true);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      // Check if user is already assigned in WorkUsers tab
      const sheetsClient = getGoogleSheetsClient();
      const resData = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_TABS.WORK_USERS}!A:C`,
      });

      const rows = resData.data.values || [];
      const rowIndex = rows.findIndex((r: any) => r[0] === workId && r[1] === userId);

      if (rowIndex !== -1) {
        // Already assigned, update investment
        const rowNum = rowIndex + 1;
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_TABS.WORK_USERS}!A${rowNum}:C${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[workId, userId, String(investment || 0)]],
          },
        });
      } else {
        // Not assigned, append new assignment
        await appendRow(spreadsheetId, SHEET_TABS.WORK_USERS, [workId, userId, String(investment || 0)]);
      }

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        new Date().toISOString(),
        authUser.uid,
        'ASSIGN_USER',
        `WorkUser/${workId}/${userId}`,
        '',
        JSON.stringify({ investment: Number(investment) || 0 }),
      ]);

      invalidateCache();
      return res.status(201).json({ success: true, workUser: { workId, userId, investment: Number(investment) || 0 } });
    }

    if (req.method === 'PATCH') {
      const { workId, userId, investment } = req.body;
      if (!workId || !userId || investment === undefined) {
        return res.status(400).json({ error: 'workId, userId, and investment are required' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId, true);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      const isSelf = authUser.uid === userId;
      const isWorkAdmin = work[7] === authUser.uid;

      if (!isSelf && !isWorkAdmin && !authUser.isMainAdmin) {
        return res.status(403).json({ error: 'Permission denied: Cannot edit another user investment' });
      }

      // Find the row in WorkUsers tab
      const sheetsClient = getGoogleSheetsClient();
      const resData = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_TABS.WORK_USERS}!A:C`,
      });

      const rows = resData.data.values || [];
      const rowIndex = rows.findIndex((r: any) => r[0] === workId && r[1] === userId);

      if (rowIndex === -1) {
        // If not found in WorkUsers, append new assignment with investment
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

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        new Date().toISOString(),
        authUser.uid,
        'UPDATE_INVESTMENT',
        `WorkUser/${workId}/${userId}`,
        '',
        JSON.stringify({ investment: Number(investment) }),
      ]);

      invalidateCache();
      return res.status(200).json({ success: true, investment: Number(investment) });
    }

    if (req.method === 'DELETE') {
      const workId = (req.query.workId as string) || req.body?.workId;
      const userId = (req.query.userId as string) || req.body?.userId;

      if (!workId || !userId) {
        return res.status(400).json({ error: 'workId and userId are required' });
      }

      const allTabs = await batchReadAllTabs(spreadsheetId, true);
      const work = (allTabs[SHEET_TABS.WORKS] || []).find((r) => r[0] === workId);
      if (!work) return res.status(404).json({ error: 'Work not found' });

      // Permission check: Only Work Admin or Main Admin can remove members
      const isWorkAdmin = work[7] === authUser.uid;
      if (!isWorkAdmin && !authUser.isMainAdmin) {
        return res.status(403).json({ error: 'Only Work Admin or Main Admin can remove members from this work' });
      }

      // Creator of the work cannot be removed from their own work
      if (userId === work[7] && !authUser.isMainAdmin) {
        return res.status(400).json({ error: 'The work creator cannot be removed from their own work' });
      }

      const sheetsClient = getGoogleSheetsClient();
      const meta = await sheetsClient.spreadsheets.get({ spreadsheetId });
      const workUsersSheet = (meta.data.sheets || []).find(
        (s) => s.properties?.title === SHEET_TABS.WORK_USERS
      );
      const sheetIdNum = workUsersSheet?.properties?.sheetId;

      const resData = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_TABS.WORK_USERS}!A:C`,
      });

      const rows = resData.data.values || [];
      const rowIndex = rows.findIndex((r: any) => r[0] === workId && r[1] === userId);

      if (rowIndex !== -1) {
        if (sheetIdNum !== undefined) {
          await sheetsClient.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: sheetIdNum,
                      dimension: 'ROWS',
                      startIndex: rowIndex,
                      endIndex: rowIndex + 1,
                    },
                  },
                },
              ],
            },
          });
        } else {
          const rowNum = rowIndex + 1;
          await sheetsClient.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_TABS.WORK_USERS}!A${rowNum}:C${rowNum}`,
          });
        }
      }

      // Audit Log
      await appendRow(spreadsheetId, SHEET_TABS.AUDIT_LOG, [
        new Date().toISOString(),
        authUser.uid,
        'REMOVE_USER',
        `WorkUser/${workId}/${userId}`,
        '',
        JSON.stringify({ removedUserId: userId }),
      ]);

      invalidateCache();
      return res.status(200).json({ success: true, removedUserId: userId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
