import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface School {
  id: number;
  passing_grade: number;
  extra_settings: Record<string, unknown> | null;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white';

export default function SystemSettingsTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });

  const [passingGrade, setPassingGrade] = useState('50');
  const [itemsPerPage, setItemsPerPage] = useState('20');
  const [timezone, setTimezone] = useState('Asia/Baghdad');

  useEffect(() => {
    if (!data) return;
    setPassingGrade(String(data.passing_grade ?? 50));
    setItemsPerPage(String(data.extra_settings?.items_per_page ?? 20));
    setTimezone(String(data.extra_settings?.timezone ?? 'Asia/Baghdad'));
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/school-settings', {
        passing_grade: Number(passingGrade),
        extra_settings: { items_per_page: Number(itemsPerPage), timezone },
      }),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات النظام');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: () => toast.error('تعذّر الحفظ'),
  });

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">⚙️ إعدادات النظام</h2>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">درجة النجاح الافتراضية</label>
          <input className={`${inputCls} mt-1`} type="number" value={passingGrade} onChange={(e) => setPassingGrade(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">عدد السجلات بكل صفحة</label>
          <input className={`${inputCls} mt-1`} type="number" value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">المنطقة الزمنية</label>
          <input className={`${inputCls} mt-1`} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>
        <button
          onClick={() => save.mutate()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
        >
          {save.isPending ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </div>
  );
}
