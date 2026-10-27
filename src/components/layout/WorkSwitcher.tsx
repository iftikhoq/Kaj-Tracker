import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../../context/WorkContext';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { works, activeWork, setActiveWork } = useWork();
  const { isMainAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeWork && works.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
        <Briefcase size={14} />
        <span>{t('banner.noWorkSelected')}</span>
      </div>
    );
  }

  const displayName = lang === 'bn' && activeWork?.name_bn ? activeWork.name_bn : activeWork?.name;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 text-slate-100 border border-white/15 backdrop-blur-md transition-all duration-200 text-xs shadow-sm max-w-[260px] md:max-w-[320px]"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Briefcase size={13} />
        </div>
        <div className="flex flex-col text-left truncate">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/80">
            {t('banner.activeWork')}
          </span>
          <span className="font-semibold truncate leading-tight">
            {displayName || t('banner.noWorkSelected')}
          </span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ml-1 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 md:left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 modal-enter text-xs">
          <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t('banner.switchWork')}</span>
            <span className="text-emerald-400">{works.length}</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {works.map((work) => {
              const isSelected = activeWork?.workId === work.workId;
              const title = lang === 'bn' && work.name_bn ? work.name_bn : work.name;

              return (
                <button
                  key={work.workId}
                  onClick={() => {
                    setActiveWork(work);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/50 text-emerald-300 font-semibold border border-emerald-800/40'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Building2 size={15} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
                    <div className="truncate">
                      <div className="truncate font-medium">{title}</div>
                      {work.department && (
                        <div className="text-[10px] text-slate-400 truncate">{work.department}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {isMainAdmin && (
            <div className="pt-2 border-t border-slate-800 mt-1">
              <Link
                to="/works"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                <Plus size={14} />
                <span>{t('works.createNew')}</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
