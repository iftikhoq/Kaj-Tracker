import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Users,
  PieChart,
  Briefcase,
  Settings,
  Printer,
} from 'lucide-react';
import { WorkSwitcher } from './WorkSwitcher';
import { LanguageToggle } from './LanguageToggle';

function getGreeting(lang: 'bn' | 'en'): string {
  const hour = new Date().getHours();
  if (lang === 'bn') {
    if (hour < 5) return 'শুভ রাত্রি';
    if (hour < 12) return 'শুভ সকাল';
    if (hour < 17) return 'শুভ দুপুর';
    if (hour < 20) return 'শুভ বিকেল';
    return 'শুভ সন্ধ্যা';
  } else {
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}

function LiveClock({ lang }: { lang: 'bn' | 'en' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-right hidden sm:block">
      <div className="font-serif font-bold text-white text-lg tabular-nums tracking-wide">
        {time.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
      <div className="text-emerald-200/80 text-[11px] mt-0.5 font-medium">
        {time.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}

export const HeaderBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';

  const PAGE_META: Record<string, { title: string; subtitle: string; icon: React.ReactNode; watermark: string }> = {
    '/': {
      title: t('dashboard.title'),
      subtitle: t('dashboard.subtitle'),
      icon: <LayoutDashboard size={26} />,
      watermark: 'DASHBOARD',
    },
    '/expenses': {
      title: t('expenses.title'),
      subtitle: t('expenses.subtitle'),
      icon: <Receipt size={26} />,
      watermark: 'EXPENSES',
    },
    '/users': {
      title: t('users.title'),
      subtitle: t('users.subtitle'),
      icon: <Users size={26} />,
      watermark: 'MEMBERS',
    },
    '/categories': {
      title: t('categories.title'),
      subtitle: t('categories.subtitle'),
      icon: <PieChart size={26} />,
      watermark: 'CATEGORIES',
    },
    '/works': {
      title: t('works.title'),
      subtitle: t('works.subtitle'),
      icon: <Briefcase size={26} />,
      watermark: 'PROJECTS',
    },
    '/settings': {
      title: t('settings.title'),
      subtitle: t('settings.subtitle'),
      icon: <Settings size={26} />,
      watermark: 'SETTINGS',
    },
    '/reports': {
      title: t('reports.title'),
      subtitle: t('reports.subtitle'),
      icon: <Printer size={26} />,
      watermark: 'REPORTS',
    },
  };

  const meta = PAGE_META[pathname] || PAGE_META['/'];
  const greeting = getGreeting(lang);

  return (
    <div className="relative z-10 rounded-2xl mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 shadow-depth-lg border border-slate-700/60 no-print">
      {/* Decorative Radial Glows and Watermark (clipped to rounded corners) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-32 -bottom-20 w-60 h-60 rounded-full bg-teal-500/10 blur-2xl" />

        {/* Subtle Watermark Typography */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 font-serif text-6xl md:text-8xl font-black text-white/[0.04] select-none pointer-events-none tracking-widest">
          {meta.watermark}
        </div>

        {/* Emerald & Gold Hairline Bottom Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
      </div>

      {/* Main Banner Bar */}
      <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Icon, Greeting, Title */}
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 md:w-14 md:h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            {meta.icon}
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-emerald-300 flex items-center gap-2 mb-1">
              <span>{greeting}, {currentUser?.name_bn || currentUser?.name?.split(' ')[0] || 'User'}</span>
              <span className="text-white/40">·</span>
              <span className="text-slate-300 font-normal">{t('banner.executive')}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-300/80 mt-1 max-w-xl line-clamp-1">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Work Switcher, Live Clock & Language Toggle */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <WorkSwitcher />
          <LanguageToggle />
          <LiveClock lang={lang} />
        </div>
      </div>
    </div>
  );
};

