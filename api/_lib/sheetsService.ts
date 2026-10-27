import { google } from 'googleapis';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 1000; // 10 seconds cache to preserve Google Sheets quota
let sheetsCache: CacheEntry<Record<string, string[][]>> | null = null;

export const SHEET_TABS = {
  USERS: 'Users',
  WORKS: 'Works',
  WORK_USERS: 'WorkUsers',
  COSTINGS: 'Costings',
  REASONS: 'Reasons',
  METRICS: 'Metrics',
  AUDIT_LOG: 'AuditLog',
} as const;

export const TAB_HEADERS: Record<string, string[]> = {
  [SHEET_TABS.USERS]: ['uid', 'name', 'name_bn', 'email', 'role', 'createdAt'],
  [SHEET_TABS.WORKS]: ['workId', 'name', 'name_bn', 'department', 'address', 'totalBudget', 'createdAt', 'createdBy', 'isCompleted'],
  [SHEET_TABS.WORK_USERS]: ['workId', 'userId', 'investment'],
  [SHEET_TABS.COSTINGS]: ['costingId', 'workId', 'userId', 'reasonId', 'materialAmount', 'metricId', 'costAmount', 'source', 'reimbursedAt', 'reimbursedBy', 'note', 'createdAt'],
  [SHEET_TABS.REASONS]: ['id', 'name', 'name_bn', 'createdBy'],
  [SHEET_TABS.METRICS]: ['id', 'name', 'name_bn', 'createdBy'],
  [SHEET_TABS.AUDIT_LOG]: ['timestamp', 'userId', 'action', 'entity', 'before', 'after'],
};

/**
 * Safely parse service account JSON from environment variables.
 * Handles base64 strings, escaped newlines in private keys, and wrapping quotes.
 */
export function parseServiceAccountCredentials(raw?: string): any {
  if (!raw) return null;
  let str = raw.trim();

  // Strip single or double quotes wrapped around the whole string
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  // Handle Base64-encoded JSON if applicable
  if (!str.startsWith('{')) {
    try {
      const decoded = Buffer.from(str, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) {
        str = decoded.trim();
      }
    } catch {
      // Continue with original string
    }
  }

  let parsed: any;
  try {
    parsed = typeof str === 'string' ? JSON.parse(str) : str;
  } catch (err: any) {
    throw new Error(`JSON credentials parse error: ${err.message}. Please check your environment variable format.`);
  }

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {}
  }

  // CRITICAL FOR VERCEL & OPENSSL:
  // Convert escaped literal backslash-n ('\\n') back into real newline characters ('\n')
  if (parsed?.private_key && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

export function getServiceAccountEmail(): string | null {
  try {
    const creds = parseServiceAccountCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return creds?.client_email || null;
  } catch {
    return null;
  }
}

export function getGoogleSheetsClient() {
  const credentials = parseServiceAccountCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not configured in Vercel');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export function invalidateCache() {
  sheetsCache = null;
}

/**
 * Batch read all tabs in one single Google Sheets API call.
 * Gracefully checks existing tab titles to avoid 'Unable to parse range' crashes on uninitialized sheets.
 */
export async function batchReadAllTabs(spreadsheetId: string, forceFresh = false): Promise<Record<string, string[][]>> {
  const now = Date.now();
  if (!forceFresh && sheetsCache && now - sheetsCache.timestamp < CACHE_TTL_MS) {
    return sheetsCache.data;
  }

  const sheets = getGoogleSheetsClient();

  // 1. Check existing sheet metadata so we only request existing tabs
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set((meta.data.sheets || []).map((s) => s.properties?.title || ''));

  const result: Record<string, string[][]> = {};
  const tabsToFetch: string[] = [];

  for (const tabName of Object.values(SHEET_TABS)) {
    result[tabName] = [];
    if (existingTitles.has(tabName)) {
      tabsToFetch.push(tabName);
    }
  }

  // 2. Fetch only existing tabs
  if (tabsToFetch.length > 0) {
    const ranges = tabsToFetch.map((tab) => `${tab}!A:Z`);
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const valueRanges = response.data.valueRanges || [];
    tabsToFetch.forEach((tabName, index) => {
      const rawRows = valueRanges[index]?.values || [];
      // Omit header row (row 0)
      result[tabName] = rawRows.slice(1);
    });
  }

  sheetsCache = {
    data: result,
    timestamp: now,
  };

  return result;
}

/**
 * Initialize all tabs and header columns in a new Google Spreadsheet
 */
export async function initializeSpreadsheetTabs(spreadsheetId: string) {
  const sheets = getGoogleSheetsClient();

  // 1. Get existing sheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.data.sheets || [];
  const existingTitles = new Set(existingSheets.map((s) => s.properties?.title || ''));

  const requests: any[] = [];

  for (const [tabName] of Object.entries(TAB_HEADERS)) {
    if (!existingTitles.has(tabName)) {
      requests.push({
        addSheet: {
          properties: { title: tabName },
        },
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  // 2. Write headers for each tab
  const data = Object.entries(TAB_HEADERS).map(([tabName, headers]) => ({
    range: `${tabName}!A1:${String.fromCharCode(64 + headers.length)}1`,
    values: [headers],
  }));

  // Pre-seed default reasons and metrics so categories never show raw IDs
  data.push({
    range: `${SHEET_TABS.REASONS}!A2:D7`,
    values: [
      ['r1', 'Raw Cement & Brick', 'সিমেন্ট ও ইট', 'system'],
      ['r2', 'Electrical Cables & Lights', 'বৈদ্যুতিক তার ও লাইট', 'system'],
      ['r3', 'Sanitary & Tiles', 'স্যানিটারি ও টাইলস', 'system'],
      ['r4', 'Carpenter & Labor Wage', 'মিস্ত্রি ও শ্রমিক মজুরি', 'system'],
      ['r5', 'Site Transport & Fuel', 'সাইট পরিবহন ও জ্বালানি', 'system'],
      ['r6', 'Food & Refreshment', 'শ্রমিকদের খাবার ও চা-নাস্তা', 'system'],
    ],
  });

  data.push({
    range: `${SHEET_TABS.METRICS}!A2:D7`,
    values: [
      ['m1', 'Bags', 'ব্যাগ', 'system'],
      ['m2', 'Pieces / Nos', 'পিস / সংখ্যা', 'system'],
      ['m3', 'Square Feet (sqft)', 'বর্গফুট (স্কয়ার ফিট)', 'system'],
      ['m4', 'Tons', 'টন', 'system'],
      ['m5', 'Days', 'দিন', 'system'],
      ['m6', 'Liters', 'লিটার', 'system'],
    ],
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  invalidateCache();
  return { success: true, initializedTabs: Object.keys(TAB_HEADERS) };
}

/**
 * Append row to a specific tab
 */
export async function appendRow(spreadsheetId: string, tabName: string, rowValues: any[]) {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  invalidateCache();
  return response.data;
}

/**
 * Update row in a tab by looking up the ID in the first column
 */
export async function updateRowById(
  spreadsheetId: string,
  tabName: string,
  id: string,
  newValues: any[]
) {
  const sheets = getGoogleSheetsClient();
  // Fetch IDs
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:A`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error(`Row with ID ${id} not found in ${tabName}`);
  }

  const sheetRowNumber = rowIndex + 1; // 1-based index
  const range = `${tabName}!A${sheetRowNumber}:${String.fromCharCode(64 + newValues.length)}${sheetRowNumber}`;

  const updateRes = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newValues],
    },
  });

  invalidateCache();
  return updateRes.data;
}

