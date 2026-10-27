import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../../context/WorkContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Reason, Metric, CostingSource } from '../../types/models';
import { Modal } from '../common/Modal';
import { Plus, X, AlertCircle, Check, DollarSign, Tag, Scale } from 'lucide-react';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork } = useWork();
  const { currentUser } = useAuth();

  const [reasons, setReasons] = useState<Reason[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [reasonId, setReasonId] = useState('');
  const [materialAmount, setMaterialAmount] = useState<string>('');
  const [metricId, setMetricId] = useState('');
  const [costAmount, setCostAmount] = useState<string>('');
  const [source, setSource] = useState<CostingSource>('BUDGET');
  const [note, setNote] = useState('');

  // Inline creation states
  const [isAddingReason, setIsAddingReason] = useState(false);
  const [newReasonName, setNewReasonName] = useState('');
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetricName, setNewMetricName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen]);

  const loadDropdowns = async () => {
    try {
      const [rList, mList] = await Promise.all([api.getReasons(), api.getMetrics()]);
      setReasons(rList);
      setMetrics(mList);
      if (rList.length > 0 && !reasonId) setReasonId(rList[0].id);
      if (mList.length > 0 && !metricId) setMetricId(mList[0].id);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCreateReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonName.trim()) return;
    try {
      const created = await api.addReason(newReasonName.trim(), newReasonName.trim(), currentUser?.uid);
      setReasons((prev) => [...prev, created]);
      setReasonId(created.id);
      setNewReasonName('');
      setIsAddingReason(false);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim()) return;
    try {
      const created = await api.addMetric(newMetricName.trim(), newMetricName.trim(), currentUser?.uid);
      setMetrics((prev) => [...prev, created]);
      setMetricId(created.id);
      setNewMetricName('');
      setIsAddingMetric(false);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork) return;

    const parsedCost = parseFloat(costAmount);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      toast.error('সঠিক টাকার পরিমাণ দিন / Please enter a valid cost amount');
      return;
    }

    if (!reasonId) {
      toast.error('খরচের খাত নির্বাচন করুন / Please select an expense category');
      return;
    }

    setLoading(true);
    try {
      await api.addCosting({
        workId: activeWork.workId,
        userId: currentUser?.uid || '',
        reasonId,
        materialAmount: materialAmount ? parseFloat(materialAmount) : undefined,
        metricId: metricId || undefined,
        costAmount: parsedCost,
        source,
        note: note.trim() || undefined,
      });

      toast.success(t('common.success'));
      // Reset form
      setCostAmount('');
      setMaterialAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('expenses.addModalTitle')}
      icon={<Plus size={18} />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Reason / Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-600" />
                <span>{t('expenses.reason')} *</span>
              </label>
              {!isAddingReason && (
                <button
                  type="button"
                  onClick={() => setIsAddingReason(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
                >
                  {t('expenses.addNewReason')}
                </button>
              )}
            </div>

            {isAddingReason ? (
              <div className="flex gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="text"
                  placeholder={t('expenses.newReasonPrompt')}
                  value={newReasonName}
                  onChange={(e) => setNewReasonName(e.target.value)}
                  className="flex-grow px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateReason}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-xs"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingReason(false)}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-xs"
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {lang === 'bn' && r.name_bn ? r.name_bn : r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cost Amount & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5 text-xs">
                <DollarSign size={13} className="text-emerald-600" />
                <span>{t('expenses.costAmount')} *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="0.00"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-base text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block text-xs">
                {t('expenses.source')} *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSource('BUDGET')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    source === 'BUDGET'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t('expenses.sourceBudget')}
                </button>
                <button
                  type="button"
                  onClick={() => setSource('PERSONAL')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    source === 'PERSONAL'
                      ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t('expenses.sourcePersonal')}
                </button>
              </div>
            </div>
          </div>

          {source === 'PERSONAL' && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-800 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>{t('expenses.sourceNote')}</span>
            </div>
          )}

          {/* Material Amount & Metric (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block text-xs">
                {t('expenses.materialAmount')}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 50"
                value={materialAmount}
                onChange={(e) => setMaterialAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Scale size={13} className="text-emerald-600" />
                  <span>{t('expenses.metric')}</span>
                </label>
                {!isAddingMetric && (
                  <button
                    type="button"
                    onClick={() => setIsAddingMetric(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
                  >
                    {t('expenses.addNewMetric')}
                  </button>
                )}
              </div>

              {isAddingMetric ? (
                <div className="flex gap-2 p-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <input
                    type="text"
                    placeholder={t('expenses.newMetricPrompt')}
                    value={newMetricName}
                    onChange={(e) => setNewMetricName(e.target.value)}
                    className="flex-grow px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateMetric}
                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingMetric(false)}
                    className="px-1 text-slate-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={metricId}
                  onChange={(e) => setMetricId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">— {t('expenses.selectMetric')} —</option>
                  {metrics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {lang === 'bn' && m.name_bn ? m.name_bn : m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="font-semibold text-slate-700 mb-1.5 block">
              {t('expenses.note')}
            </label>
            <textarea
              rows={2}
              placeholder="Ex: বিল ভাউচার নম্বর, দোকান বা সরবরাহের স্থান..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
    </Modal>
  );
};

