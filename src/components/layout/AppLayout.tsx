import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HeaderBanner } from './HeaderBanner';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:grid md:grid-cols-[250px_1fr]">
      {/* Desktop Sidebar (Sticky left) */}
      <div className="hidden md:block h-screen sticky top-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Top Navbar with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs">ক</span>
            <span className="font-bold text-sm">{t('app.title')}</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <HeaderBanner />
        <div className="t-panel-slide">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

