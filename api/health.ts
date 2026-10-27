import type { VercelRequest, VercelResponse } from './_lib/types';
import { parseServiceAccountCredentials } from './_lib/sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let googleCredsStatus = 'MISSING';
  let clientEmail: string | null = null;
  let projectId: string | null = null;
  let privateKeyValid = false;

  const rawGoogle = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawGoogle) {
    try {
      const parsed = parseServiceAccountCredentials(rawGoogle);
      if (parsed) {
        googleCredsStatus = 'PARSED_OK';
        clientEmail = parsed.client_email || null;
        projectId = parsed.project_id || null;
        privateKeyValid = Boolean(parsed.private_key && parsed.private_key.includes('BEGIN PRIVATE KEY'));
      } else {
        googleCredsStatus = 'FAILED_EMPTY_OR_INVALID';
      }
    } catch (e: any) {
      googleCredsStatus = `ERROR: ${e.message}`;
    }
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: {
      hasGoogleServiceAccount: Boolean(rawGoogle),
      googleServiceAccountLength: rawGoogle ? rawGoogle.length : 0,
      googleCredsStatus,
      clientEmail,
      projectId,
      privateKeyValid,
      hasFirebaseAdmin: Boolean(process.env.FIREBASE_ADMIN_JSON),
      hasSheetId: Boolean(process.env.SHEET_ID),
      sheetId: process.env.SHEET_ID || null,
      mainAdminEmail: process.env.MAIN_ADMIN_EMAIL || 'ifti.k.hoq@gmail.com',
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
