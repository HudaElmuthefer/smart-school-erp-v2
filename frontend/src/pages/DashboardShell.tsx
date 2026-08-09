import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';
import DashboardBanner from '../components/layout/DashboardBanner';

export default function DashboardShell() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppLayout>
      <DashboardBanner title={`👋 ${user?.full_name}`} subtitle={user?.role_ar} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-navy-800">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white">أهلاً بك في نظام المدرسة الذكي</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">استخدم القائمة الجانبية للتنقل بين الوحدات.</p>
      </div>
    </AppLayout>
  );
}
