import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LanguageToggle } from '../components/layout/LanguageToggle';
import { Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { loginWithGoogle, isFirebaseAvailable } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success(t('common.success'));
      navigate('/');
    } catch (err: any) {
      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        toast.error('ফায়ারবেস ক্লায়েন্ট কি কনফিগার করা নেই। অনুগ্রহ করে এনভায়রনমেন্ট ভ্যারিয়েবল চেক করুন।');
      } else {
        toast.error(err.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher top right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      <div className="card-depth w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-3xl shadow-lg shadow-emerald-950/80 mb-4">
          ক
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">{t('app.title')}</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t('app.subtitle')}</p>

        {/* Firebase Config Notice if missing */}
        {!isFirebaseAvailable && (
          <div className="my-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs text-left flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">ফায়ারবেস কনফিগারেশন প্রয়োজন</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                গুগল সাইন-ইন চালু করতে Vercel বা .env-এ Firebase Web Client কী কনফিগার করুন।
              </p>
            </div>
          </div>
        )}

        {/* Google Login Form */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'লগইন হচ্ছে...' : t('auth.googleButton')}</span>
          </button>
        </div>

        {/* Footnote */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <span>গুগল স্প্রেডশিট সমর্থিত সুরক্ষিত কার্য ও ব্যয় ব্যবস্থাপনা প্ল্যাটফর্ম</span>
        </div>
      </div>
    </div>
  );
};
