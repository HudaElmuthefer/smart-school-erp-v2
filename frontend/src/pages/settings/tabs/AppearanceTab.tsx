import { useThemeStore } from '../../../store/themeStore';
import { useLocaleStore } from '../../../store/localeStore';

export default function AppearanceTab() {
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">🎨 المظهر واللغة</h2>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <div>
          <p className="text-sm font-bold text-navy-900 dark:text-white">الوضع الداكن</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">يطبَّق على كامل النظام فوراً</p>
        </div>
        <button
          onClick={toggleTheme}
          className={`h-7 w-14 rounded-full transition-colors ${mode === 'dark' ? 'bg-gold-500' : 'bg-slate-300'}`}
        >
          <span
            className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
              mode === 'dark' ? 'translate-x-1' : 'translate-x-7'
            }`}
          />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <p className="mb-2 text-sm font-bold text-navy-900 dark:text-white">لغة الواجهة</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('ar')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${locale === 'ar' ? 'bg-gold-500 text-navy-950' : 'border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${locale === 'en' ? 'bg-gold-500 text-navy-950' : 'border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300'}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
