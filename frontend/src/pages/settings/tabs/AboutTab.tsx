import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

interface School {
  app_name_ar: string | null;
  name_ar: string;
}
interface SystemInfo {
  app_version: string | null;
  laravel_version: string;
  php_version: string;
}

export default function AboutTab() {
  const school = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });
  const info = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => (await api.get<SystemInfo>('/system-info')).data,
  });

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">ℹ️ حول النظام</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-navy-800">
        <h3 className="text-xl font-bold text-navy-900 dark:text-white">{school.data?.app_name_ar ?? 'نظام المدرسة الذكي'}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{school.data?.name_ar}</p>

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-white/5">
          <p className="text-slate-600 dark:text-slate-300">
            نظام إدارة مدرسي متكامل: الطلاب، المعلمون، الحضور، الدرجات، الواجبات، الدروس والاختبارات، الموارد البشرية،
            المالية، الأقساط، المخزون، الإعلانات، الرسائل، تصدير/استيراد Excel، النسخ الاحتياطي، ووكلاء ذكاء اصطناعي
            عبر Gemini.
          </p>
          <p className="text-xs text-slate-400">
            مبني على Laravel {info.data?.laravel_version} و PHP {info.data?.php_version} و React + TypeScript + Tailwind.
          </p>
        </div>
      </div>
    </div>
  );
}
