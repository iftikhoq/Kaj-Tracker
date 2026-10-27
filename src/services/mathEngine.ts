import { Costing, DashboardStats, UserExpenseSummary, CategorySummary, Work, WorkUser, User, Reason } from '../types/models';

/**
 * Pure calculation engine for Kaj Tracker.
 * Rules:
 * - Calculated, never stored: total expense, personal spending, spent from budget, total investment.
 * - Total expense = sum of costings where source === 'BUDGET' OR reimbursedAt is non-empty.
 * - Personal spending = sum of costings where source === 'PERSONAL' AND (reimbursedAt is null or empty).
 * - Spent from budget = sum of costings where source === 'BUDGET' OR reimbursedAt is non-empty.
 * - Total investment = sum of assigned users' investments for that work.
 * - Remaining budget = totalBudget - totalExpense.
 */

export function calculateDashboardStats(
  work: Work,
  costings: Costing[],
  workUsers: WorkUser[]
): DashboardStats {
  const workCostings = costings.filter((c) => c.workId === work.workId);
  const relevantWorkUsers = workUsers.filter((wu) => wu.workId === work.workId);

  const totalBudget = Number(work.totalBudget) || 0;

  // Total expense only counts budget-paid costings (source === 'BUDGET' or reimbursed)
  const totalExpense = workCostings.reduce((sum, c) => {
    const isBudgetPaid = c.source === 'BUDGET' || Boolean(c.reimbursedAt);
    return isBudgetPaid ? sum + (Number(c.costAmount) || 0) : sum;
  }, 0);

  // Total investment is the sum of investments made by users assigned to this work
  const totalInvestment = relevantWorkUsers.reduce((sum, wu) => {
    return sum + (Number(wu.investment) || 0);
  }, 0);

  const remainingBudget = totalBudget - totalExpense;
  const isOverBudget = totalExpense > totalBudget;
  const budgetUtilizationPercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  return {
    workId: work.workId,
    totalBudget,
    totalExpense,
    totalInvestment,
    remainingBudget,
    isOverBudget,
    budgetUtilizationPercent: Math.min(Math.round(budgetUtilizationPercent * 10) / 10, 999),
  };
}

/**
 * Calculates per-user expense metrics for a specific work
 */
export function calculateUserExpenseSummaries(
  workId: string,
  users: User[],
  costings: Costing[],
  workUsers: WorkUser[]
): UserExpenseSummary[] {
  const workCostings = costings.filter((c) => c.workId === workId);
  const relevantWorkUsers = workUsers.filter((wu) => wu.workId === workId);

  return relevantWorkUsers.map((wu) => {
    const user = users.find((u) => u.uid === wu.userId) || {
      uid: wu.userId,
      name: 'Unknown User',
      email: '',
      role: 'user',
      createdAt: '',
    };

    const userCostings = workCostings.filter((c) => c.userId === wu.userId);

    // Personal spending: source === 'PERSONAL' and unreimbursed
    const personalSpending = userCostings.reduce((sum, c) => {
      const isUnreimbursedPersonal = c.source === 'PERSONAL' && !c.reimbursedAt;
      return isUnreimbursedPersonal ? sum + (Number(c.costAmount) || 0) : sum;
    }, 0);

    // Spent from budget: source === 'BUDGET' or reimbursed
    const spentFromBudget = userCostings.reduce((sum, c) => {
      const isBudgetPaid = c.source === 'BUDGET' || Boolean(c.reimbursedAt);
      return isBudgetPaid ? sum + (Number(c.costAmount) || 0) : sum;
    }, 0);

    return {
      userId: wu.userId,
      userName: user.name_bn || user.name,
      userEmail: user.email,
      investment: Number(wu.investment) || 0,
      personalSpending,
      spentFromBudget,
      totalCostLogged: personalSpending + spentFromBudget,
    };
  });
}

/**
 * Calculates expense breakdown by Reason/Category
 */
export function calculateCategorySummaries(
  workId: string,
  costings: Costing[],
  reasons: Reason[]
): CategorySummary[] {
  const workCostings = costings.filter((c) => c.workId === workId);
  const reasonMap = new Map<string, { total: number; count: number }>();

  let grandTotal = 0;

  for (const costing of workCostings) {
    const amount = Number(costing.costAmount) || 0;
    grandTotal += amount;
    const current = reasonMap.get(costing.reasonId) || { total: 0, count: 0 };
    reasonMap.set(costing.reasonId, {
      total: current.total + amount,
      count: current.count + 1,
    });
  }

  const results: CategorySummary[] = [];

  for (const [reasonId, data] of reasonMap.entries()) {
    const reason = reasons.find((r) => r.id === reasonId);
    const percentage = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;

    results.push({
      reasonId,
      reasonName: reason ? reason.name : reasonId,
      reasonNameBn: reason?.name_bn,
      totalCost: data.total,
      count: data.count,
      percentage: Math.round(percentage * 10) / 10,
    });
  }

  return results.sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Pure simulation of reimbursing a personal costing
 */
export function reimburseCosting(
  costing: Costing,
  adminUserId: string,
  timestamp: string = new Date().toISOString()
): Costing {
  if (costing.source !== 'PERSONAL') {
    throw new Error('Only personal expenses can be reimbursed.');
  }

  if (costing.reimbursedAt) {
    throw new Error('This expense has already been reimbursed.');
  }

  return {
    ...costing,
    reimbursedAt: timestamp,
    reimbursedBy: adminUserId,
  };
}
