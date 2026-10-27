import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Costing } from '../../types/models';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useWork } from '../../context/WorkContext';
import { api } from '../../services/api';
import { Receipt, CheckCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RecentExpensesTableProps {
  costings: Costing[];
  onRefresh: () => void;
}

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

export const RecentExpensesTable: React.FC<RecentExpensesTableProps> = ({ costings, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { isWorkAdmin } = useWork();
  const { currentUser, isMainAdmin } = useAuth();

  const canReimburse = isWorkAdmin || isMainAdmin;

  const handleReimburse = async (costing: Costing) => {
    if (!currentUser) return;
    if (!window.confirm(t('expenses.reimburseConfirm'))) return;

    try {
      await api.reimburseCosting(costing.costingId, currentUser.uid);
      toast.success(t('common.success'));
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  const recentList = costings.slice(0, 6);

  return (
    <div className="card-depth p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Receipt size={16} className="text-emerald-600" />
          <span>{t('dashboard.recentExpenses')}</span>
        </h3>
        <Link
          to="/expenses"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <span>{t('dashboard.viewAll')}</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {recentList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          {t('expenses.noExpenses')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">{t('expenses.reason')}</th>
                <th className="py-2.5 px-3">{t('expenses.spentBy')}</th>
                <th className="py-2.5 px-3">{t('expenses.source')}</th>
                <th className="py-2.5 px-3 text-right">{t('expenses.costAmount')}</th>
                <th className="py-2.5 px-3 text-right">{t('expenses.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentList.map((c) => {
                const isReimbursed = Boolean(c.reimbursedAt);
                const isPersonal = c.source === 'PERSONAL';

                return (
                  <tr key={c.costingId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm">{formatReason(c.reasonName, c.reasonId, lang)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{formatDate(c.createdAt, lang)}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {c.userName}
                    </td>

                    <td className="py-3 px-3">
                      {c.source === 'BUDGET' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} />
                          <span>{t('expenses.statusBudget')}</span>
                        </span>
                      ) : isReimbursed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle size={12} />
                          <span>{t('expenses.statusReimbursed')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={12} />
                          <span>{t('expenses.statusPersonal')}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                      {formatCurrency(c.costAmount, lang)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isPersonal && !isReimbursed && c.userId === currentUser?.uid && (
                        <button
                          onClick={() => handleReimburse(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                          title={t('expenses.reimburse')}
                        >
                          <RefreshCw size={11} />
                          <span>{t('expenses.reimburse')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

