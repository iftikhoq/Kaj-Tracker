import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserExpenseSummary } from '../types/models';
import { formatCurrency } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { Link } from 'react-router-dom';
import {
  Users as UsersIcon,
  UserPlus,
  UserMinus,
  Edit2,
  Check,
  X,
  PiggyBank,
  Briefcase,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork, isWorkAdmin } = useWork();
  const { currentUser, isMainAdmin } = useAuth();

  const [summaries, setSummaries] = useState<UserExpenseSummary[]>([]);
  const [allSystemUsers, setAllSystemUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit investment modal state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  // Assign user modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('0');

  // Remove user state
  const [userToRemove, setUserToRemove] = useState<{ id: string; name: string } | null>(null);

  const loadData = async () => {
    if (!activeWork || !currentUser) return;
    try {
      setLoading(true);
      const [dash, allUsers] = await Promise.all([
        api.getDashboardData(activeWork.workId, currentUser),
        api.getUsers(),
      ]);
      setSummaries(dash.userSummaries || []);
      setAllSystemUsers(allUsers || []);
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWork?.workId]);

  const canEditUser = (targetUserId: string) => {
    if (isMainAdmin || isWorkAdmin) return true;
    return currentUser?.uid === targetUserId;
  };

  const handleStartEdit = (summary: UserExpenseSummary) => {
    setEditingUserId(summary.userId);
    setEditAmount(summary.investment.toString());
  };

  const handleSaveInvestment = async (userId: string) => {
    if (!activeWork) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error(lang === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Please enter a valid amount');
      return;
    }

    try {
      await api.updateInvestment(activeWork.workId, userId, amount);
      toast.success(t('common.success'));
      setEditingUserId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork || !selectedUserId) return;

    try {
      await api.assignUser(activeWork.workId, selectedUserId, parseFloat(initialInvestment) || 0);
      toast.success(t('common.success'));
      setIsAssignModalOpen(false);
      setSelectedUserId('');
      setInitialInvestment('0');
      loadData();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  const handleConfirmRemove = async () => {
    if (!activeWork || !userToRemove) return;
    try {
      setLoading(true);
      await api.removeUser(activeWork.workId, userToRemove.id);
      toast.success(
        lang === 'bn'
          ? `${userToRemove.name}-কে কাজ থেকে সরানো হয়েছে`
          : `Removed ${userToRemove.name} from work`
      );
      setUserToRemove(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter out users who are ALREADY assigned to this work
  const assignedUserIds = new Set(summaries.map((s) => s.userId));
  const unassignedUsers = allSystemUsers.filter((u) => !assignedUserIds.has(u.uid));

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

  const totalInvestment = summaries.reduce((sum, s) => sum + s.investment, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('users.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('users.subtitle')}</p>
        </div>

        {(isWorkAdmin || isMainAdmin) && (
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            <span>{t('users.assignUser')}</span>
          </button>
        )}
      </div>

      {/* Summary Tablet */}
      <div className="card-depth p-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PiggyBank size={20} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              {t('dashboard.totalInvestment')}
            </span>
            <div className="text-xl font-black">{formatCurrency(totalInvestment, lang)}</div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-300">
          <span className="font-bold text-white text-base">{summaries.length}</span> {lang === 'bn' ? 'জন সদস্য' : 'members'}
        </div>
      </div>

      {/* Members Table */}
      <div className="card-depth overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="p-4">{t('users.name')}</th>
                <th className="p-4 text-right">{t('users.investment')}</th>
                <th className="p-4 text-right">{t('users.personalSpending')}</th>
                <th className="p-4 text-right">{t('users.budgetSpending')}</th>
                <th className="p-4 text-right">{t('users.totalLogged')}</th>
                <th className="p-4 text-right">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summaries.map((s) => {
                const isMe = s.userId === currentUser?.uid;
                const editable = canEditUser(s.userId);
                const isEditing = editingUserId === s.userId;
                const isWorkCreator = s.userId === activeWork.createdBy;

                return (
                  <tr key={s.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {s.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{s.userName}</span>
                            {isWorkCreator && (
                              <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {lang === 'bn' ? 'কাজের অ্যাডমিন' : 'Work Admin'}
                              </span>
                            )}
                            {isMe && !isWorkCreator && (
                              <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                                {lang === 'bn' ? 'আপনি' : 'You'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{s.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-emerald-500 rounded-lg text-right font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveInvestment(s.userId)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrency(s.investment, lang)}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right font-bold text-amber-700">
                      {formatCurrency(s.personalSpending, lang)}
                    </td>

                    <td className="p-4 text-right font-bold text-blue-700">
                      {formatCurrency(s.spentFromBudget, lang)}
                    </td>

                    <td className="p-4 text-right font-black text-slate-900">
                      {formatCurrency(s.totalCostLogged, lang)}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {editable && !isEditing && (
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 size={12} />
                            <span>{t('users.editInvestment')}</span>
                          </button>
                        )}
                        {(isWorkAdmin || isMainAdmin) && !isWorkCreator && (
                          <button
                            onClick={() => setUserToRemove({ id: s.userId, name: s.userName })}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title={lang === 'bn' ? 'কাজ থেকে সদস্যকে সরান' : 'Remove user from work'}
                          >
                            <UserMinus size={13} />
                            <span>{lang === 'bn' ? 'সরান' : 'Remove'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Member Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={t('users.assignUser')}
        icon={<UserPlus size={18} />}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignMember} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {lang === 'bn' ? 'নতুন সদস্য নির্বাচন করুন *' : 'Select New Member *'}
            </label>

            {unassignedUsers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  {lang === 'bn'
                    ? 'সকল নিবন্ধিত সদস্য ইতিমধ্যেই এই কাজে যুক্ত আছেন।'
                    : 'All registered users are already members of this work.'}
                </span>
              </div>
            ) : (
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">{lang === 'bn' ? '— সদস্য বেছে নিন —' : '— Choose a member —'}</option>
                {unassignedUsers.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name_bn || u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {lang === 'bn' ? 'প্রাথমিক বিনিয়োগ (৳)' : 'Initial Investment (৳)'}
            </label>
            <input
              type="number"
              min="0"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
              disabled={unassignedUsers.length === 0}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={unassignedUsers.length === 0 || !selectedUserId}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Removing Member */}
      <Modal
        isOpen={Boolean(userToRemove)}
        onClose={() => setUserToRemove(null)}
        title={lang === 'bn' ? 'সদস্য অপসারণ নিশ্চিতকরণ' : 'Confirm Member Removal'}
        icon={<UserMinus size={18} className="text-red-600" />}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 text-sm">
            {lang === 'bn'
              ? `আপনি কি নিশ্চিতভাবে "${userToRemove?.name}"-কে এই কাজ থেকে বাদ দিতে চান?`
              : `Are you sure you want to remove "${userToRemove?.name}" from this work?`}
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setUserToRemove(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirmRemove}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {lang === 'bn' ? 'হ্যাঁ, সরান' : 'Yes, Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
