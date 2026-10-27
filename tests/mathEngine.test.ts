import { describe, it, expect } from 'vitest';
import {
  calculateDashboardStats,
  calculateUserExpenseSummaries,
  calculateCategorySummaries,
  reimburseCosting,
} from '../src/services/mathEngine';
import { Work, Costing, WorkUser, User, Reason } from '../src/types/models';

describe('Kaj Tracker Financial Math Engine', () => {
  const mockWork: Work = {
    workId: 'work-101',
    name: 'Office Renovation',
    name_bn: 'অফিস সংস্কার কাজ',
    totalBudget: 500000,
    createdAt: '2026-10-01T00:00:00Z',
    createdBy: 'admin-1',
  };

  const mockUsers: User[] = [
    {
      uid: 'user-1',
      name: 'Ifti',
      name_bn: 'ইফতি',
      email: 'ifti@example.com',
      role: 'main_admin',
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      uid: 'user-2',
      name: 'Rahim',
      name_bn: 'রহিম',
      email: 'rahim@example.com',
      role: 'user',
      createdAt: '2026-10-01T00:00:00Z',
    },
  ];

  const mockWorkUsers: WorkUser[] = [
    { workId: 'work-101', userId: 'user-1', investment: 300000 },
    { workId: 'work-101', userId: 'user-2', investment: 200000 },
  ];

  const mockReasons: Reason[] = [
    { id: 'reason-1', name: 'Raw Cement & Brick', name_bn: 'সিমেন্ট ও ইট', createdBy: 'admin-1' },
    { id: 'reason-2', name: 'Labor & Craftsmanship', name_bn: 'শ্রমিক মজুরি', createdBy: 'admin-1' },
    { id: 'reason-3', name: 'Electrical Fittings', name_bn: 'বৈদ্যুতিক ফিটিংস', createdBy: 'admin-1' },
  ];

  it('calculates dashboard stats correctly with budget vs personal distinction', () => {
    const costings: Costing[] = [
      // Budget costing: 50,000 -> counts in totalExpense
      {
        costingId: 'c1',
        workId: 'work-101',
        userId: 'user-1',
        reasonId: 'reason-1',
        costAmount: 50000,
        source: 'BUDGET',
        createdAt: '2026-10-02T00:00:00Z',
      },
      // Personal costing unreimbursed: 20,000 -> does NOT count in totalExpense
      {
        costingId: 'c2',
        workId: 'work-101',
        userId: 'user-2',
        reasonId: 'reason-2',
        costAmount: 20000,
        source: 'PERSONAL',
        reimbursedAt: null,
        createdAt: '2026-10-03T00:00:00Z',
      },
      // Personal costing already reimbursed: 30,000 -> counts in totalExpense!
      {
        costingId: 'c3',
        workId: 'work-101',
        userId: 'user-2',
        reasonId: 'reason-3',
        costAmount: 30000,
        source: 'PERSONAL',
        reimbursedAt: '2026-10-04T10:00:00Z',
        reimbursedBy: 'user-1',
        createdAt: '2026-10-03T12:00:00Z',
      },
    ];

    const stats = calculateDashboardStats(mockWork, costings, mockWorkUsers);

    // Total expense = 50,000 (BUDGET) + 30,000 (Reimbursed PERSONAL) = 80,000
    expect(stats.totalExpense).toBe(80000);
    // Remaining budget = 500,000 - 80,000 = 420,000
    expect(stats.remainingBudget).toBe(420000);
    // Total investment = 300,000 + 200,000 = 500,000
    expect(stats.totalInvestment).toBe(500000);
    // Over budget check
    expect(stats.isOverBudget).toBe(false);
    expect(stats.budgetUtilizationPercent).toBe(16);
  });

  it('correctly transitions personal spending to budget expense upon reimbursement', () => {
    const personalCosting: Costing = {
      costingId: 'c2',
      workId: 'work-101',
      userId: 'user-2',
      reasonId: 'reason-2',
      costAmount: 25000,
      source: 'PERSONAL',
      createdAt: '2026-10-03T00:00:00Z',
    };

    // Before reimbursement:
    let stats = calculateDashboardStats(mockWork, [personalCosting], mockWorkUsers);
    expect(stats.totalExpense).toBe(0);
    expect(stats.remainingBudget).toBe(500000);

    let userSummaries = calculateUserExpenseSummaries(
      'work-101',
      mockUsers,
      [personalCosting],
      mockWorkUsers
    );
    const user2Before = userSummaries.find((u) => u.userId === 'user-2')!;
    expect(user2Before.personalSpending).toBe(25000);
    expect(user2Before.spentFromBudget).toBe(0);

    // Perform reimbursement
    const reimbursed = reimburseCosting(personalCosting, 'user-1', '2026-10-05T12:00:00Z');
    expect(reimbursed.reimbursedAt).toBe('2026-10-05T12:00:00Z');
    expect(reimbursed.reimbursedBy).toBe('user-1');

    // After reimbursement:
    stats = calculateDashboardStats(mockWork, [reimbursed], mockWorkUsers);
    expect(stats.totalExpense).toBe(25000);
    expect(stats.remainingBudget).toBe(475000);

    userSummaries = calculateUserExpenseSummaries(
      'work-101',
      mockUsers,
      [reimbursed],
      mockWorkUsers
    );
    const user2After = userSummaries.find((u) => u.userId === 'user-2')!;
    // Personal spending is cleared back to 0 because user got reimbursed!
    expect(user2After.personalSpending).toBe(0);
    // Now counts as spent from budget!
    expect(user2After.spentFromBudget).toBe(25000);
  });

  it('rejects invalid reimbursement attempts', () => {
    const budgetCosting: Costing = {
      costingId: 'cb',
      workId: 'work-101',
      userId: 'user-1',
      reasonId: 'reason-1',
      costAmount: 10000,
      source: 'BUDGET',
      createdAt: '2026-10-01T00:00:00Z',
    };

    expect(() => reimburseCosting(budgetCosting, 'admin-1')).toThrow(
      'Only personal expenses can be reimbursed.'
    );

    const alreadyReimbursed: Costing = {
      costingId: 'cr',
      workId: 'work-101',
      userId: 'user-2',
      reasonId: 'reason-1',
      costAmount: 10000,
      source: 'PERSONAL',
      reimbursedAt: '2026-10-02T00:00:00Z',
      reimbursedBy: 'admin-1',
      createdAt: '2026-10-01T00:00:00Z',
    };

    expect(() => reimburseCosting(alreadyReimbursed, 'admin-1')).toThrow(
      'This expense has already been reimbursed.'
    );
  });

  it('computes category summaries accurately', () => {
    const costings: Costing[] = [
      {
        costingId: 'c1',
        workId: 'work-101',
        userId: 'user-1',
        reasonId: 'reason-1',
        costAmount: 60000,
        source: 'BUDGET',
        createdAt: '2026-10-01T00:00:00Z',
      },
      {
        costingId: 'c2',
        workId: 'work-101',
        userId: 'user-2',
        reasonId: 'reason-1',
        costAmount: 40000,
        source: 'PERSONAL',
        createdAt: '2026-10-02T00:00:00Z',
      },
      {
        costingId: 'c3',
        workId: 'work-101',
        userId: 'user-2',
        reasonId: 'reason-2',
        costAmount: 50000,
        source: 'BUDGET',
        createdAt: '2026-10-03T00:00:00Z',
      },
    ];

    const categories = calculateCategorySummaries('work-101', costings, mockReasons);

    // Total logged = 60k + 40k + 50k = 150k
    // reason-1: 100k (66.7%)
    // reason-2: 50k (33.3%)
    expect(categories.length).toBe(2);
    expect(categories[0].reasonId).toBe('reason-1');
    expect(categories[0].totalCost).toBe(100000);
    expect(categories[0].count).toBe(2);
    expect(categories[0].percentage).toBe(66.7);

    expect(categories[1].reasonId).toBe('reason-2');
    expect(categories[1].totalCost).toBe(50000);
    expect(categories[1].count).toBe(1);
    expect(categories[1].percentage).toBe(33.3);
  });

  it('detects budget overruns when total expenses exceed budget', () => {
    const tightWork: Work = {
      ...mockWork,
      totalBudget: 100000,
    };

    const costings: Costing[] = [
      {
        costingId: 'c1',
        workId: 'work-101',
        userId: 'user-1',
        reasonId: 'reason-1',
        costAmount: 120000,
        source: 'BUDGET',
        createdAt: '2026-10-01T00:00:00Z',
      },
    ];

    const stats = calculateDashboardStats(tightWork, costings, mockWorkUsers);
    expect(stats.totalExpense).toBe(120000);
    expect(stats.remainingBudget).toBe(-20000);
    expect(stats.isOverBudget).toBe(true);
    expect(stats.budgetUtilizationPercent).toBe(120);
  });
});
