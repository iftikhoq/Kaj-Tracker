import admin from 'firebase-admin';
import { parseServiceAccountCredentials } from './sheetsService';

// Initialize Firebase Admin lazily
let isFirebaseInitialized = false;

export function initFirebaseAdmin() {
  if (isFirebaseInitialized) return admin;

  // Use FIREBASE_ADMIN_JSON if present, or fallback to GOOGLE_SERVICE_ACCOUNT_JSON
  const adminCredentials = process.env.FIREBASE_ADMIN_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!adminCredentials) {
    console.warn('Neither FIREBASE_ADMIN_JSON nor GOOGLE_SERVICE_ACCOUNT_JSON found.');
    return null;
  }

  try {
    const creds = parseServiceAccountCredentials(adminCredentials);
    if (!creds) return null;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
      });
    }
    isFirebaseInitialized = true;
    return admin;
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
    return null;
  }
}

export interface AuthUserContext {
  uid: string;
  email: string;
  name: string;
  isMainAdmin: boolean;
}

/**
 * Verify Firebase Bearer token from incoming authorization header
 */
export async function verifyAuthHeader(authHeader?: string): Promise<AuthUserContext> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED: Missing or malformed Bearer token');
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Handle mock dev tokens for testing and preview
  if (token.startsWith('dev_token_')) {
    const isMainAdmin = token.includes('admin');
    const mainEmail = (process.env.MAIN_ADMIN_EMAIL || 'ifti.k.hoq@gmail.com').toLowerCase().trim();
    return {
      uid: token.replace('dev_token_', ''),
      email: isMainAdmin ? mainEmail : 'user@kajtracker.com',
      name: isMainAdmin ? 'Admin Ifti' : 'Project Member',
      isMainAdmin,
    };
  }

  const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || 'ifti.k.hoq@gmail.com').toLowerCase().trim();

  // If Firebase Admin is initialized, verify cryptographically
  const adminApp = initFirebaseAdmin();
  if (adminApp) {
    try {
      const decoded = await adminApp.auth().verifyIdToken(token);
      const userEmail = (decoded.email || '').toLowerCase().trim();
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        isMainAdmin: mainAdminEmail !== '' && userEmail === mainAdminEmail,
      };
    } catch (tokenErr) {
      console.warn('verifyIdToken failed, checking token fallback:', tokenErr);
    }
  }

  // Graceful fallback: decode standard JWT payload when Firebase Admin credentials are not yet configured on Vercel
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const userEmail = (payload.email || '').toLowerCase().trim();
      return {
        uid: payload.user_id || payload.sub || 'user',
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'User',
        isMainAdmin: mainAdminEmail !== '' && userEmail === mainAdminEmail,
      };
    }
  } catch (decodeErr) {
    console.error('Failed to parse JWT payload fallback:', decodeErr);
  }

  throw new Error('UNAUTHORIZED: Invalid or unverifiable authentication token');
}

/**
 * Verify if user is assigned to work or is main admin
 */
export function checkWorkPermission(
  user: AuthUserContext,
  workId: string,
  workCreatedBy: string,
  assignedUserIds: string[]
): { isAllowed: boolean; isWorkAdmin: boolean } {
  if (user.isMainAdmin) {
    return { isAllowed: true, isWorkAdmin: true };
  }

  const isWorkAdmin = workCreatedBy === user.uid;
  const isAssigned = isWorkAdmin || assignedUserIds.includes(user.uid);

  return {
    isAllowed: isAssigned,
    isWorkAdmin,
  };
}

