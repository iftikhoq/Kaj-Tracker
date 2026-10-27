import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Work } from '../types/models';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Briefcase, Plus, CheckCircle2, Clock, MapPin, Building, X } from 'lucide-react';
import { toast } from 'sonner';

export const WorksPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { works, activeWork, setActiveWork, refreshWorks, isWorkAdmin } = useWork();
  const { currentUser, isMainAdmin } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser) return;

    setLoading(true);
    try {
      const newWork = await api.createWork({
        name: name.trim(),
        name_bn: nameBn.trim() || name.trim(),
        department: department.trim() || undefined,
        address: address.trim() || undefined,
        totalBudget: parseFloat(totalBudget) || 0,
        createdBy: currentUser.uid,
        isCompleted: false,
      });

      // Automatically assign creator to this work
      await api.assignUser(newWork.workId, currentUser.uid, 0);

      toast.success(t('common.success'));
      setIsCreateOpen(false);
      setName('');
      setNameBn('');
      setDepartment('');
      setAddress('');
      setTotalBudget('');
      await refreshWorks();
      setActiveWork(newWork);
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (work: Work) => {
    if (!currentUser) return;
    const canManage = isMainAdmin || work.createdBy === currentUser.uid;
    if (!canManage) {
      toast.error('কেবলমাত্র কাজের অ্যাডমিন এটি পরিবর্তন করতে পারেন');
      return;
    }

    try {
      const updated = { ...work, isCompleted: !work.isCompleted };
      await api.updateWork(updated);
      toast.success(t('common.success'));
      refreshWorks();
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('works.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('works.subtitle')}</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>{t('works.createNew')}</span>
        </button>
      </div>

      {/* Works Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {works.map((work) => {
          const isActiveSelected = activeWork?.workId === work.workId;
          const title = lang === 'bn' && work.name_bn ? work.name_bn : work.name;

          return (
            <div
              key={work.workId}
              className={`card-depth p-5 flex flex-col justify-between transition-all t-tilt-card ${
                isActiveSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/30'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      work.isCompleted
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {work.isCompleted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    <span>{work.isCompleted ? t('works.completed') : t('works.active')}</span>
                  </span>

                  {isActiveSelected && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {t('banner.activeWork')}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                  {title}
                </h3>

                {work.department && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <Building size={13} className="text-slate-400" />
                    <span>{work.department}</span>
                  </div>
                )}

                {work.address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{work.address}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('works.totalBudget')}
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatCurrency(work.totalBudget, lang)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveWork(work)}
                  disabled={isActiveSelected}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    isActiveSelected
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isActiveSelected ? 'বর্তমান সক্রিয়' : 'নির্বাচন করুন'}
                </button>

                {(isMainAdmin || work.createdBy === currentUser?.uid) && (
                  <button
                    onClick={() => handleToggleComplete(work)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    title={work.isCompleted ? t('works.markActive') : t('works.markCompleted')}
                  >
                    <CheckCircle2 size={16} className={work.isCompleted ? 'text-slate-400' : 'text-emerald-600'} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Work Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-depth-lg border border-slate-200/80 w-full max-w-lg overflow-hidden modal-enter">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{t('works.createNew')}</h3>
              <button onClick={() => setIsCreateOpen(false)}>
                <X size={18} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('works.workName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gulshan Corporate Office Renovation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('works.workNameBn')}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: গুলশান কর্পোরেট অফিস সংস্কার"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {t('works.department')}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Civil & Interior"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {t('works.totalBudget')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 1500000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('works.address')}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Road 11, Gulshan-1, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-950/20"
                >
                  {loading ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

