import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  LogOut,
  ShieldCheck,
  UserCheck,
  Layers,
  X,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { t } = useTranslation();
  const { currentUser, logout, isMainAdmin } = useAuth();

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { path: '/expenses', label: t('nav.expenses'), icon: <Receipt size={18} /> },
    { path: '/users', label: t('nav.users'), icon: <Users size={18} /> },
    { path: '/categories', label: t('nav.categories'), icon: <PieChart size={18} /> },
    { path: '/works', label: t('nav.works'), icon: <Briefcase size={18} /> },
    { path: '/reports', label: t('nav.reports'), icon: <Printer size={18} /> },
    { path: '/settings', label: t('nav.settings'), icon: <Settings size={18} />, adminOnly: true },
  ];

  return (
    <aside className="bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 p-4 select-none">
      {/* Brand & Console Header */}
      <div className="pb-4 border-b border-slate-800/80 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 font-black text-lg">
            ক
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              <span>{t('app.title')}</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              {t('app.version')}
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isMainAdmin) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40 border-l-4 border-emerald-300'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-emerald-400'
                }`
              }
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Card & Sign Out */}
      <div className="pt-4 border-t border-slate-800/80 mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-emerald-400/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex flex-col truncate">
            <strong className="text-xs text-white font-semibold truncate">
              {currentUser?.name_bn || currentUser?.name || 'User'}
            </strong>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              {isMainAdmin ? (
                <>
                  <ShieldCheck size={11} />
                  <span>{t('users.roleMainAdmin')}</span>
                </>
              ) : (
                <>
                  <UserCheck size={11} />
                  <span>{t('users.roleMember')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-red-300 hover:text-red-200 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 transition-colors"
        >
          <LogOut size={14} />
          <span>{t('auth.signOut')}</span>
        </button>
      </div>
    </aside>
  );
};

