import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { dataStore } from '../services/storage';
import { DashboardStats, UserExpenseSummary, CategorySummary, Costing, AuditLog } from '../types/models';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { Printer, FileText, CheckCircle2, Building, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type ReportTab = 'summary' | 'expenses' | 'users' | 'categories' | 'reimbursements';

export const ReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork } = useWork();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userSummaries, setUserSummaries] = useState<UserExpenseSummary[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [costings, setCostings] = useState<Costing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWork || !currentUser) return;
    const load = async () => {
      try {
        setLoading(true);
        const [dash, cList] = await Promise.all([
          api.getDashboardData(activeWork.workId, currentUser),
          api.getCostings(activeWork.workId),
        ]);
        setStats(dash.stats);
        setUserSummaries(dash.userSummaries || []);
        setCategorySummaries(dash.categorySummaries || []);
        setCostings(cList);
        setAuditLogs(dataStore.getAuditLogs());
      } catch (err: any) {
        toast.error(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWork?.workId]);

  const handlePrint = () => {
    window.print();
  };

  const workTitle = lang === 'bn' && activeWork?.name_bn ? activeWork.name_bn : activeWork?.name;
  const reimbursedCostings = costings.filter((c) => Boolean(c.reimbursedAt));

  return (
    <div className="space-y-6">
      {/* Screen Controls (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('reports.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('reports.subtitle')}</p>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 active:scale-95 transition-all"
          >
            <Printer size={16} />
            <span>{t('reports.print')}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'summary' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('reports.fullSummary')}
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'expenses' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('reports.expensesLedger')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('reports.userWise')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'categories' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('reports.categoryWise')}
          </button>
          <button
            onClick={() => setActiveTab('reimbursements')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'reimbursements' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('reports.reimbursements')}
          </button>
        </div>
      </div>

      {/* Printable Area - Formatted as Clean A4 Document */}
      <div className="printable-area card-depth p-6 md:p-10 bg-white shadow-depth border border-slate-200">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center font-black text-xs">ক</span>
                <span className="font-bold text-sm tracking-wider uppercase text-emerald-800">Kaj Tracker · কাজ ট্র্যাকার</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {activeTab === 'summary' && t('reports.fullSummary')}
                {activeTab === 'expenses' && t('reports.expensesLedger')}
                {activeTab === 'users' && t('reports.userWise')}
                {activeTab === 'categories' && t('reports.categoryWise')}
                {activeTab === 'reimbursements' && t('reports.reimbursements')}
              </h1>
              <div className="text-xs text-slate-600 font-semibold mt-1">
                <span>{t('reports.project')} </span>
                <span className="text-slate-900 font-bold">{workTitle}</span>
                {activeWork?.department && <span> ({activeWork.department})</span>}
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <div>{t('reports.printedOn')} {formatDateTime(new Date().toISOString(), lang)}</div>
              <div>মুদ্রণকারী: {currentUser?.name_bn || currentUser?.name}</div>
            </div>
          </div>
        </div>

        {/* TAB 1: FULL WORK SUMMARY */}
        {activeTab === 'summary' && stats && (
          <div className="space-y-6 text-xs">
            {/* 4 Financial Stat Boxes */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-slate-500">{t('dashboard.totalBudget')}</div>
                <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(stats.totalBudget, lang)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-slate-500">{t('dashboard.totalExpense')}</div>
                <div className="text-lg font-black text-amber-900 mt-1">{formatCurrency(stats.totalExpense, lang)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-slate-500">{t('dashboard.totalInvestment')}</div>
                <div className="text-lg font-black text-teal-900 mt-1">{formatCurrency(stats.totalInvestment, lang)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-slate-500">{t('dashboard.remainingBudget')}</div>
                <div className={`text-lg font-black mt-1 ${stats.isOverBudget ? 'text-red-600' : 'text-emerald-900'}`}>
                  {formatCurrency(stats.remainingBudget, lang)}
                </div>
              </div>
            </div>

            {/* Member Summary Section */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-200 pb-1">
                {t('users.title')}
              </h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="p-2 border border-slate-300">{t('users.name')}</th>
                    <th className="p-2 border border-slate-300 text-right">{t('users.investment')}</th>
                    <th className="p-2 border border-slate-300 text-right">{t('users.personalSpending')}</th>
                    <th className="p-2 border border-slate-300 text-right">{t('users.budgetSpending')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userSummaries.map((u) => (
                    <tr key={u.userId}>
                      <td className="p-2 border border-slate-300 font-semibold">{u.userName}</td>
                      <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.investment, lang)}</td>
                      <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.personalSpending, lang)}</td>
                      <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.spentFromBudget, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Category Breakdown Section */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-200 pb-1">
                {t('categories.title')}
              </h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="p-2 border border-slate-300">{t('categories.reason')}</th>
                    <th className="p-2 border border-slate-300 text-center">{t('categories.count')}</th>
                    <th className="p-2 border border-slate-300 text-right">{t('categories.percentage')}</th>
                    <th className="p-2 border border-slate-300 text-right">{t('categories.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySummaries.map((c) => (
                    <tr key={c.reasonId}>
                      <td className="p-2 border border-slate-300 font-semibold">
                        {lang === 'bn' && c.reasonNameBn ? c.reasonNameBn : c.reasonName}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">{c.count}</td>
                      <td className="p-2 border border-slate-300 text-right">{c.percentage}%</td>
                      <td className="p-2 border border-slate-300 text-right font-bold">{formatCurrency(c.totalCost, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES LEDGER */}
        {activeTab === 'expenses' && (
          <div className="text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="p-2 border border-slate-300">{t('expenses.date')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.reason')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.spentBy')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.source')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.materialAmount')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('expenses.costAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {costings.map((c) => (
                  <tr key={c.costingId}>
                    <td className="p-2 border border-slate-300 whitespace-nowrap">{formatDate(c.createdAt, lang)}</td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-semibold">{c.reasonName || c.reasonId}</div>
                      {c.note && <div className="text-[10px] text-slate-500 italic">{c.note}</div>}
                    </td>
                    <td className="p-2 border border-slate-300">{c.userName}</td>
                    <td className="p-2 border border-slate-300">
                      {c.source === 'BUDGET'
                        ? t('expenses.statusBudget')
                        : c.reimbursedAt
                        ? `${t('expenses.statusReimbursed')}`
                        : t('expenses.statusPersonal')}
                    </td>
                    <td className="p-2 border border-slate-300">
                      {c.materialAmount ? `${c.materialAmount} ${c.metricName || ''}` : '—'}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-bold whitespace-nowrap">
                      {formatCurrency(c.costAmount, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: USER-WISE REPORT */}
        {activeTab === 'users' && (
          <div className="text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="p-2 border border-slate-300">{t('users.name')}</th>
                  <th className="p-2 border border-slate-300">{t('users.email')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('users.investment')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('users.personalSpending')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('users.budgetSpending')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('users.totalLogged')}</th>
                </tr>
              </thead>
              <tbody>
                {userSummaries.map((u) => (
                  <tr key={u.userId}>
                    <td className="p-2 border border-slate-300 font-bold">{u.userName}</td>
                    <td className="p-2 border border-slate-300">{u.userEmail}</td>
                    <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.investment, lang)}</td>
                    <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.personalSpending, lang)}</td>
                    <td className="p-2 border border-slate-300 text-right">{formatCurrency(u.spentFromBudget, lang)}</td>
                    <td className="p-2 border border-slate-300 text-right font-black">{formatCurrency(u.totalCostLogged, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: CATEGORY-WISE REPORT */}
        {activeTab === 'categories' && (
          <div className="text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="p-2 border border-slate-300">{t('categories.reason')}</th>
                  <th className="p-2 border border-slate-300 text-center">{t('categories.count')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('categories.percentage')}</th>
                  <th className="p-2 border border-slate-300 text-right">{t('categories.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {categorySummaries.map((c) => (
                  <tr key={c.reasonId}>
                    <td className="p-2 border border-slate-300 font-bold">
                      {lang === 'bn' && c.reasonNameBn ? c.reasonNameBn : c.reasonName}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">{c.count}</td>
                    <td className="p-2 border border-slate-300 text-right">{c.percentage}%</td>
                    <td className="p-2 border border-slate-300 text-right font-black">{formatCurrency(c.totalCost, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: REIMBURSEMENTS */}
        {activeTab === 'reimbursements' && (
          <div className="text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="p-2 border border-slate-300">{t('expenses.date')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.reason')}</th>
                  <th className="p-2 border border-slate-300">{t('expenses.spentBy')}</th>
                  <th className="p-2 border border-slate-300">সমন্বয়ের তারিখ (Reimbursed At)</th>
                  <th className="p-2 border border-slate-300">অনুমোদনকারী (Reimbursed By)</th>
                  <th className="p-2 border border-slate-300 text-right">{t('expenses.costAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {reimbursedCostings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      কোন সমন্বিত বা রিইমবার্সড ব্যক্তিগত খরচ পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  reimbursedCostings.map((c) => (
                    <tr key={c.costingId}>
                      <td className="p-2 border border-slate-300">{formatDate(c.createdAt, lang)}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{c.reasonName || c.reasonId}</td>
                      <td className="p-2 border border-slate-300">{c.userName}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[11px]">{formatDateTime(c.reimbursedAt, lang)}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{c.reimbursedBy}</td>
                      <td className="p-2 border border-slate-300 text-right font-black">{formatCurrency(c.costAmount, lang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Document Footer Signatures */}
        <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-600">
          <div>
            <div className="border-t border-dashed border-slate-400 w-32 mx-auto mb-1" />
            <span>হিসাব প্রস্তুতকারী</span>
          </div>
          <div>
            <div className="border-t border-dashed border-slate-400 w-32 mx-auto mb-1" />
            <span>যাচাইকারী / সাইট ইনচার্জ</span>
          </div>
          <div>
            <div className="border-t border-dashed border-slate-400 w-32 mx-auto mb-1" />
            <span>অনুমোদনকারী / প্রকল্প পরিচালক</span>
          </div>
        </div>
      </div>
    </div>
  );
};
