import { User, Work, WorkUser, Costing, Reason, Metric, AuditLog } from '../types/models';

export const INITIAL_USERS: User[] = [
  {
    uid: 'user_ifti_admin',
    name: 'Ifti',
    name_bn: 'ইফতি (অ্যাডমিন)',
    email: 'ifti@kajtracker.com',
    role: 'main_admin',
    createdAt: '2026-10-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user_tariq',
    name: 'Tariqul Islam',
    name_bn: 'তরিকুল ইসলাম',
    email: 'tariq@kajtracker.com',
    role: 'user',
    createdAt: '2026-10-02T09:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user_rahim',
    name: 'Abdur Rahim',
    name_bn: 'আব্দুর রহিম',
    email: 'rahim@kajtracker.com',
    role: 'user',
    createdAt: '2026-10-03T11:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user_nasrin',
    name: 'Nasrin Akhter',
    name_bn: 'নাসরিন আক্তার',
    email: 'nasrin@kajtracker.com',
    role: 'user',
    createdAt: '2026-10-04T14:15:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_WORKS: Work[] = [
  {
    workId: 'work-dhaka-corp',
    name: 'Gulshan Corporate Office Renovation',
    name_bn: 'গুলশান কর্পোরেট অফিস সংস্কার',
    department: 'Civil & Interior',
    address: 'Road 11, Block D, Gulshan-1, Dhaka',
    totalBudget: 1500000,
    createdAt: '2026-10-05T10:00:00Z',
    createdBy: 'user_ifti_admin',
    isCompleted: false,
  },
  {
    workId: 'work-ctg-warehouse',
    name: 'Chittagong Logistics Depot Shed',
    name_bn: 'চট্টগ্রাম লজিস্টিকস ডিপো শেড',
    department: 'Infrastructure',
    address: 'Agrabad C/A, Chittagong',
    totalBudget: 3200000,
    createdAt: '2026-10-10T12:00:00Z',
    createdBy: 'user_tariq',
    isCompleted: false,
  },
];

export const INITIAL_REASONS: Reason[] = [
  { id: 'r1', name: 'Raw Cement & Brick', name_bn: 'সিমেন্ট ও ইট', createdBy: 'user_ifti_admin' },
  { id: 'r2', name: 'Electrical Cables & Lights', name_bn: 'বৈদ্যুতিক তার ও লাইট', createdBy: 'user_ifti_admin' },
  { id: 'r3', name: 'Sanitary & Tiles', name_bn: 'স্যানিটারি ও টাইলস', createdBy: 'user_ifti_admin' },
  { id: 'r4', name: 'Carpenter & Labor Wage', name_bn: 'মিস্ত্রি ও শ্রমিক মজুরি', createdBy: 'user_ifti_admin' },
  { id: 'r5', name: 'Site Transport & Fuel', name_bn: 'সাইট পরিবহন ও জ্বালানি', createdBy: 'user_ifti_admin' },
  { id: 'r6', name: 'Food & Refreshment', name_bn: 'শ্রমিকদের খাবার ও চা-নাস্তা', createdBy: 'user_ifti_admin' },
];

export const INITIAL_METRICS: Metric[] = [
  { id: 'm1', name: 'Bags', name_bn: 'ব্যাগ', createdBy: 'user_ifti_admin' },
  { id: 'm2', name: 'Pieces / Nos', name_bn: 'পিস / সংখ্যা', createdBy: 'user_ifti_admin' },
  { id: 'm3', name: 'Square Feet (sqft)', name_bn: 'বর্গফুট (স্কয়ার ফিট)', createdBy: 'user_ifti_admin' },
  { id: 'm4', name: 'Tons', name_bn: 'টন', createdBy: 'user_ifti_admin' },
  { id: 'm5', name: 'Days', name_bn: 'দিন', createdBy: 'user_ifti_admin' },
  { id: 'm6', name: 'Liters', name_bn: 'লিটার', createdBy: 'user_ifti_admin' },
];

export const INITIAL_WORK_USERS: WorkUser[] = [
  { workId: 'work-dhaka-corp', userId: 'user_ifti_admin', investment: 800000 },
  { workId: 'work-dhaka-corp', userId: 'user_tariq', investment: 400000 },
  { workId: 'work-dhaka-corp', userId: 'user_rahim', investment: 300000 },
  { workId: 'work-ctg-warehouse', userId: 'user_ifti_admin', investment: 1500000 },
  { workId: 'work-ctg-warehouse', userId: 'user_tariq', investment: 1700000 },
];

export const INITIAL_COSTINGS: Costing[] = [
  {
    costingId: 'cost-101',
    workId: 'work-dhaka-corp',
    userId: 'user_ifti_admin',
    reasonId: 'r1',
    materialAmount: 120,
    metricId: 'm1',
    costAmount: 72000,
    source: 'BUDGET',
    note: 'প্রথম লটের প্রিমিয়াম সিমেন্ট সরবরাহ',
    createdAt: '2026-10-06T11:20:00Z',
  },
  {
    costingId: 'cost-102',
    workId: 'work-dhaka-corp',
    userId: 'user_tariq',
    reasonId: 'r4',
    materialAmount: 6,
    metricId: 'm5',
    costAmount: 18000,
    source: 'BUDGET',
    note: 'ইন্টেরিয়র মিস্ত্রির সাপ্তাহিক বিল',
    createdAt: '2026-10-08T16:00:00Z',
  },
  {
    costingId: 'cost-103',
    workId: 'work-dhaka-corp',
    userId: 'user_rahim',
    reasonId: 'r5',
    materialAmount: 4,
    metricId: 'm2',
    costAmount: 6500,
    source: 'PERSONAL',
    reimbursedAt: null,
    reimbursedBy: null,
    note: 'জরুরি পিকআপ ভ্যান ভাড়া ও লোডিং খরচ (নিজ পকেট থেকে)',
    createdAt: '2026-10-12T14:30:00Z',
  },
  {
    costingId: 'cost-104',
    workId: 'work-dhaka-corp',
    userId: 'user_tariq',
    reasonId: 'r2',
    materialAmount: 40,
    metricId: 'm2',
    costAmount: 24500,
    source: 'PERSONAL',
    reimbursedAt: '2026-10-15T09:00:00Z',
    reimbursedBy: 'user_ifti_admin',
    note: 'জরুরি এলইডি প্যানেল লাইট কেনা',
    createdAt: '2026-10-14T17:10:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    timestamp: '2026-10-15T09:00:00Z',
    userId: 'user_ifti_admin',
    action: 'REIMBURSE',
    entity: 'Costing/cost-104',
    before: 'source=PERSONAL, reimbursedAt=null',
    after: 'reimbursedAt=2026-10-15T09:00:00Z, reimbursedBy=user_ifti_admin',
  },
];

