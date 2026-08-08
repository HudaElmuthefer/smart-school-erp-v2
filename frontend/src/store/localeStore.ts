import { create } from 'zustand';
import i18n from '../i18n';

type Locale = 'ar' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const stored = (localStorage.getItem('locale') as Locale | null) ?? 'ar';
document.documentElement.dir = stored === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = stored;

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: stored,
  setLocale: (locale) => {
    localStorage.setItem('locale', locale);
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
    set({ locale });
  },
}));
