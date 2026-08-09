import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api } from '../../../lib/api';

interface SystemInfo {
  app_version: string | null;
  laravel_version: string;
  php_version: string;
}

export default function UpdatesTab() {
  const info = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => (await api.get<SystemInfo>('/system-info')).data,
  });

  return (
    <div className="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">🔄 التحديثات</h2>
        <button
          onClick={() => info.refetch()}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
        >
          <RefreshCw size={14} /> تحديث المعلومات
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <Row label="إصدار الكود الحالي" value={info.data?.app_version ?? 'غير متوفر'} />
        <Row label="إصدار Laravel" value={info.data?.laravel_version ?? '—'} />
        <Row label="إصدار PHP" value={info.data?.php_version ?? '—'} />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        لا يوجد حالياً فحص تلقائي لتحديثات جديدة عبر الإنترنت — هذه معلومات الإصدار المثبَّت فعلياً على الخادم.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-white/5">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-mono text-sm font-bold text-navy-900 dark:text-white">{value}</span>
    </div>
  );
}
