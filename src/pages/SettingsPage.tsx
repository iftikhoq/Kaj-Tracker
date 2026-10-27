import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Reason, Metric } from '../types/models';
import { dataStore } from '../services/storage';
import {
  Settings,
  Database,
  Key,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Table,
  Layers,
  Sparkles,
  Copy,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { isMainAdmin, currentUser } = useAuth();

  // Settings State
  const [sheetId, setSheetId] = useState('');
  const [firebaseConfigJson, setFirebaseConfigJson] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
  const [secretsStatus, setSecretsStatus] = useState({
    googleServiceAccount: false,
    firebaseAdmin: false,
    sheetIdConfigured: false,
  });
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [initializingSheets, setInitializingSheets] = useState(false);

  // Shared Categories & Metrics
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [newReasonName, setNewReasonName] = useState('');
  const [newReasonNameBn, setNewReasonNameBn] = useState('');
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricNameBn, setNewMetricNameBn] = useState('');
  const [activeTab, setActiveTab] = useState<'reasons' | 'metrics'>('reasons');

  useEffect(() => {
    loadSettings();
    loadSharedLists();
  }, []);

  const loadSettings = async () => {
    const saved = dataStore.getSettings();
    setSheetId(saved.sheetId || import.meta.env.SHEET_ID || '');
    setFirebaseConfigJson(saved.firebaseWebConfig || '');

    try {
      const serverSettings = await api.getSettings();
      if (serverSettings.sheetId && !saved.sheetId) {
        setSheetId(serverSettings.sheetId);
      }
      if (serverSettings.secrets) {
        setSecretsStatus(serverSettings.secrets);
      }
      if (serverSettings.serviceAccountEmail) {
        setServiceAccountEmail(serverSettings.serviceAccountEmail);
      }
    } catch (e) {
      console.warn('Could not fetch server settings status:', e);
    }
  };

  const loadSharedLists = async () => {
    try {
      const [r, m] = await Promise.all([api.getReasons(), api.getMetrics()]);
      setReasons(r);
      setMetrics(m);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = () => {
    dataStore.saveSettings({
      sheetId: sheetId.trim(),
      firebaseWebConfig: firebaseConfigJson.trim(),
    });
    toast.success(t('common.success'));
  };

  const handleTestConnection = async () => {
    if (!sheetId.trim()) {
      toast.error('স্প্রেডশিট আইডি প্রদান করুন');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testSheetConnection(sheetId.trim());
      setTestResult(res);
      if (res.serviceAccountEmail) {
        setServiceAccountEmail(res.serviceAccountEmail);
      }
      toast.success('গুগল স্প্রেডশিট সংযোগ সফল হয়েছে!');
    } catch (err: any) {
      toast.error(err.message || 'সংযোগ ব্যর্থ হয়েছে', { duration: 10000 });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitializeSheets = async () => {
    if (!sheetId.trim()) {
      toast.error('স্প্রেডশিট আইডি প্রদান করুন');
      return;
    }
    if (!window.confirm('আপনি কি এই স্প্রেডশিটে কাজ ট্র্যাকার-এর সকল টেবিল ও হেডার তৈরি করতে চান?')) return;

    setInitializingSheets(true);
    try {
      const res = await api.initializeSheets(sheetId.trim());
      toast.success('সকল টেবিল ও হেডার সফলভাবে তৈরি করা হয়েছে!');
      handleTestConnection();
    } catch (err: any) {
      toast.error(err.message || 'টেবিল তৈরি ব্যর্থ হয়েছে', { duration: 10000 });
    } finally {
      setInitializingSheets(false);
    }
  };

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonName.trim()) return;
    try {
      const created = await api.addReason(newReasonName.trim(), newReasonNameBn.trim() || undefined, currentUser?.uid);
      setReasons((prev) => [...prev, created]);
      setNewReasonName('');
      setNewReasonNameBn('');
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim()) return;
    try {
      const created = await api.addMetric(newMetricName.trim(), newMetricNameBn.trim() || undefined, currentUser?.uid);
      setMetrics((prev) => [...prev, created]);
      setNewMetricName('');
      setNewMetricNameBn('');
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* Main Admin Section: Sheets & Credentials */}
      {isMainAdmin && (
        <div className="space-y-6">
          <div className="card-depth p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-4">
              <Database size={20} className="text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t('settings.sheetSection')}</h3>
                <p className="text-xs text-slate-500">গুগল স্প্রেডশিটই অ্যাপের মূল ডেটাবেস। কোনো আলাদা ডেটাবেস দরকার নেই।</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('settings.sheetId')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('settings.sheetIdPlaceholder')}
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    className="flex-grow px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-depth-sm active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={testingConnection ? 'animate-spin' : ''} />
                  <span>{t('settings.testConnection')}</span>
                </button>

                <button
                  onClick={handleInitializeSheets}
                  disabled={initializingSheets}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-depth-sm active:scale-95 disabled:opacity-50"
                >
                  <Table size={13} />
                  <span>{t('settings.initSheets')}</span>
                </button>
              </div>

              {/* Service Account Share Guide Helper Banner */}
              {serviceAccountEmail && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">
                        সার্ভিস অ্যাকাউন্ট ইমেইল (Google Sheet Share Target):
                      </div>
                      <div className="font-mono text-emerald-800 font-semibold select-all break-all text-xs">
                        {serviceAccountEmail}
                      </div>
                      <p className="text-slate-600 text-2xs mt-0.5">
                        আপনার স্প্রেডশিটে গিয়ে <strong className="text-slate-900">Share</strong> বাটনে ক্লিক করে উপরের ইমেইলটিকে <strong className="text-emerald-700">Editor</strong> হিসেবে যুক্ত করুন।
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(serviceAccountEmail);
                      toast.success('সার্ভিস অ্যাকাউন্ট ইমেইল কপি করা হয়েছে!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shrink-0 transition-colors self-start sm:self-center text-xs"
                  >
                    <Copy size={13} />
                    <span>ইমেইল কপি</span>
                  </button>
                </div>
              )}

              {testResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 mt-3 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>সংযুক্ত স্প্রেডশিট: {testResult.title}</span>
                  </div>
                  {testResult.sheets && (
                    <div className="text-xs text-emerald-700 flex flex-wrap gap-1.5 mt-1">
                      <span className="font-semibold">বিদ্যমান টেবিল:</span>
                      {testResult.sheets.map((s: string) => (
                        <span key={s} className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-2xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Secrets and Environment Status */}
          <div className="card-depth p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-4">
              <ShieldCheck size={20} className="text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t('settings.secretsSection')}</h3>
                <p className="text-xs text-slate-500">নিরাপত্তার স্বার্থে প্রাইভেট কি ক্লায়েন্টে থাকে না, কেবল Vercel / .env এনভায়রনমেন্টে সংরক্ষিত হয়।</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{t('settings.googleServiceAccount')}</div>
                  <div className="text-2xs text-slate-400 font-mono mt-0.5">GOOGLE_SERVICE_ACCOUNT_JSON</div>
                </div>
                {secretsStatus.googleServiceAccount ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle size={13} />
                    <span>{t('settings.configured')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <AlertCircle size={13} />
                    <span>কনফিগার করা নেই</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{t('settings.firebaseAdmin')}</div>
                  <div className="text-2xs text-slate-400 font-mono mt-0.5">FIREBASE_ADMIN_JSON</div>
                </div>
                {secretsStatus.firebaseAdmin ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle size={13} />
                    <span>{t('settings.configured')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span>ঐচ্ছিক / অটো-ফলব্যাক</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Lists: Reasons and Metrics (Accessible to everyone!) */}
      <div className="card-depth p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">{t('settings.sharedLists')}</h3>
              <p className="text-xs text-slate-500">যেকোনো সদস্য নতুন খরচের খাত বা একক যুক্ত করতে পারেন, যা সবার জন্য শেয়ার করা থাকে।</p>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('reasons')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reasons' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t('settings.reasonsTab')}
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'metrics' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t('settings.metricsTab')}
            </button>
          </div>
        </div>

        {activeTab === 'reasons' ? (
          <div className="space-y-4">
            {/* Add Reason Form */}
            <form onSubmit={handleAddReason} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <input
                type="text"
                required
                placeholder={t('settings.reasonName')}
                value={newReasonName}
                onChange={(e) => setNewReasonName(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder={t('settings.reasonNameBn')}
                value={newReasonNameBn}
                onChange={(e) => setNewReasonNameBn(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{t('settings.addReason')}</span>
              </button>
            </form>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {reasons.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-depth-sm text-xs">
                  <div className="font-bold text-slate-800">{r.name}</div>
                  {r.name_bn && <div className="text-xs text-emerald-700 font-medium">{r.name_bn}</div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add Metric Form */}
            <form onSubmit={handleAddMetric} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <input
                type="text"
                required
                placeholder={t('settings.metricName')}
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder={t('settings.metricNameBn')}
                value={newMetricNameBn}
                onChange={(e) => setNewMetricNameBn(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{t('settings.addMetric')}</span>
              </button>
            </form>

            {/* List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-depth-sm text-xs">
                  <div className="font-bold text-slate-800">{m.name}</div>
                  {m.name_bn && <div className="text-xs text-emerald-700 font-medium">{m.name_bn}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

