import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';

export default function DashboardShell() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-navy-800">
        <h1 className="text-lg font-bold text-navy-900 dark:text-white">👋 {user?.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.role_ar}</p>
      </div>
    </AppLayout>
  );
}
