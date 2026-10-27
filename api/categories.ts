import type { VercelRequest, VercelResponse } from './types';
import { verifyAuthHeader } from './authMiddleware';
import { batchReadAllTabs, appendRow, SHEET_TABS } from './sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const spreadsheetId = process.env.SHEET_ID;

    if (!spreadsheetId) {
      return res.status(500).json({ error: 'SHEET_ID is not configured' });
    }

    if (req.method === 'GET') {
      const allTabs = await batchReadAllTabs(spreadsheetId);
      const reasonRows = allTabs[SHEET_TABS.REASONS] || [];
      const metricRows = allTabs[SHEET_TABS.METRICS] || [];

      const reasons = reasonRows.map((r) => ({
        id: r[0],
        name: r[1],
        name_bn: r[2],
        createdBy: r[3],
      }));

      const metrics = metricRows.map((r) => ({
        id: r[0],
        name: r[1],
        name_bn: r[2],
        createdBy: r[3],
      }));

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
