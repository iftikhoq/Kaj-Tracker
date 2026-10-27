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

export function getGoogleSheetsClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not configured');
  }

  const credentials = typeof credentialsJson === 'string' ? JSON.parse(credentialsJson) : credentialsJson;
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
 * Batch read all tabs in one single Google Sheets API call
 */
export async function batchReadAllTabs(spreadsheetId: string, forceFresh = false): Promise<Record<string, string[][]>> {
  const now = Date.now();
  if (!forceFresh && sheetsCache && now - sheetsCache.timestamp < CACHE_TTL_MS) {
    return sheetsCache.data;
  }

  const sheets = getGoogleSheetsClient();
  const ranges = Object.values(SHEET_TABS).map((tab) => `${tab}!A:Z`);

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
  });

  const valueRanges = response.data.valueRanges || [];
  const result: Record<string, string[][]> = {};

  const tabNames = Object.values(SHEET_TABS);
  tabNames.forEach((tabName, index) => {
    const rawRows = valueRanges[index]?.values || [];
    // Omit header row (row 0)
    result[tabName] = rawRows.slice(1);
  });

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

