'use client';

import { useEffect } from 'react';
import i18n from '@/i18n/client';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize i18n on the client side
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') || 'en';
      i18n.changeLanguage(savedLanguage);
      
      // Set document direction for RTL languages
      document.documentElement.dir = savedLanguage === 'ar' || savedLanguage === 'ur' ? 'rtl' : 'ltr';
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
} 