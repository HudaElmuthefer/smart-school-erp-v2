import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Printer, ArrowRight, Home, Search } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useLocaleStore } from '../../store/localeStore';
import DashboardBanner from '../../components/layout/DashboardBanner';
import { SETTINGS_TABS } from './constants';
import UsersPermissionsTab from './tabs/UsersPermissionsTab';
import AppearanceTab from './tabs/AppearanceTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import PrintSettingsTab from './tabs/PrintSettingsTab';
import LogoTab from './tabs/LogoTab';
import SystemNameTab from './tabs/SystemNameTab';
import BranchesTab from './tabs/BranchesTab';
import BackupTab from './tabs/BackupTab';
import UpdatesTab from './tabs/UpdatesTab';
import TrashTab from './tabs/TrashTab';
import AboutTab from './tabs/AboutTab';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const isEnglish = locale === 'en';
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  const filteredTabs = SETTINGS_TABS.filter((t) => !search || t.label.includes(search));

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      <aside className="w-64 shrink-0 border-e border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900">
        <h2 className="mb-3 px-2 text-sm font-bold text-navy-900 dark:text-white">⚙️ الإعدادات</h2>
        <nav>
          {filteredTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-sm ${
                tab === t.key
                  ? 'bg-gold-500 font-bold text-navy-950'
                  : 'text-navy-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
          {filteredTabs.length === 0 && <p className="px-2 text-xs text-slate-400">لا توجد نتائج</p>}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-800">
          <div className="flex items-center gap-2">
            <button
              title="رجوع"
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <ArrowRight size={16} />
            </button>
            <button
              title="الرئيسية"
              onClick={() => navigate('/')}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Home size={16} />
            </button>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في النظام"
                className="w-56 rounded-full border border-slate-200 bg-slate-50 py-1.5 ps-8 pe-3 text-xs dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(isEnglish ? 'ar' : 'en')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-white/10 dark:text-slate-200"
            >
              🌐 {isEnglish ? 'عربي' : 'English'}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-white/10 dark:text-slate-200"
            >
              {mode === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              title="طباعة سريعة"
              onClick={() => window.print()}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Printer size={16} />
            </button>
            <button
              title="الإعلانات"
              onClick={() => navigate('/announcements')}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Megaphone size={16} />
            </button>
          </div>
        </header>

        <main className="p-6">
          <DashboardBanner title="⚙️ الإعدادات" subtitle="إدارة المستخدمين والصلاحيات وإعدادات النظام العامة" />
          {tab === 'users' && <UsersPermissionsTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'system' && <SystemSettingsTab />}
          {tab === 'print' && <PrintSettingsTab />}
          {tab === 'logo' && <LogoTab />}
          {tab === 'systemName' && <SystemNameTab />}
          {tab === 'branches' && <BranchesTab />}
          {tab === 'backup' && <BackupTab />}
          {tab === 'updates' && <UpdatesTab />}
          {tab === 'trash' && <TrashTab />}
          {tab === 'about' && <AboutTab />}
        </main>
      </div>
    </div>
  );
}
