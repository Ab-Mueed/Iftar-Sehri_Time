import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultOptions } from './config';

// Import language resources
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import urCommon from './locales/ur/common.json';
import hiCommon from './locales/hi/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  ar: {
    common: arCommon,
  },
  ur: {
    common: urCommon,
  },
  hi: {
    common: hiCommon,
  },
};

i18next
  .use(initReactI18next)
  .init({
    ...defaultOptions,
    resources,
  });

export default i18next; 