import { dataStore } from './storage';
import {
  User,
  Work,
  WorkUser,
  Costing,
  Reason,
  Metric,
  DashboardStats,
  UserExpenseSummary,
  CategorySummary,
} from '../types/models';
import {
  calculateDashboardStats,
  calculateUserExpenseSummaries,
  calculateCategorySummaries,
} from './mathEngine';

// Determine if we should use mock/local store or serverless API
export const isLiveBackendAvailable = (): boolean => {
  return Boolean(import.meta.env.VITE_USE_LIVE_API === 'true');
};

const getAuthToken = (): string => {
  return localStorage.getItem('kaj_auth_token') || 'dev_token_user_ifti_admin';
};

const getHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const settings = dataStore.getSettings();
  const sheetId = settings.sheetId || '';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAuthToken()}`,
    ...extra,
  };
  if (sheetId) {
    headers['x-sheet-id'] = sheetId;
  }
  return headers;
};

export const api = {
  // Works
  async getWorks(currentUser?: User | null): Promise<Work[]> {
    if (!isLiveBackendAvailable()) {
      return dataStore.getWorks(currentUser);
    }
    const res = await fetch('/api/works', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch works');
    const data = await res.json();
    return data.works;
  },

  async createWork(workData: Omit<Work, 'workId' | 'createdAt'>): Promise<Work> {
    const newWork: Work = {
      ...workData,
      workId: `work-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    if (!isLiveBackendAvailable()) {
      return dataStore.saveWork(newWork);
    }

    const res = await fetch('/api/works', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(newWork),
    });
    if (!res.ok) throw new Error('Failed to create work');
    const data = await res.json();
    return data.work;
  },

  async updateWork(work: Work): Promise<Work> {
    if (!isLiveBackendAvailable()) {
      return dataStore.saveWork(work);
    }
    const res = await fetch(`/api/works`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(work),
    });
    if (!res.ok) throw new Error('Failed to update work');
    const data = await res.json();
    return data.work;
  },

  // Dashboard Aggregates
  async getDashboardData(workId: string, currentUser: User) {
    if (!isLiveBackendAvailable()) {
      const work = dataStore.getWorkById(workId);
      if (!work) throw new Error('Work not found');

      const costings = dataStore.getCostings(workId);
      const workUsers = dataStore.getWorkUsers(workId);
      const users = dataStore.getUsers();
      const reasons = dataStore.getReasons();

      const stats = calculateDashboardStats(work, costings, workUsers);
      const userSummaries = calculateUserExpenseSummaries(workId, users, costings, workUsers);
      const categorySummaries = calculateCategorySummaries(workId, costings, reasons);

      const mySummary = userSummaries.find((u) => u.userId === currentUser.uid) || {
        userId: currentUser.uid,
        userName: currentUser.name_bn || currentUser.name,
        userEmail: currentUser.email,
        investment: 0,
        personalSpending: 0,
        spentFromBudget: 0,
        totalCostLogged: 0,
      };

      const isWorkAdmin = work.createdBy === currentUser.uid || currentUser.role === 'main_admin';

      return {
        work,
        stats,
        mySummary,
        userSummaries,
        categorySummaries,
        costings,
        permissions: {
          isAllowed: true,
          isWorkAdmin,
        },
      };
    }

    const res = await fetch(`/api/dashboard?workId=${workId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch dashboard data');
    }
    return await res.json();
  },

  // Costings
  async getCostings(workId: string): Promise<Costing[]> {
    if (!isLiveBackendAvailable()) {
      return dataStore.getCostings(workId);
    }
    const res = await fetch(`/api/costings?workId=${workId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch costings');
    const data = await res.json();
    return data.costings;
  },

  async addCosting(costingData: Omit<Costing, 'costingId' | 'createdAt'>): Promise<Costing> {
    if (!isLiveBackendAvailable()) {
      return dataStore.addCosting(costingData);
    }
    const res = await fetch('/api/costings', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(costingData),
    });
    if (!res.ok) throw new Error('Failed to add costing');
    const data = await res.json();
    return data.costing;
  },

  async reimburseCosting(costingId: string, adminUserId: string): Promise<Costing> {
    if (!isLiveBackendAvailable()) {
      return dataStore.reimburseCosting(costingId, adminUserId);
    }
    const res = await fetch('/api/costings', {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ costingId, action: 'REIMBURSE' }),
    });
    if (!res.ok) throw new Error('Failed to reimburse costing');
    const data = await res.json();
    return data.costing;
  },

  async deleteCosting(costingId: string, userId: string): Promise<void> {
    if (!isLiveBackendAvailable()) {
      return dataStore.deleteCosting(costingId, userId);
    }
    const res = await fetch(`/api/costings?id=${costingId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete costing');
  },

  // Users & Investments
  async getWorkUsers(workId: string): Promise<WorkUser[]> {
    return dataStore.getWorkUsers(workId);
  },

  async updateInvestment(workId: string, userId: string, investment: number): Promise<WorkUser> {
    return dataStore.updateInvestment(workId, userId, investment);
  },

  async assignUser(workId: string, userId: string, investment: number = 0): Promise<WorkUser> {
    return dataStore.assignUserToWork(workId, userId, investment);
  },

  // Shared Categories & Metrics
  async getReasons(): Promise<Reason[]> {
    return dataStore.getReasons();
  },

  async addReason(name: string, name_bn?: string, createdBy?: string): Promise<Reason> {
    return dataStore.addReason(name, name_bn, createdBy);
  },

  async getMetrics(): Promise<Metric[]> {
    return dataStore.getMetrics();
  },

  async addMetric(name: string, name_bn?: string, createdBy?: string): Promise<Metric> {
    return dataStore.addMetric(name, name_bn, createdBy);
  },

  // Settings
  async getSettings() {
    if (!isLiveBackendAvailable()) {
      const saved = dataStore.getSettings();
      return {
        secrets: {
          googleServiceAccount: true,
          firebaseAdmin: true,
          sheetIdConfigured: Boolean(saved.sheetId),
        },
        sheetId: saved.sheetId || '',
        serviceAccountEmail: 'demo-service-account@kajtracker.iam.gserviceaccount.com',
      };
    }
    const res = await fetch('/api/settings', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch settings from server');
    }
    return await res.json();
  },

  async testSheetConnection(sheetId: string) {
    if (!isLiveBackendAvailable()) {
      // Mock test response
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        success: true,
        title: 'Kaj Tracker Primary Ledger (Google Sheets)',
        sheets: ['Users', 'Works', 'WorkUsers', 'Costings', 'Reasons', 'Metrics', 'AuditLog'],
        serviceAccountEmail: 'demo-service-account@kajtracker.iam.gserviceaccount.com',
      };
    }
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'TEST_CONNECTION', spreadsheetId: sheetId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Connection test failed`);
    }
    return await res.json();
  },

  async initializeSheets(sheetId: string) {
    if (!isLiveBackendAvailable()) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        initializedTabs: ['Users', 'Works', 'WorkUsers', 'Costings', 'Reasons', 'Metrics', 'AuditLog'],
      };
    }
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'INITIALIZE_SHEETS', spreadsheetId: sheetId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Initialization failed`);
    }
    return await res.json();
  },
};

