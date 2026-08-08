import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Teacher {
  id: number;
  specialization: string | null;
  user?: { full_name: string; email: string };
}

export default function TeachersPage() {
  const teachers = useEntityCrud<Teacher>('teachers', 'teachers');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

  const canSubmit = fullName && email && password.length >= 8;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap gap-2">
        <input className={`${inputCls} w-48`} placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className={`${inputCls} w-56`} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className={`${inputCls} w-40`}
          placeholder="كلمة المرور (8+ أحرف)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className={`${inputCls} w-40`}
          placeholder="التخصص"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />
        <button
          disabled={!canSubmit}
          onClick={() => {
            teachers.create.mutate({ full_name: fullName, email, password, specialization: specialization || null });
            setFullName('');
            setEmail('');
            setPassword('');
            setSpecialization('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة معلم
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">البريد الإلكتروني</th>
              <th className="p-3 text-start">التخصص</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {teachers.list.data?.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{t.user?.full_name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.user?.email}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.specialization ?? '—'}</td>
                <td className="p-3 text-end">
                  <button onClick={() => teachers.remove.mutate(t.id)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
