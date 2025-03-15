import { InitOptions } from 'i18next';

export const defaultNS = 'common';
export const fallbackLng = 'en';

export const languages = ['en', 'ar', 'ur', 'hi'];

export const defaultOptions: InitOptions = {
  debug: process.env.NODE_ENV === 'development',
  fallbackLng,
  defaultNS,
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}; 