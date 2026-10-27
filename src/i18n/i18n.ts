import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bnTranslation from './locales/bn.json';
import enTranslation from './locales/en.json';

const savedLanguage = localStorage.getItem('kaj_lang') || 'bn';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      bn: { translation: bnTranslation },
      en: { translation: enTranslation },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

