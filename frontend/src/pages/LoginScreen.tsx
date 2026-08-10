import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore, type AuthUser } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSchoolBranding } from '../hooks/useSchoolBranding';
import loginLogoLight from '../assets/login_logo_light.png';
import loginLogoDark from '../assets/login_dark_top.png';
import loginLightSide from '../assets/login_light_side.png';
import loginDarkSide from '../assets/login_dark_side.png';
import loginLightBottom from '../assets/login_light_bottom.png';
import loginDarkBottom from '../assets/login_dark_bottom.png';

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const { mode, toggle: toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data } = useSchoolBranding();

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

  const appName = data?.app_name_ar || t('appName');
  const tagline = data?.login_tagline_ar;

  const logo = data?.logo_url || (isDark ? loginLogoDark : loginLogoLight);
  const sideImage = isDark ? loginDarkSide : loginLightSide;
  const bottomImage = isDark ? loginDarkBottom : loginLightBottom;

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 dark:bg-navy-950">
      <div className="absolute top-4 start-4 z-10 flex gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-white/10 dark:bg-navy-800 dark:text-slate-200"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="order-2 flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-4">
        <div className="mb-2 text-center">
          <img src={logo} alt={appName} className="mx-auto h-14 w-auto object-contain" />
          <h1 className="mt-1 text-xl font-bold text-navy-900 dark:text-white">{appName}</h1>
          {tagline && <p className="mt-0.5 text-sm text-gold-500">{tagline}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate();
          }}
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-navy-800"
        >
          <h2 className="text-center text-lg font-semibold text-navy-900 dark:text-white">{t('login.title')}</h2>
          <div className="mx-auto mt-1 mb-5 h-[3px] w-12 rounded bg-gold-500" />

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

      <div className="relative order-1 hidden flex-1 overflow-hidden sm:block">
        <img src={sideImage} alt="" className="h-full w-full object-cover" />
      </div>

      <img
        src={bottomImage}
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-full"
      />
    </div>
  );
}
