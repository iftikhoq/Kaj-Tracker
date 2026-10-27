import type { VercelRequest, VercelResponse } from './types';
import { verifyAuthHeader } from './authMiddleware';
import { getGoogleSheetsClient, initializeSpreadsheetTabs, getServiceAccountEmail } from './sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);

    // Only Main Admin can access settings
    if (!authUser.isMainAdmin) {
      return res.status(403).json({ error: 'Forbidden: Settings page is restricted to the Main Administrator' });
    }

    const serviceAccountEmail = getServiceAccountEmail();

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
        serviceAccountEmail,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { action, spreadsheetId } = body;
      const targetSheetId = (spreadsheetId || process.env.SHEET_ID || '').trim();

      if (!targetSheetId) {
        return res.status(400).json({ error: 'স্প্রেডশিট আইডি (Spreadsheet ID) প্রদান করা আবশ্যক।' });
      }

      if (action === 'TEST_CONNECTION') {
        try {
          const sheets = getGoogleSheetsClient();
          const meta = await sheets.spreadsheets.get({ spreadsheetId: targetSheetId });
          return res.status(200).json({
            success: true,
            title: meta.data.properties?.title || 'Connected Spreadsheet',
            sheets: (meta.data.sheets || []).map((s) => s.properties?.title),
            serviceAccountEmail,
          });
        } catch (apiErr: any) {
          const errMsg = apiErr.message || '';
          const status = apiErr.code || apiErr.status || (apiErr.response?.status) || 500;

          if (status === 403 || errMsg.includes('The caller does not have permission') || errMsg.includes('permission')) {
            return res.status(403).json({
              error: `গুগল শিট পারমিশন এরর (403): অনুগ্রহ করে আপনার গুগল শিটে গিয়ে 'Share' বাটনে ক্লিক করে এই সার্ভিস অ্যাকাউন্ট ইমেইলটিকে 'Editor' হিসেবে যোগ করুন: ${serviceAccountEmail || '(সার্ভিস অ্যাকাউন্ট ইমেইল)'}`,
              serviceAccountEmail,
              code: 'PERMISSION_DENIED',
            });
          }

          if (status === 404 || errMsg.includes('Requested entity was not found') || errMsg.includes('not found')) {
            return res.status(404).json({
              error: `গুগল শিট পাওয়া যায়নি (404): স্প্রেডশিট আইডি (${targetSheetId}) সঠিক কিনা এবং শিটটিতে সার্ভিস অ্যাকাউন্ট (${serviceAccountEmail || ''}) শেয়ার করা আছে কিনা যাচাই করুন।`,
              serviceAccountEmail,
              code: 'NOT_FOUND',
            });
          }

          if (errMsg.includes('has not been used in project') || errMsg.includes('is disabled')) {
            return res.status(400).json({
              error: `গুগল ক্লাউডে Google Sheets API চালু করা নেই। অনুগ্রহ করে Google Cloud Console থেকে "Google Sheets API" Enable করুন।`,
              code: 'API_DISABLED',
            });
          }

          return res.status(500).json({
            error: `গুগল শিট সংযোগ ব্যর্থ: ${errMsg}`,
            serviceAccountEmail,
          });
        }
      }

      if (action === 'INITIALIZE_SHEETS') {
        try {
          const result = await initializeSpreadsheetTabs(targetSheetId);
          return res.status(200).json(result);
        } catch (initErr: any) {
          const errMsg = initErr.message || '';
          const status = initErr.code || initErr.status || (initErr.response?.status) || 500;

          if (status === 403 || errMsg.includes('permission')) {
            return res.status(403).json({
              error: `পারমিশন নেই: টেবিল তৈরি করতে হলে সার্ভিস অ্যাকাউন্ট ইমেইল (${serviceAccountEmail || ''})-কে শিটের 'Editor' পারমিশন দিতে হবে।`,
            });
          }

          return res.status(500).json({
            error: `টেবিল ইনিশিয়ালাইজেশন ব্যর্থ: ${errMsg}`,
          });
        }
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
