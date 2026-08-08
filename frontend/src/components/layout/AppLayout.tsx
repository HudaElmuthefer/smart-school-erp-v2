import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Users, GraduationCap, Building2, Settings, CalendarCheck, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLocaleStore } from '../../store/localeStore';
import { api } from '../../lib/api';

interface NavItem {
  key: string;
  to: string;
  icon: ReactNode;
  labelKey: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', to: '/', icon: <LayoutDashboard size={18} />, labelKey: 'nav.home' },
  { key: 'students', to: '/students', icon: <GraduationCap size={18} />, labelKey: 'nav.students' },
  { key: 'academic', to: '/academic-structure', icon: <Users size={18} />, labelKey: 'nav.academicStructure' },
  { key: 'teachers', to: '/teachers', icon: <Users size={18} />, labelKey: 'nav.teachers' },
  { key: 'attendance', to: '/attendance', icon: <CalendarCheck size={18} />, labelKey: 'nav.attendance' },
  { key: 'grades', to: '/grades', icon: <BarChart3 size={18} />, labelKey: 'nav.grades' },
  { key: 'schools', to: '/schools', icon: <Building2 size={18} />, labelKey: 'nav.schools', roles: ['super_admin'] },
  { key: 'settings', to: '/settings', icon: <Settings size={18} />, labelKey: 'nav.settings' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role ?? ''));

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // نتجاهل فشل الشبكة هنا لأن الجلسة ستُمسح محلياً بأي حال
    }
    clearSession();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      <aside className="flex w-64 flex-col bg-navy-900 text-slate-100">
        <div className="p-5 text-center">
          <h2 className="text-sm font-bold">{t('appName')}</h2>
        </div>
        <nav className="flex-1 px-3">
          {visibleItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  active ? 'bg-gold-500 font-bold text-navy-950' : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 text-xs">
            <div className="font-bold">{user?.full_name}</div>
            <div className="text-slate-400">{user?.role_ar}</div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white">
            <LogOut size={14} /> {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-800">
          <button
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-white/10 dark:text-slate-200"
          >
            🌐 {locale === 'ar' ? 'English' : 'عربي'}
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-white/10 dark:text-slate-200"
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
