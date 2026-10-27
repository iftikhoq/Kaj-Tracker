import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Costing, Reason, User } from '../types/models';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import {
  Receipt,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit2,
  FileText,
  Printer,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const FALLBACK_REASONS: Record<string, { en: string; bn: string }> = {
  r1: { en: 'Raw Cement & Brick', bn: 'সিমেন্ট ও ইট' },
  r2: { en: 'Electrical Cables & Lights', bn: 'বৈদ্যুতিক তার ও লাইট' },
  r3: { en: 'Sanitary & Tiles', bn: 'স্যানিটারি ও টাইলস' },
  r4: { en: 'Carpenter & Labor Wage', bn: 'মিস্ত্রি ও শ্রমিক মজুরি' },
  r5: { en: 'Site Transport & Fuel', bn: 'সাইট পরিবহন ও জ্বালানি' },
  r6: { en: 'Food & Refreshment', bn: 'শ্রমিকদের খাবার ও চা-নাস্তা' },
};

function formatReason(name?: string, id?: string, lang = 'bn') {
  if (name && !name.startsWith('r-') && name !== id && !FALLBACK_REASONS[name]) return name;
  if (id && FALLBACK_REASONS[id]) {
    return lang === 'bn' ? FALLBACK_REASONS[id].bn : FALLBACK_REASONS[id].en;
  }
  if (name && FALLBACK_REASONS[name]) {
    return lang === 'bn' ? FALLBACK_REASONS[name].bn : FALLBACK_REASONS[name].en;
  }
  return name || id || 'সাধারণ খরচ';
}

export const ExpensesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork, isWorkAdmin } = useWork();
  const { currentUser, isMainAdmin } = useAuth();

  const [costings, setCostings] = useState<Costing[]>([]);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadExpenses = async () => {
    if (!activeWork) return;
    try {
      setLoading(true);
      const [cList, rList] = await Promise.all([
        api.getCostings(activeWork.workId),
        api.getReasons(),
      ]);
      setCostings(cList);
      setReasons(rList);
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeWork?.workId]);

  const canReimburse = isWorkAdmin || isMainAdmin;

  const handleReimburse = async (costing: Costing) => {
    if (!currentUser) return;
    if (!window.confirm(t('expenses.reimburseConfirm'))) return;

    try {
      await api.reimburseCosting(costing.costingId, currentUser.uid);
      toast.success(t('common.success'));
      loadExpenses();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  const handleDelete = async (costing: Costing) => {
    if (!currentUser) return;
    if (!window.confirm(t('expenses.deleteConfirm'))) return;

    try {
      await api.deleteCosting(costing.costingId, currentUser.uid);
      toast.success(t('common.success'));
      loadExpenses();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  // Filtered List
  const filteredCostings = useMemo(() => {
    return costings.filter((c) => {
      if (selectedUser !== 'ALL' && c.userId !== selectedUser) return false;
      if (selectedReason !== 'ALL' && c.reasonId !== selectedReason) return false;
      if (selectedSource !== 'ALL' && c.source !== selectedSource) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesReason = c.reasonName?.toLowerCase().includes(query);
        const matchesUser = c.userName?.toLowerCase().includes(query);
        const matchesNote = c.note?.toLowerCase().includes(query);
        if (!matchesReason && !matchesUser && !matchesNote) return false;
      }
      return true;
    });
  }, [costings, selectedUser, selectedReason, selectedSource, searchQuery]);

  // Totals for filtered view
  const filteredTotal = filteredCostings.reduce((sum, c) => sum + c.costAmount, 0);

  if (!activeWork) {
    return (
      <div className="card-depth p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
          <Briefcase size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{t('banner.noWorkSelected')}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {lang === 'bn'
            ? 'আপনাকে এখনও কোনো কাজে যুক্ত করা হয়নি অথবা কোনো কাজ নির্বাচন করা হয়নি।'
            : 'You are not assigned to any work yet or no work is selected.'}
        </p>
        <Link
          to="/works"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
        >
          <Plus size={16} />
          <span>{lang === 'bn' ? 'কাজের তালিকা / নতুন কাজ' : 'Work List / New Work'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('expenses.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('expenses.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-depth-sm hover:shadow-depth transition-all"
          >
            <Printer size={14} className="text-slate-500" />
            <span>{t('reports.print')}</span>
          </Link>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>{t('dashboard.addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-depth p-4 bg-white/95">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">{t('common.search')}</label>
            <input
              type="text"
              placeholder="খাত, নাম বা নোট দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Reason Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">{t('expenses.filterByReason')}</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">{t('expenses.allReasons')}</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {lang === 'bn' && r.name_bn ? r.name_bn : r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">{t('expenses.filterBySource')}</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">{t('expenses.allSources')}</option>
              <option value="BUDGET">{t('expenses.sourceBudget')}</option>
              <option value="PERSONAL">{t('expenses.sourcePersonal')}</option>
            </select>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex flex-col justify-end">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{filteredCostings.length} টি খরচ</span>
              <span className="font-black text-emerald-400 text-base">{formatCurrency(filteredTotal, lang)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table Card */}
      <div className="card-depth overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="p-4">{t('expenses.date')}</th>
                <th className="p-4">{t('expenses.reason')}</th>
                <th className="p-4">{t('expenses.materialAmount')}</th>
                <th className="p-4">{t('expenses.spentBy')}</th>
                <th className="p-4">{t('expenses.status')}</th>
                <th className="p-4 text-right">{t('expenses.costAmount')}</th>
                <th className="p-4 text-right">{t('expenses.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCostings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {t('expenses.noExpenses')}
                  </td>
                </tr>
              ) : (
                filteredCostings.map((c) => {
                  const isReimbursed = Boolean(c.reimbursedAt);
                  const isPersonal = c.source === 'PERSONAL';
                  const canEditOrDelete = isMainAdmin || isWorkAdmin || c.userId === currentUser?.uid;

                  return (
                    <tr key={c.costingId} className="hover:bg-slate-50/90 transition-colors">
                      <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(c.createdAt, lang)}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{formatReason(c.reasonName, c.reasonId, lang)}</div>
                        {c.note && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                            {c.note}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {c.materialAmount !== undefined && c.materialAmount !== null ? (
                          <span>
                            {c.materialAmount} {c.metricName || ''}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-700 font-semibold whitespace-nowrap">
                        {c.userName}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {c.source === 'BUDGET' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} />
                            <span>{t('expenses.statusBudget')}</span>
                          </span>
                        ) : isReimbursed ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle size={12} />
                              <span>{t('expenses.statusReimbursed')}</span>
                            </span>
                            <span className="text-2xs text-slate-400 mt-0.5">
                              {formatDate(c.reimbursedAt, lang)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={12} />
                            <span>{t('expenses.statusPersonal')}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(c.costAmount, lang)}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isPersonal && !isReimbursed && c.userId === currentUser?.uid && (
                            <button
                              onClick={() => handleReimburse(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                              title={t('expenses.reimburse')}
                            >
                              <RefreshCw size={12} />
                              <span>{t('expenses.reimburse')}</span>
                            </button>
                          )}

                          {canEditOrDelete && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title={t('expenses.delete')}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={loadExpenses}
      />
    </div>
  );
};

