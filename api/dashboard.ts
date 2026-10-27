import type { VercelRequest, VercelResponse } from './_lib/types.js';
import { verifyAuthHeader, checkWorkPermission } from './_lib/authMiddleware.js';
import { batchReadAllTabs, SHEET_TABS } from './_lib/sheetsService.js';
import { calculateDashboardStats, calculateUserExpenseSummaries, calculateCategorySummaries, DEFAULT_REASONS } from './_lib/mathEngine.js';
import type { Work, Costing, WorkUser, User, Reason } from './_lib/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await verifyAuthHeader(req.headers.authorization);
    const { workId } = req.query;

    if (!workId || typeof workId !== 'string') {
      return res.status(400).json({ error: 'workId query parameter is required' });
    }

    const spreadsheetId = (req.headers['x-sheet-id'] as string) || (req.query.sheetId as string) || process.env.SHEET_ID;
    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return res.status(200).json({
        stats: { totalBudget: 0, totalExpense: 0, totalInvestment: 0, remainingBudget: 0, isOverBudget: false },
        userSummaries: [],
        categorySummaries: [],
        recentCostings: [],
      });
    }

    const allTabs = await batchReadAllTabs(spreadsheetId);

    // Parse Works
    const workRows = allTabs[SHEET_TABS.WORKS] || [];
    const workRow = workRows.find((r) => r[0] === workId);
    if (!workRow) {
      return res.status(404).json({ error: 'Work project not found' });
    }

    const work: Work = {
      workId: workRow[0],
      name: workRow[1],
      name_bn: workRow[2],
      department: workRow[3],
      address: workRow[4],
      totalBudget: Number(workRow[5]) || 0,
      createdAt: workRow[6],
      createdBy: workRow[7],
      isCompleted: workRow[8] === 'TRUE' || workRow[8] === 'true',
    };

    // Parse WorkUsers
    const workUserRows = allTabs[SHEET_TABS.WORK_USERS] || [];
    const assignedWorkUsers: WorkUser[] = workUserRows
      .filter((r) => r[0] === workId)
      .map((r) => ({
        workId: r[0],
        userId: r[1],
        investment: Number(r[2]) || 0,
      }));

    // Permission Check
    const assignedUserIds = assignedWorkUsers.map((wu) => wu.userId);
    const perm = checkWorkPermission(authUser, work.workId, work.createdBy, assignedUserIds);

    if (!perm.isAllowed) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this work project' });
    }

    // Parse Users
    const userRows = allTabs[SHEET_TABS.USERS] || [];
    const users: User[] = userRows.map((r) => ({
      uid: r[0],
      name: r[1],
      name_bn: r[2],
      email: r[3],
      role: (r[4] as any) || 'user',
      createdAt: r[5],
    }));

    // Parse Costings
    const costingRows = allTabs[SHEET_TABS.COSTINGS] || [];
    const costings: Costing[] = costingRows
      .filter((r) => r[1] === workId)
      .map((r) => ({
        costingId: r[0],
        workId: r[1],
        userId: r[2],
        reasonId: r[3],
        materialAmount: r[4] ? Number(r[4]) : undefined,
        metricId: r[5],
        costAmount: Number(r[6]) || 0,
        source: (r[7] as any) || 'BUDGET',
        reimbursedAt: r[8] || null,
        reimbursedBy: r[9] || null,
        note: r[10],
        createdAt: r[11],
      }));

    // Parse Reasons
    const reasonRows = allTabs[SHEET_TABS.REASONS] || [];
    const reasons: Reason[] = reasonRows.map((r) => ({
      id: r[0],
      name: r[1],
      name_bn: r[2],
      createdBy: r[3],
    }));

    // User & Reason Map for display
    const userMap = new Map<string, string>(users.map((u) => [u.uid, u.name_bn || u.name]));
    const reasonMap = new Map<string, string>();
    DEFAULT_REASONS.forEach((r) => reasonMap.set(r.id, r.name_bn || r.name));
    reasons.forEach((r) => reasonMap.set(r.id, r.name_bn || r.name));

    // Enrich costings with display names
    costings.forEach((c) => {
      c.userName = userMap.get(c.userId) || c.userId;
      c.reasonName = reasonMap.get(c.reasonId) || c.reasonId;
    });

    // Perform financial calculations
    const stats = calculateDashboardStats(work, costings, assignedWorkUsers);
    const userSummaries = calculateUserExpenseSummaries(workId, users, costings, assignedWorkUsers);
    const categorySummaries = calculateCategorySummaries(workId, costings, reasons);

    // Current user's specific details
    const mySummary = userSummaries.find((u) => u.userId === authUser.uid) || {
      userId: authUser.uid,
      userName: authUser.name,
      userEmail: authUser.email,
      investment: 0,
      personalSpending: 0,
      spentFromBudget: 0,
      totalCostLogged: 0,
    };

    return res.status(200).json({
      work,
      stats,
      mySummary,
      userSummaries,
      categorySummaries,
      recentCostings: costings.slice(-10).reverse(),
      permissions: perm,
    });
  } catch (err: any) {
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return res.status(401).json({ error: err.message });
    }
    console.error('API /dashboard error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
