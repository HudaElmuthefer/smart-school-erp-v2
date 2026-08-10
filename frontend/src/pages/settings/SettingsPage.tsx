import { useNavigate, useSearchParams } from 'react-router-dom';
import { Megaphone, Printer } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import DashboardBanner from '../../components/layout/DashboardBanner';
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
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'users';

  return (
    <AppLayout>
      <DashboardBanner title="⚙️ الإعدادات" subtitle="إدارة المستخدمين والصلاحيات وإعدادات النظام العامة" />

      <div className="mb-4 flex justify-end gap-2">
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
    </AppLayout>
  );
}
