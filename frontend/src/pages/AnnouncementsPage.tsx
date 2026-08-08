import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Announcement {
  id: number;
  title_ar: string;
  title_en: string | null;
  body_ar: string;
  body_en: string | null;
  event_date: string | null;
  target_roles: string[] | null;
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'مدير فرع' },
  { value: 'teacher', label: 'معلم' },
  { value: 'staff', label: 'موظف' },
  { value: 'parent', label: 'ولي أمر' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'hr', label: 'موارد بشرية' },
];

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isStaff = user?.role !== 'parent';

  const announcements = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get<{ announcements: Announcement[] }>('/announcements')).data.announcements,
  });

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);

  const createAnnouncement = useMutation({
    mutationFn: () =>
      api.post('/announcements', {
        title_ar: titleAr,
        title_en: titleEn || null,
        body_ar: bodyAr,
        body_en: bodyEn || null,
        event_date: eventDate || null,
        target_roles: targetRoles.length ? targetRoles : null,
      }),
    onSuccess: () => {
      toast.success('تم نشر الإعلان');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitleAr('');
      setTitleEn('');
      setBodyAr('');
      setBodyEn('');
      setEventDate('');
      setTargetRoles([]);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء نشر الإعلان');
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: number) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الإعلان');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const canSubmit = titleAr && bodyAr;

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">📢 الإعلانات والأحداث</h2>

      {isStaff && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
          <h3 className="mb-3 font-bold text-navy-900 dark:text-white">نشر إعلان جديد</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            <input className={`${inputCls} w-56`} placeholder="العنوان (عربي)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
            <input className={`${inputCls} w-56`} placeholder="Title (English) — اختياري" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            <input className={inputCls} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} title="تاريخ الحدث (اختياري)" />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <textarea
              className={`${inputCls} w-full`}
              rows={2}
              placeholder="النص (عربي)"
              value={bodyAr}
              onChange={(e) => setBodyAr(e.target.value)}
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <textarea
              className={`${inputCls} w-full`}
              rows={2}
              placeholder="Body (English) — اختياري"
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">الفئة المستهدفة (اتركها فارغة للجميع)</p>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(r.value)}
                    onChange={(e) =>
                      setTargetRoles((roles) => (e.target.checked ? [...roles, r.value] : roles.filter((x) => x !== r.value)))
                    }
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          <button
            disabled={!canSubmit}
            onClick={() => createAnnouncement.mutate()}
            className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
          >
            نشر
          </button>
        </div>
      )}

      <div className="space-y-3">
        {announcements.data?.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد إعلانات حالياً</p>}
        {announcements.data?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-bold text-navy-900 dark:text-white">{a.title_ar}</h3>
              {isStaff && (
                <button onClick={() => deleteAnnouncement.mutate(a.id)} className="text-xs text-red-500">
                  حذف
                </button>
              )}
            </div>
            {a.event_date && <p className="mb-2 text-xs font-bold text-gold-600">📅 {a.event_date.slice(0, 10)}</p>}
            <p className="text-sm text-slate-600 dark:text-slate-300">{a.body_ar}</p>
            {a.title_en && <p className="mt-2 text-xs text-slate-400">{a.title_en}</p>}
            {a.body_en && <p className="text-xs text-slate-400">{a.body_en}</p>}
            {a.target_roles && a.target_roles.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                موجّه إلى: {a.target_roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r).join('، ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
