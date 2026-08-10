import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Section {
  id: number;
  name_ar: string;
}

interface Student {
  id: number;
  full_name: string;
  national_id: string | null;
  section_id: number;
  section?: { name_ar: string; grade_level?: { name_ar: string } };
}

export default function StudentsPage() {
  const sections = useEntityCrud<Section>('sections', 'sections');
  const students = useEntityCrud<Student>('students', 'students');
  const [guardianFor, setGuardianFor] = useState<Student | null>(null);
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPassword, setGuardianPassword] = useState('');

  const createGuardian = useMutation({
    mutationFn: (payload: { full_name: string; email: string; password: string }) =>
      api.post(`/students/${guardianFor?.id}/guardian-account`, payload),
    onSuccess: () => {
      toast.success('تم إنشاء حساب ولي الأمر');
      setGuardianFor(null);
      setGuardianName('');
      setGuardianEmail('');
      setGuardianPassword('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إنشاء الحساب');
    },
  });

  const [fullName, setFullName] = useState('');
  const [sectionId, setSectionId] = useState<number | ''>('');

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap gap-2">
        <input className={`${inputCls} w-56`} placeholder="اسم الطالب" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <select className={inputCls} value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))}>
          <option value="">اختر الشعبة</option>
          {sections.list.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name_ar}
            </option>
          ))}
        </select>
        <button
          disabled={!fullName || !sectionId}
          onClick={() => {
            students.create.mutate({ full_name: fullName, section_id: sectionId });
            setFullName('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة طالب
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">الشعبة</th>
              <th className="p-3 text-start">المرحلة</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.list.data?.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{s.full_name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.section?.name_ar}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.section?.grade_level?.name_ar}</td>
                <td className="p-3 text-end">
                  <button onClick={() => setGuardianFor(s)} className="me-3 text-xs font-bold text-gold-600">
                    حساب ولي أمر
                  </button>
                  <button onClick={() => students.remove.mutate(s.id)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guardianFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => setGuardianFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">حساب ولي أمر — {guardianFor.full_name}</h3>
            <div className="space-y-3">
              <input
                className={`${inputCls} w-full`}
                placeholder="اسم ولي الأمر"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
              <input
                className={`${inputCls} w-full`}
                placeholder="البريد الإلكتروني"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
              <input
                className={`${inputCls} w-full`}
                placeholder="كلمة المرور (8+ أحرف)"
                type="password"
                value={guardianPassword}
                onChange={(e) => setGuardianPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setGuardianFor(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  disabled={!guardianName || !guardianEmail || guardianPassword.length < 8}
                  onClick={() => createGuardian.mutate({ full_name: guardianName, email: guardianEmail, password: guardianPassword })}
                  className="flex-1 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
                >
                  إنشاء الحساب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
