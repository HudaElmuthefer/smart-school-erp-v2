import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface School {
  id: number;
  name_ar: string;
  app_name_ar: string | null;
  login_tagline_ar: string | null;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white';

export default function SystemNameTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });

  const [form, setForm] = useState<School | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload: Partial<School>) => (await api.put('/school-settings', payload)).data,
    onSuccess: () => {
      toast.success('تم الحفظ');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: () => toast.error('تعذّر الحفظ'),
  });

  if (!form) return <div />;

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">🏷️ اسم النظام</h2>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-navy-800">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">اسم المدرسة</label>
          <input className={`${inputCls} mt-1`} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">اسم النظام</label>
          <input
            className={`${inputCls} mt-1`}
            value={form.app_name_ar ?? ''}
            onChange={(e) => setForm({ ...form, app_name_ar: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">شعار صفحة الدخول (نص)</label>
          <input
            className={`${inputCls} mt-1`}
            value={form.login_tagline_ar ?? ''}
            onChange={(e) => setForm({ ...form, login_tagline_ar: e.target.value })}
          />
        </div>

        <button
          onClick={() =>
            mutation.mutate({
              name_ar: form.name_ar,
              app_name_ar: form.app_name_ar,
              login_tagline_ar: form.login_tagline_ar,
            })
          }
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
        >
          {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </div>
  );
}
