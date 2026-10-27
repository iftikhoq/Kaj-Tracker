import {
  User,
  Work,
  WorkUser,
  Costing,
  Reason,
  Metric,
  AuditLog,
} from '../types/models';
import {
  INITIAL_USERS,
  INITIAL_WORKS,
  INITIAL_WORK_USERS,
  INITIAL_COSTINGS,
  INITIAL_REASONS,
  INITIAL_METRICS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'kaj_tracker_users',
  WORKS: 'kaj_tracker_works',
  WORK_USERS: 'kaj_tracker_work_users',
  COSTINGS: 'kaj_tracker_costings',
  REASONS: 'kaj_tracker_reasons',
  METRICS: 'kaj_tracker_metrics',
  AUDIT_LOGS: 'kaj_tracker_audit_logs',
  SETTINGS: 'kaj_tracker_settings',
};

// Helper to get from localStorage or initialize with seed data
function getStored<T>(key: string, initialData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return initialData;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const dataStore = {
  // Users
  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(uid: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid);
  },

  saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
    return user;
  },

  // Works
  getWorks(user?: User | null): Work[] {
    const works = getStored<Work[]>(STORAGE_KEYS.WORKS, INITIAL_WORKS);
    if (!user) return [];
    if (user.role === 'main_admin') {
      return works;
    }

    const workUsers = this.getWorkUsers();
    const assignedWorkIds = new Set(
      workUsers.filter((wu) => wu.userId === user.uid).map((wu) => wu.workId)
    );

    // Can see works created by them OR assigned to them
    return works.filter((w) => w.createdBy === user.uid || assignedWorkIds.has(w.workId));
  },

  getWorkById(workId: string): Work | undefined {
    const works = getStored<Work[]>(STORAGE_KEYS.WORKS, INITIAL_WORKS);
    return works.find((w) => w.workId === workId);
  },

  saveWork(work: Work): Work {
    const works = getStored<Work[]>(STORAGE_KEYS.WORKS, INITIAL_WORKS);
    const index = works.findIndex((w) => w.workId === work.workId);
    if (index >= 0) {
      works[index] = { ...works[index], ...work };
    } else {
      works.unshift(work);
    }
    setStored(STORAGE_KEYS.WORKS, works);
    return work;
  },

  // Work Users & Investment
  getWorkUsers(workId?: string): WorkUser[] {
    const list = getStored<WorkUser[]>(STORAGE_KEYS.WORK_USERS, INITIAL_WORK_USERS);
    if (!workId) return list;
    return list.filter((wu) => wu.workId === workId);
  },

  assignUserToWork(workId: string, userId: string, investment: number = 0): WorkUser {
    const list = getStored<WorkUser[]>(STORAGE_KEYS.WORK_USERS, INITIAL_WORK_USERS);
    const existing = list.find((wu) => wu.workId === workId && wu.userId === userId);
    if (existing) {
      existing.investment = investment;
      setStored(STORAGE_KEYS.WORK_USERS, list);
      return existing;
    }

    const newAssignment: WorkUser = { workId, userId, investment };
    list.push(newAssignment);
    setStored(STORAGE_KEYS.WORK_USERS, list);
    return newAssignment;
  },

  updateInvestment(workId: string, userId: string, investment: number): WorkUser {
    return this.assignUserToWork(workId, userId, investment);
  },

  // Costings
  getCostings(workId?: string): Costing[] {
    const costings = getStored<Costing[]>(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    const users = this.getUsers();
    const reasons = this.getReasons();
    const metrics = this.getMetrics();

    // Attach display names
    const enriched = costings.map((c) => {
      const user = users.find((u) => u.uid === c.userId);
      const reason = reasons.find((r) => r.id === c.reasonId);
      const metric = metrics.find((m) => m.id === c.metricId);
      return {
        ...c,
        userName: user?.name_bn || user?.name || c.userId,
        reasonName: reason?.name_bn || reason?.name || c.reasonId,
        metricName: metric?.name_bn || metric?.name || c.metricId,
      };
    });

    if (!workId) return enriched;
    return enriched.filter((c) => c.workId === workId);
  },

  addCosting(costing: Omit<Costing, 'costingId' | 'createdAt'>): Costing {
    const costings = getStored<Costing[]>(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    const newCosting: Costing = {
      ...costing,
      costingId: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    costings.unshift(newCosting);
    setStored(STORAGE_KEYS.COSTINGS, costings);

    this.logAudit({
      timestamp: newCosting.createdAt,
      userId: newCosting.userId,
      action: 'ADD_COSTING',
      entity: `Costing/${newCosting.costingId}`,
      after: JSON.stringify({ amount: newCosting.costAmount, source: newCosting.source }),
    });

    return newCosting;
  },

  updateCosting(updated: Costing, editorId: string): Costing {
    const costings = getStored<Costing[]>(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    const index = costings.findIndex((c) => c.costingId === updated.costingId);
    if (index === -1) throw new Error('Costing not found');

    const before = JSON.stringify(costings[index]);
    costings[index] = { ...costings[index], ...updated };
    setStored(STORAGE_KEYS.COSTINGS, costings);

    this.logAudit({
      timestamp: new Date().toISOString(),
      userId: editorId,
      action: 'UPDATE_COSTING',
      entity: `Costing/${updated.costingId}`,
      before,
      after: JSON.stringify(costings[index]),
    });

    return costings[index];
  },

  deleteCosting(costingId: string, deleterId: string): void {
    const costings = getStored<Costing[]>(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    const target = costings.find((c) => c.costingId === costingId);
    if (!target) return;

    const filtered = costings.filter((c) => c.costingId !== costingId);
    setStored(STORAGE_KEYS.COSTINGS, filtered);

    this.logAudit({
      timestamp: new Date().toISOString(),
      userId: deleterId,
      action: 'DELETE_COSTING',
      entity: `Costing/${costingId}`,
      before: JSON.stringify(target),
    });
  },

  reimburseCosting(costingId: string, adminUserId: string): Costing {
    const costings = getStored<Costing[]>(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    const costing = costings.find((c) => c.costingId === costingId);
    if (!costing) throw new Error('Costing record not found');
    if (costing.source !== 'PERSONAL') throw new Error('Only personal expenses can be reimbursed');
    if (costing.reimbursedAt) throw new Error('Already reimbursed');

    const timestamp = new Date().toISOString();
    costing.reimbursedAt = timestamp;
    costing.reimbursedBy = adminUserId;

    setStored(STORAGE_KEYS.COSTINGS, costings);

    this.logAudit({
      timestamp,
      userId: adminUserId,
      action: 'REIMBURSE',
      entity: `Costing/${costingId}`,
      before: 'reimbursedAt=null',
      after: `reimbursedAt=${timestamp}, reimbursedBy=${adminUserId}`,
    });

    return costing;
  },

  // Reasons & Metrics
  getReasons(): Reason[] {
    return getStored<Reason[]>(STORAGE_KEYS.REASONS, INITIAL_REASONS);
  },

  addReason(name: string, name_bn?: string, createdBy: string = 'system'): Reason {
    const reasons = this.getReasons();
    const newReason: Reason = {
      id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      name_bn: name_bn || name,
      createdBy,
    };
    reasons.push(newReason);
    setStored(STORAGE_KEYS.REASONS, reasons);
    return newReason;
  },

  getMetrics(): Metric[] {
    return getStored<Metric[]>(STORAGE_KEYS.METRICS, INITIAL_METRICS);
  },

  addMetric(name: string, name_bn?: string, createdBy: string = 'system'): Metric {
    const metrics = this.getMetrics();
    const newMetric: Metric = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      name_bn: name_bn || name,
      createdBy,
    };
    metrics.push(newMetric);
    setStored(STORAGE_KEYS.METRICS, metrics);
    return newMetric;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  logAudit(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Keep last 500
  },

  // System Settings
  getSettings() {
    return getStored(STORAGE_KEYS.SETTINGS, {
      sheetId: '',
      firebaseWebConfig: '',
    });
  },

  saveSettings(settings: { sheetId: string; firebaseWebConfig: string }) {
    setStored(STORAGE_KEYS.SETTINGS, settings);
  },

  resetDemoData() {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.WORKS, INITIAL_WORKS);
    setStored(STORAGE_KEYS.WORK_USERS, INITIAL_WORK_USERS);
    setStored(STORAGE_KEYS.COSTINGS, INITIAL_COSTINGS);
    setStored(STORAGE_KEYS.REASONS, INITIAL_REASONS);
    setStored(STORAGE_KEYS.METRICS, INITIAL_METRICS);
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
};
