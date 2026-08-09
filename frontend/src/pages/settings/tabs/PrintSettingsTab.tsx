import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface School {
  id: number;
  extra_settings: Record<string, unknown> | null;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white';

export default function PrintSettingsTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });

  const [paperSize, setPaperSize] = useState('A4');
  const [showLogo, setShowLogo] = useState(true);
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    if (!data) return;
    setPaperSize(String(data.extra_settings?.print_paper_size ?? 'A4'));
    setShowLogo(Boolean(data.extra_settings?.print_show_logo ?? true));
    setFooterText(String(data.extra_settings?.print_footer_text ?? ''));
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/school-settings', {
        extra_settings: { print_paper_size: paperSize, print_show_logo: showLogo, print_footer_text: footerText },
      }),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات الطباعة');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: () => toast.error('تعذّر الحفظ'),
  });

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">🖨️ إعدادات الطباعة</h2>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">حجم الورق</label>
          <select className={`${inputCls} mt-1`} value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
          إظهار الشعار عند الطباعة
        </label>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">نص تذييل صفحات الطباعة</label>
          <input className={`${inputCls} mt-1`} value={footerText} onChange={(e) => setFooterText(e.target.value)} />
        </div>
        <button onClick={() => save.mutate()} className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950">
          {save.isPending ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </div>
  );
}
