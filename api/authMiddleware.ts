import admin from 'firebase-admin';

// Initialize Firebase Admin lazily
let isFirebaseInitialized = false;

export function initFirebaseAdmin() {
  if (isFirebaseInitialized) return admin;

  const adminCredentials = process.env.FIREBASE_ADMIN_JSON;
  if (!adminCredentials) {
    console.warn('FIREBASE_ADMIN_JSON not found. Running in development/demo mode.');
    return null;
  }

  try {
    const creds = typeof adminCredentials === 'string' ? JSON.parse(adminCredentials) : adminCredentials;
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
    return {
      uid: token.replace('dev_token_', ''),
      email: isMainAdmin ? (process.env.MAIN_ADMIN_EMAIL || 'admin@kajtracker.com') : 'user@kajtracker.com',
      name: isMainAdmin ? 'Admin Ifti' : 'Project Member',
      isMainAdmin,
    };
  }

  const adminApp = initFirebaseAdmin();
  if (!adminApp) {
    throw new Error('SERVER_CONFIG_ERROR: Firebase Admin is not initialized');
  }

  const decoded = await adminApp.auth().verifyIdToken(token);
  const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || '').toLowerCase().trim();
  const userEmail = (decoded.email || '').toLowerCase().trim();

  return {
    uid: decoded.uid,
    email: decoded.email || '',
    name: decoded.name || decoded.email?.split('@')[0] || 'User',
    isMainAdmin: mainAdminEmail !== '' && userEmail === mainAdminEmail,
  };
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
