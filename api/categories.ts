import type { VercelRequest, VercelResponse } from './_lib/types.js';
import { verifyAuthHeader } from './_lib/authMiddleware.js';
import { batchReadAllTabs, appendRow, SHEET_TABS } from './_lib/sheetsService.js';
import { DEFAULT_REASONS } from './_lib/mathEngine.js';
import type { Reason, Metric } from './_lib/models.js';

const DEFAULT_METRICS = [
  { id: 'm1', name: 'Bags', name_bn: 'ব্যাগ', createdBy: 'system' },
  { id: 'm2', name: 'Pieces / Nos', name_bn: 'পিস / সংখ্যা', createdBy: 'system' },
  { id: 'm3', name: 'Square Feet (sqft)', name_bn: 'বর্গফুট (স্কয়ার ফিট)', createdBy: 'system' },
  { id: 'm4', name: 'Tons', name_bn: 'টন', createdBy: 'system' },
  { id: 'm5', name: 'Days', name_bn: 'দিন', createdBy: 'system' },
  { id: 'm6', name: 'Liters', name_bn: 'লিটার', createdBy: 'system' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = (req.headers['x-sheet-id'] as string) || (req.query.sheetId as string) || process.env.SHEET_ID;

    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      if (req.method === 'GET') {
        return res.status(200).json({ reasons: [], metrics: [] });
      }
      return res.status(400).json({ error: 'Spreadsheet ID and GOOGLE_SERVICE_ACCOUNT_JSON are required.' });
    }

    if (req.method === 'GET') {
      const allTabs = await batchReadAllTabs(spreadsheetId);
      const reasonRows = allTabs[SHEET_TABS.REASONS] || [];
      const metricRows = allTabs[SHEET_TABS.METRICS] || [];

      let reasons: Reason[] = reasonRows.map((r) => ({
        id: r[0],
        name: r[1],
        name_bn: r[2],
        createdBy: r[3],
      }));

      let metrics: Metric[] = metricRows.map((r) => ({
        id: r[0],
        name: r[1],
        name_bn: r[2],
        createdBy: r[3],
      }));

      // If spreadsheet has no custom categories yet, provide default categories
      if (reasons.length === 0) {
        reasons = DEFAULT_REASONS;
      }
      if (metrics.length === 0) {
        metrics = DEFAULT_METRICS;
      }

      return res.status(200).json({ reasons, metrics });
    }

    if (req.method === 'POST') {
      const { type, name, name_bn } = req.body;
      if (!type || !name) {
        return res.status(400).json({ error: 'type (reason | metric) and name are required' });
      }

      const id = `${type === 'reason' ? 'r' : 'm'}-${Date.now()}`;
      const newRow = [id, name, name_bn || name, authUser.uid];

      const tab = type === 'reason' ? SHEET_TABS.REASONS : SHEET_TABS.METRICS;
      await appendRow(spreadsheetId, tab, newRow);

      return res.status(201).json({ item: { id, name, name_bn: name_bn || name, createdBy: authUser.uid } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

