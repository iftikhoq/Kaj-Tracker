import type { VercelRequest, VercelResponse } from './types';
import { verifyAuthHeader } from './authMiddleware';
import { getGoogleSheetsClient, initializeSpreadsheetTabs } from './sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);

    // Only Main Admin can access settings
    if (!authUser.isMainAdmin) {
      return res.status(403).json({ error: 'Forbidden: Settings page is restricted to the Main Administrator' });
    }

    if (req.method === 'GET') {
      const isGoogleConfigured = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const isFirebaseConfigured = Boolean(process.env.FIREBASE_ADMIN_JSON);
      const configuredSheetId = process.env.SHEET_ID || '';

      return res.status(200).json({
        secrets: {
          googleServiceAccount: isGoogleConfigured,
          firebaseAdmin: isFirebaseConfigured,
          sheetIdConfigured: Boolean(configuredSheetId),
        },
        sheetId: configuredSheetId,
      });
    }

    if (req.method === 'POST') {
      const { action, spreadsheetId } = req.body;
      const targetSheetId = spreadsheetId || process.env.SHEET_ID;

      if (!targetSheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is required' });
      }

      if (action === 'TEST_CONNECTION') {
        const sheets = getGoogleSheetsClient();
        const meta = await sheets.spreadsheets.get({ spreadsheetId: targetSheetId });
        return res.status(200).json({
          success: true,
          title: meta.data.properties?.title || 'Connected Spreadsheet',
          sheets: (meta.data.sheets || []).map((s) => s.properties?.title),
        });
      }

      if (action === 'INITIALIZE_SHEETS') {
        const result = await initializeSpreadsheetTabs(targetSheetId);
        return res.status(200).json(result);
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
