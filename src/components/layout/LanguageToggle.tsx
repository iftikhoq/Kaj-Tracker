import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('bn') ? 'bn' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('kaj_lang', nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-200 border border-white/15 shadow-sm active:scale-95"
      title="Toggle Language / ভাষা পরিবর্তন করুন"
    >
      <Languages size={15} className="text-emerald-300" />
      <span className="tracking-wide">
        {currentLang === 'bn' ? 'বাংলা (BN)' : 'English (EN)'}
      </span>
    </button>
  );
};

