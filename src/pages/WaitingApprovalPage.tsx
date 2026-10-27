import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useWork } from '../context/WorkContext';
import { Clock, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

export const WaitingApprovalPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { refreshWorks, loading } = useWork();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-depth-lg text-center modal-enter">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-500 mb-5">
          <Clock size={32} />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          {t('auth.waitingTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          {t('auth.waitingSubtitle')}
        </p>

        <div className="my-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300">
          <div className="font-semibold text-white">{currentUser?.name_bn || currentUser?.name}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser?.email}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => refreshWorks()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{t('auth.refreshStatus')}</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            <span>{t('auth.signOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

