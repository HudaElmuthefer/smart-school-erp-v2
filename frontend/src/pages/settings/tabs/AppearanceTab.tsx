import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../../store/themeStore';
import { useSchoolBranding } from '../../../hooks/useSchoolBranding';
import { api } from '../../../lib/api';

export default function AppearanceTab() {
  const { mode, toggle: toggleTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { data: school } = useSchoolBranding();

  const [primary, setPrimary] = useState('#0F1A2B');
  const [gold, setGold] = useState('#C9942A');
  useEffect(() => {
    if (school?.primary_color) setPrimary(school.primary_color);
    if (school?.primary_color_dark) setGold(school.primary_color_dark);
  }, [school?.primary_color, school?.primary_color_dark]);

  const saveColors = useMutation({
    mutationFn: () => api.put('/school-settings', { primary_color: primary, primary_color_dark: gold }),
    onSuccess: () => {
      toast.success('تم تحديث الألوان بكل النظام');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: () => toast.error('تعذّر حفظ الألوان'),
  });

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">🎨 المظهر</h2>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <div>
          <p className="text-sm font-bold text-navy-900 dark:text-white">الوضع الداكن</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">يطبَّق على كامل النظام فوراً</p>
        </div>
        <button
          onClick={toggleTheme}
          className={`h-7 w-14 rounded-full transition-colors ${mode === 'dark' ? 'bg-gold-500' : 'bg-slate-300'}`}
        >
          <span
            className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
              mode === 'dark' ? 'translate-x-1' : 'translate-x-7'
            }`}
          />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <p className="mb-1 text-sm font-bold text-navy-900 dark:text-white">ألوان النظام</p>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          تُطبَّق فوراً على كل صفحة تستخدم اللون الكحلي والذهبي (القائمة الجانبية، الأزرار، الشارات...).
        </p>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-sm text-navy-900 dark:text-white">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10"
            />
            اللون الكحلي (الأساسي)
          </label>
          <label className="flex items-center gap-3 text-sm text-navy-900 dark:text-white">
            <input
              type="color"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10"
            />
            اللون الذهبي (المميّز)
          </label>
        </div>
        <button
          disabled={saveColors.isPending}
          onClick={() => saveColors.mutate()}
          className="mt-4 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          {saveColors.isPending ? 'جاري الحفظ...' : 'حفظ الألوان'}
        </button>
      </div>
    </div>
  );
}
