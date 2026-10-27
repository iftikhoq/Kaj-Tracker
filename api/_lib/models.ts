export type UserRole = 'main_admin' | 'user';

export interface User {
  uid: string;
  name: string;
  name_bn?: string;
  email: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
}

export interface Work {
  workId: string;
  name: string;
  name_bn?: string;
  department?: string;
  address?: string;
  totalBudget: number;
  createdAt: string;
  createdBy: string;
  isCompleted?: boolean;
}

export interface WorkUser {
  workId: string;
  userId: string;
  investment: number;
  user?: User;
}

export type CostingSource = 'PERSONAL' | 'BUDGET';

export interface Costing {
  costingId: string;
  workId: string;
  userId: string;
  reasonId: string;
  materialAmount?: number;
  metricId?: string;
  costAmount: number;
  source: CostingSource;
  reimbursedAt?: string | null;
  reimbursedBy?: string | null;
  note?: string;
  createdAt: string;
  userName?: string;
  reasonName?: string;
  metricName?: string;
}

export interface Reason {
  id: string;
  name: string;
  name_bn?: string;
  createdBy: string;
}

export interface Metric {
  id: string;
  name: string;
  name_bn?: string;
  createdBy: string;
}

export interface AuditLog {
  timestamp: string;
  userId: string;
  action: string;
  entity: string;
  before?: string;
  after?: string;
}

export interface DashboardStats {
  workId: string;
  totalBudget: number;
  totalExpense: number;
  totalInvestment: number;
  remainingBudget: number;
  isOverBudget: boolean;
  budgetUtilizationPercent: number;
}

export interface UserExpenseSummary {
  userId: string;
  userName: string;
  userEmail: string;
  investment: number;
  personalSpending: number;
  spentFromBudget: number;
  totalCostLogged: number;
}

export interface CategorySummary {
  reasonId: string;
  reasonName: string;
  totalCost: number;
  count: number;
  percentage: number;
}
