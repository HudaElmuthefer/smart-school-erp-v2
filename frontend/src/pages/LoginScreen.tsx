import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLocaleStore } from '../store/localeStore';

interface School {
  id: number;
  app_name_ar: string | null;
  app_name_en: string | null;
  login_tagline_ar: string | null;
  login_tagline_en: string | null;
  logo_path: string | null;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const isEnglish = locale === 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });

  const loginMutation = useMutation({
    mutationFn: async () => (await api.post<{ token: string; user: AuthUser }>('/login', { email, password })).data,
    onSuccess: (data) => {
      setSession(data.token, data.user);
      navigate('/');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('login.invalid'));
    },
  });

  const appName = (isEnglish ? data?.app_name_en : data?.app_name_ar) || t('appName');
  const tagline = isEnglish ? data?.login_tagline_en : data?.login_tagline_ar;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-navy-950">
      <div className="absolute top-4 start-4 flex gap-2">
        <button
          onClick={() => setLocale(isEnglish ? 'ar' : 'en')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-navy-800 dark:text-slate-200"
        >
          🌐 {isEnglish ? 'عربي' : 'English'}
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-navy-800 dark:text-slate-200"
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loginMutation.mutate();
        }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-navy-800"
      >
        <h1 className="text-center text-xl font-bold text-navy-900 dark:text-white">{appName}</h1>
        {tagline && <p className="mt-1 text-center text-sm text-gold-500">{tagline}</p>}

        <h2 className="mt-6 text-center text-lg font-semibold text-navy-900 dark:text-white">{t('login.title')}</h2>
        <div className="mx-auto mt-1 mb-6 h-[3px] w-12 rounded bg-gold-500" />

        <label className="text-xs text-slate-500 dark:text-slate-400">{t('login.email')}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
        />

        <label className="text-xs text-slate-500 dark:text-slate-400">{t('login.password')}</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
        />

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-navy-950 disabled:opacity-70"
        >
          {loginMutation.isPending ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </div>
  );
}
