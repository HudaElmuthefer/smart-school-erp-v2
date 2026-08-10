import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Users, GraduationCap, Building2, Settings, CalendarCheck, BarChart3, ClipboardList, BookOpen, Briefcase, Wallet, Receipt, Package, Megaphone, MessageSquare, FileSpreadsheet, DatabaseBackup, Bot, AlertTriangle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useSchoolBranding } from '../../hooks/useSchoolBranding';
import { SETTINGS_TABS } from '../../pages/settings/constants';
import { api } from '../../lib/api';
import logoLight from '../../assets/logo_light.png';
import logoDark from '../../assets/logo_dark.png';
import sidebarBgLight from '../../assets/sidebar_light.png';
import sidebarBgDark from '../../assets/sidebar_dark.png';

interface NavItem {
  key: string;
  to: string;
  icon: ReactNode;
  labelKey: string;
  roles?: string[];
  excludeRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', to: '/', icon: <LayoutDashboard size={18} />, labelKey: 'nav.home' },
  { key: 'announcements', to: '/announcements', icon: <Megaphone size={18} />, labelKey: 'nav.announcements' },
  { key: 'messages', to: '/messages', icon: <MessageSquare size={18} />, labelKey: 'nav.messages' },
  { key: 'students', to: '/students', icon: <GraduationCap size={18} />, labelKey: 'nav.students', excludeRoles: ['parent'] },
  { key: 'academic', to: '/academic-structure', icon: <Users size={18} />, labelKey: 'nav.academicStructure', excludeRoles: ['parent'] },
  { key: 'teachers', to: '/teachers', icon: <Users size={18} />, labelKey: 'nav.teachers', excludeRoles: ['parent'] },
  { key: 'attendance', to: '/attendance', icon: <CalendarCheck size={18} />, labelKey: 'nav.attendance', excludeRoles: ['parent'] },
  { key: 'grades', to: '/grades', icon: <BarChart3 size={18} />, labelKey: 'nav.grades', excludeRoles: ['parent'] },
  { key: 'assignments', to: '/assignments', icon: <ClipboardList size={18} />, labelKey: 'nav.assignments' },
  { key: 'lms', to: '/lms', icon: <BookOpen size={18} />, labelKey: 'nav.lms' },
  { key: 'staff', to: '/staff', icon: <Briefcase size={18} />, labelKey: 'nav.staff', excludeRoles: ['parent'] },
  { key: 'finance', to: '/finance', icon: <Wallet size={18} />, labelKey: 'nav.finance', excludeRoles: ['parent'] },
  { key: 'installments', to: '/installments', icon: <Receipt size={18} />, labelKey: 'nav.installments', excludeRoles: ['parent'] },
  { key: 'inventory', to: '/inventory', icon: <Package size={18} />, labelKey: 'nav.inventory', excludeRoles: ['parent'] },
  { key: 'exportImport', to: '/export-import', icon: <FileSpreadsheet size={18} />, labelKey: 'nav.exportImport', excludeRoles: ['parent'] },
  { key: 'backups', to: '/backups', icon: <DatabaseBackup size={18} />, labelKey: 'nav.backups', roles: ['super_admin', 'admin'] },
  { key: 'aiChat', to: '/ai-chat', icon: <Bot size={18} />, labelKey: 'nav.aiChat', roles: ['parent'] },
  { key: 'earlyWarning', to: '/early-warning', icon: <AlertTriangle size={18} />, labelKey: 'nav.earlyWarning', excludeRoles: ['parent'] },
  { key: 'schools', to: '/schools', icon: <Building2 size={18} />, labelKey: 'nav.schools', roles: ['super_admin'] },
  { key: 'settings', to: '/settings', icon: <Settings size={18} />, labelKey: 'nav.settings', excludeRoles: ['parent'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { data: school } = useSchoolBranding();

  const onSettingsPage = location.pathname === '/settings';
  const currentSettingsTab = new URLSearchParams(location.search).get('tab') ?? 'users';
  const [settingsExpanded, setSettingsExpanded] = useState(onSettingsPage);
  useEffect(() => {
    if (onSettingsPage) setSettingsExpanded(true);
  }, [onSettingsPage]);

  const toggleSettingsNav = () => {
    if (!onSettingsPage) navigate('/settings?tab=users');
    else setSettingsExpanded((v) => !v);
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.roles || item.roles.includes(user?.role ?? '')) &&
      (!item.excludeRoles || !item.excludeRoles.includes(user?.role ?? '')),
  );

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // نتجاهل فشل الشبكة هنا لأن الجلسة ستُمسح محلياً بأي حال
    }
    clearSession();
    navigate('/login');
  };

  const logo = school?.logo_url || (mode === 'dark' ? logoDark : logoLight);
  const sidebarBg = mode === 'dark' ? sidebarBgDark : sidebarBgLight;
  const appName = school?.app_name_ar || t('appName');

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      <aside className="relative flex w-64 flex-col overflow-hidden text-slate-100">
        <img src={sidebarBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy-950/60" />

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="p-5 text-center">
            <img src={logo} alt={appName} className="mx-auto h-14 w-14 object-contain" />
            <h2 className="mt-2 text-sm font-bold">{appName}</h2>
          </div>
          <nav className="flex-1 px-3">
            {visibleItems.map((item) => {
              const active = location.pathname === item.to;

              if (item.key === 'settings') {
                return (
                  <div key={item.key}>
                    <button
                      type="button"
                      onClick={toggleSettingsNav}
                      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        active ? 'bg-gold-500 font-bold text-navy-950' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 text-start">{t(item.labelKey)}</span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {settingsExpanded && (
                      <div className="mb-1 ms-3 space-y-0.5 border-s border-white/10 ps-3">
                        {SETTINGS_TABS.map((tabItem) => {
                          const tabActive = active && currentSettingsTab === tabItem.key;
                          return (
                            <Link
                              key={tabItem.key}
                              to={`/settings?tab=${tabItem.key}`}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                                tabActive ? 'bg-gold-500/20 font-bold text-gold-400' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <span>{tabItem.icon}</span>
                              {tabItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    active ? 'bg-gold-500 font-bold text-navy-950' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/15 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-slate-400/80" />
              <div className="text-xs">
                <div className="font-bold">{user?.full_name}</div>
                <div className="text-slate-300">{user?.role_ar}</div>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white">
              <LogOut size={14} /> {t('nav.logout')}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-800">
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
