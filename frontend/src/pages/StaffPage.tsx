import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface StaffMember {
  id: number;
  department: string | null;
  job_title: string | null;
  salary: number | null;
  user?: { full_name: string; email: string };
}

export default function StaffPage() {
  const staff = useEntityCrud<StaffMember>('staff', 'staff');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salary, setSalary] = useState('');

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
        <input className={`${inputCls} w-36`} placeholder="القسم" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <input className={`${inputCls} w-36`} placeholder="المسمى الوظيفي" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        <input
          className={`${inputCls} w-28`}
          placeholder="الراتب"
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
        <button
          disabled={!canSubmit}
          onClick={() => {
            staff.create.mutate({
              full_name: fullName,
              email,
              password,
              department: department || null,
              job_title: jobTitle || null,
              salary: salary ? Number(salary) : null,
            });
            setFullName('');
            setEmail('');
            setPassword('');
            setDepartment('');
            setJobTitle('');
            setSalary('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة موظف
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">البريد الإلكتروني</th>
              <th className="p-3 text-start">القسم</th>
              <th className="p-3 text-start">المسمى الوظيفي</th>
              <th className="p-3 text-start">الراتب</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {staff.list.data?.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{s.user?.full_name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.user?.email}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.department ?? '—'}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.job_title ?? '—'}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{s.salary ?? '—'}</td>
                <td className="p-3 text-end">
                  <button onClick={() => staff.remove.mutate(s.id)} className="text-xs text-red-500">
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
