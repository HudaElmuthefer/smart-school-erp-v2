import { useQuery } from '@tanstack/react-query';
import { User, Mail, Phone } from 'lucide-react';
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

const DEVELOPER_INFO = [
  { icon: User, label: 'الاسم', value: 'المهندسة هدى المذيفر' },
  { icon: Mail, label: 'البريد الإلكتروني', value: 'elmutheferh@gmail.com' },
  { icon: Phone, label: 'الهاتف', value: '+964 771 409 7770' },
];

export default function AboutTab() {
  const school = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });
  const info = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => (await api.get<SystemInfo>('/system-info')).data,
  });

  const appName = school.data?.app_name_ar ?? 'نظام المدرسة الذكي';

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">ℹ️ حول النظام</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-navy-800">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy-800 to-navy-950 text-4xl">
          🏫
        </div>
        <h3 className="text-xl font-bold text-navy-900 dark:text-white">{appName}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{school.data?.name_ar}</p>
        <span className="mt-3 inline-block rounded-full bg-gold-500/15 px-4 py-1 text-xs font-bold text-gold-600">
          الإصدار {info.data?.app_version ?? '—'}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-navy-800">
        <h4 className="mb-3 text-sm font-bold text-slate-500 dark:text-slate-400">👩‍💻 معلومات المطور</h4>
        <div className="space-y-2">
          {DEVELOPER_INFO.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-navy-900"
            >
              <Icon size={18} className="shrink-0 text-gold-600" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                <div className="mt-0.5 text-sm font-bold text-navy-900 dark:text-white">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 pt-4 text-sm dark:border-white/5">
        <p className="text-slate-600 dark:text-slate-300">
          نظام إدارة مدرسي متكامل: الطلاب، المعلمون، الحضور، الدرجات، الواجبات، الدروس والاختبارات، الموارد البشرية،
          المالية، الأقساط، المخزون، الإعلانات، الرسائل، تصدير/استيراد Excel، النسخ الاحتياطي، ووكلاء ذكاء اصطناعي عبر
          Gemini.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          مبني على Laravel {info.data?.laravel_version} و PHP {info.data?.php_version} و React + TypeScript + Tailwind.
        </p>
      </div>
    </div>
  );
}
