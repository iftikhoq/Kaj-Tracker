import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardStats } from '../../types/models';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Wallet, TrendingUp, PiggyBank, CircleAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';

  const utilization = stats.budgetUtilizationPercent || 0;

  return (
    <div className="space-y-4">
      {/* Over budget banner alert if applicable */}
      {stats.isOverBudget && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-depth-sm">
          <CircleAlert size={22} className="text-red-600 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-red-700">{t('dashboard.overBudget')}</strong>
            <p className="mt-0.5 text-red-600">
              মোট খরচ বাজেট অতিক্রম করেছে! অতিরিক্ত খরচ: {formatCurrency(Math.abs(stats.remainingBudget), lang)}
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <div className="card-depth p-5 t-tilt-card relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalBudget')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <Wallet size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.totalBudget, lang)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              প্রকল্পের নির্ধারিত মোট বরাদ্দ
            </div>
          </div>
        </div>

        {/* Total Expense Card (Counts only budget-paid costs!) */}
        <div className="card-depth p-5 t-tilt-card relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalExpense')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <TrendingUp size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-900 tracking-tight">
              {formatCurrency(stats.totalExpense, lang)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              বাজেট হতে প্রকৃত ব্যয়িত
            </div>
          </div>
        </div>

        {/* Total Investment Card */}
        <div className="card-depth p-5 t-tilt-card relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalInvestment')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
              <PiggyBank size={19} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-900 tracking-tight">
              {formatCurrency(stats.totalInvestment, lang)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              সদস্যদের জমাকৃত মোট মূলধন
            </div>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div
          className={`card-depth p-5 t-tilt-card relative overflow-hidden ${
            stats.isOverBudget
              ? 'bg-gradient-to-br from-red-50 to-red-100/40 border-red-200'
              : 'bg-gradient-to-br from-white to-emerald-50/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.remainingBudget')}
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stats.isOverBudget
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-50 border border-emerald-200/60 text-emerald-600'
              }`}
            >
              {stats.isOverBudget ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                stats.isOverBudget ? 'text-red-600' : 'text-emerald-900'
              }`}
            >
              {formatCurrency(stats.remainingBudget, lang)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-semibold">
              <span>{t('dashboard.budgetUtilization')}</span>
              <span>{formatNumber(utilization, lang)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  stats.isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

