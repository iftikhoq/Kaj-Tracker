import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, UserExpenseSummary, CategorySummary, Costing } from '../types/models';
import { StatCards } from '../components/dashboard/StatCards';
import { MyDetailsCard } from '../components/dashboard/MyDetailsCard';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { RecentExpensesTable } from '../components/dashboard/RecentExpensesTable';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { Plus, RefreshCw, Briefcase, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeWork, loading: workLoading } = useWork();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mySummary, setMySummary] = useState<UserExpenseSummary | null>(null);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [costings, setCostings] = useState<Costing[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const loadData = async () => {
    if (!activeWork || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getDashboardData(activeWork.workId, currentUser);
      setStats(data.stats);
      setMySummary(data.mySummary);
      setCategorySummaries(data.categorySummaries);
      setCostings(data.costings || []);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWork?.workId, currentUser?.uid]);

  if (workLoading || (loading && !stats)) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-2xl bg-slate-200/60 t-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 t-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeWork) {
    return (
      <div className="card-depth p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
          <Briefcase size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{t('banner.noWorkSelected')}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          ড্যাশবোর্ড দেখার জন্য অনুগ্রহ করে উপরের ড্রপডাউন থেকে একটি কাজ নির্বাচন করুন অথবা নতুন কাজ তৈরি করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-depth-sm hover:shadow-depth transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>{t('dashboard.addExpense')}</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      {stats && <StatCards stats={stats} />}

      {/* My Financial Details Card */}
      {mySummary && <MyDetailsCard summary={mySummary} onRefresh={loadData} />}

      {/* 2 Column Row: Recent Expenses & Category Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentExpensesTable costings={costings} onRefresh={loadData} />
        </div>
        <div className="lg:col-span-1">
          <CategoryPieChart categories={categorySummaries} />
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
