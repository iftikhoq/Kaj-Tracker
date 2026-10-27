import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserExpenseSummary } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import { api } from '../../services/api';
import { useWork } from '../../context/WorkContext';
import { useAuth } from '../../context/AuthContext';
import { User, Edit3, ShieldAlert, BadgeCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface MyDetailsCardProps {
  summary: UserExpenseSummary;
  onRefresh: () => void;
}

export const MyDetailsCard: React.FC<MyDetailsCardProps> = ({ summary, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork } = useWork();
  const { currentUser } = useAuth();

  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [newInvestment, setNewInvestment] = useState(summary.investment.toString());
  const [saving, setSaving] = useState(false);

  const handleSaveInvestment = async () => {
    if (!activeWork || !currentUser) return;
    const amount = parseFloat(newInvestment);
    if (isNaN(amount) || amount < 0) {
      toast.error('সঠিক বিনিয়োগের পরিমাণ দিন / Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await api.updateInvestment(activeWork.workId, currentUser.uid, amount);
      toast.success(t('common.success'));
      setIsEditingInvestment(false);
      onRefresh();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-depth p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-wide">{t('dashboard.myDetails')}</h3>
            <span className="text-[11px] text-emerald-300 font-medium">
              {currentUser?.name_bn || currentUser?.name} ({currentUser?.email})
            </span>
          </div>
        </div>

        {/* Investment Inline Editor */}
        <div className="flex items-center gap-2">
          {isEditingInvestment ? (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-emerald-500/50">
              <span className="text-xs text-emerald-400 font-bold pl-1">৳</span>
              <input
                type="number"
                min="0"
                value={newInvestment}
                onChange={(e) => setNewInvestment(e.target.value)}
                className="w-28 px-2 py-1 bg-slate-900 rounded-lg text-xs font-bold text-white border border-slate-700 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveInvestment}
                disabled={saving}
                className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setIsEditingInvestment(false)}
                className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingInvestment(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-300 font-medium text-xs border border-white/10 transition-colors"
            >
              <Edit3 size={13} />
              <span>{t('users.editInvestment')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metrics Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {/* My Investment */}
        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            {t('dashboard.myInvestment')}
          </span>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {formatCurrency(summary.investment, lang)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">এই প্রকল্পে আপনার মোট প্রদত্ত মূলধন</p>
        </div>

        {/* My Personal Spending (Unreimbursed) */}
        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <span className="text-[11px] text-amber-300/80 uppercase font-bold tracking-wider flex items-center gap-1">
            <ShieldAlert size={12} className="text-amber-400" />
            <span>{t('dashboard.myPersonalSpending')}</span>
          </span>
          <div className="text-xl font-black text-amber-400 mt-1">
            {formatCurrency(summary.personalSpending, lang)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">অ্যাডমিন কর্তৃক সমন্বয় বাকি রয়েছে</p>
        </div>

        {/* My Spent from Budget */}
        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <BadgeCheck size={12} className="text-blue-400" />
            <span>{t('dashboard.mySpentFromBudget')}</span>
          </span>
          <div className="text-xl font-black text-blue-300 mt-1">
            {formatCurrency(summary.spentFromBudget, lang)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">কোম্পানি ফান্ড থেকে পরিশোধিত খরচ</p>
        </div>
      </div>
    </div>
  );
};
