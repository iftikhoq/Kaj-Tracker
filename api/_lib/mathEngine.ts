import { Costing, DashboardStats, UserExpenseSummary, CategorySummary, Work, WorkUser, User, Reason } from './models.js';

export function calculateDashboardStats(
  work: Work,
  costings: Costing[],
  workUsers: WorkUser[]
): DashboardStats {
  const workCostings = costings.filter((c) => c.workId === work.workId);
  const relevantWorkUsers = workUsers.filter((wu) => wu.workId === work.workId);

  const totalBudget = Number(work.totalBudget) || 0;

  const totalExpense = workCostings.reduce((sum, c) => {
    const isBudgetPaid = c.source === 'BUDGET' || Boolean(c.reimbursedAt);
    return isBudgetPaid ? sum + (Number(c.costAmount) || 0) : sum;
  }, 0);

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

export function calculateUserExpenseSummaries(
  workId: string,
  users: User[],
  costings: Costing[],
  workUsers: WorkUser[]
): UserExpenseSummary[] {
  const assignedWorkUsers = workUsers.filter((wu) => wu.workId === workId);
  const assignedUserIds = new Set(assignedWorkUsers.map((wu) => wu.userId));
  const workCostings = costings.filter((c) => c.workId === workId);

  return assignedWorkUsers.map((wu) => {
    const user = users.find((u) => u.uid === wu.userId);
    const userCostings = workCostings.filter((c) => c.userId === wu.userId);

    const personalSpending = userCostings.reduce((sum, c) => {
      return c.source === 'PERSONAL' && !c.reimbursedAt ? sum + (Number(c.costAmount) || 0) : sum;
    }, 0);

    const spentFromBudget = userCostings.reduce((sum, c) => {
      const isBudget = c.source === 'BUDGET' || Boolean(c.reimbursedAt);
      return isBudget ? sum + (Number(c.costAmount) || 0) : sum;
    }, 0);

    return {
      userId: wu.userId,
      userName: user?.name || user?.name_bn || 'Unknown Member',
      userEmail: user?.email || '',
      investment: Number(wu.investment) || 0,
      personalSpending,
      spentFromBudget,
      totalCostLogged: personalSpending + spentFromBudget,
    };
  });
}

export function calculateCategorySummaries(
  workId: string,
  costings: Costing[],
  reasons: Reason[]
): CategorySummary[] {
  const workCostings = costings.filter((c) => c.workId === workId);
  const totalCost = workCostings.reduce((sum, c) => sum + (Number(c.costAmount) || 0), 0);

  const categoryMap = new Map<string, { total: number; count: number }>();

  workCostings.forEach((c) => {
    const current = categoryMap.get(c.reasonId) || { total: 0, count: 0 };
    current.total += Number(c.costAmount) || 0;
    current.count += 1;
    categoryMap.set(c.reasonId, current);
  });

  const results: CategorySummary[] = [];

  categoryMap.forEach((data, reasonId) => {
    const reason = reasons.find((r) => r.id === reasonId);
    const percentage = totalCost > 0 ? (data.total / totalCost) * 100 : 0;
    results.push({
      reasonId,
      reasonName: reason?.name || reason?.name_bn || reasonId,
      totalCost: data.total,
      count: data.count,
      percentage: Math.round(percentage * 10) / 10,
    });
  });

  return results.sort((a, b) => b.totalCost - a.totalCost);
}

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
