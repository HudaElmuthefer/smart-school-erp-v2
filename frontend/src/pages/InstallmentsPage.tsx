import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Student {
  id: number;
  full_name: string;
}
interface FeePlanListItem {
  id: number;
  academic_year_label: string;
  total_amount: number;
  paid_amount: number;
  remaining: number;
  student?: Student;
}
interface InstallmentDetail {
  id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  remaining: number;
}
interface FeePlanDetail extends FeePlanListItem {
  installments: InstallmentDetail[];
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

export default function InstallmentsPage() {
  const queryClient = useQueryClient();
  const students = useEntityCrud<Student>('students', 'students', { per_page: 200 });

  const feePlans = useQuery({
    queryKey: ['fee-plans'],
    queryFn: async () => (await api.get<{ fee_plans: FeePlanListItem[] }>('/fee-plans')).data.fee_plans,
  });

  const [studentId, setStudentId] = useState<number | ''>('');
  const [yearLabel, setYearLabel] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState([{ due_date: '', amount: '' }]);

  const createPlan = useMutation({
    mutationFn: () =>
      api.post('/fee-plans', {
        student_id: studentId,
        academic_year_label: yearLabel,
        total_amount: Number(totalAmount),
        installments: installments.map((i) => ({ due_date: i.due_date, amount: Number(i.amount) })),
      }),
    onSuccess: () => {
      toast.success('تم إنشاء خطة الأقساط');
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      setStudentId('');
      setYearLabel('');
      setTotalAmount('');
      setInstallments([{ due_date: '', amount: '' }]);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إنشاء الخطة');
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => api.delete(`/fee-plans/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الخطة');
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
    },
  });

  const [detailFor, setDetailFor] = useState<number | null>(null);
  const detail = useQuery({
    enabled: !!detailFor,
    queryKey: ['fee-plan-detail', detailFor],
    queryFn: async () => (await api.get<{ fee_plan: FeePlanDetail }>(`/fee-plans/${detailFor}`)).data.fee_plan,
  });

  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({});
  const payInstallment = useMutation({
    mutationFn: ({ installmentId, amount }: { installmentId: number; amount: number }) =>
      api.post(`/installments/${installmentId}/payments`, { amount, paid_at: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة');
      queryClient.invalidateQueries({ queryKey: ['fee-plan-detail', detailFor] });
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء تسجيل الدفعة');
    },
  });

  const canSubmitPlan =
    studentId && yearLabel && totalAmount && installments.every((i) => i.due_date && i.amount);

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">🧾 خطط الأقساط</h2>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <h3 className="mb-3 font-bold text-navy-900 dark:text-white">إنشاء خطة أقساط جديدة</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <select className={inputCls} value={studentId} onChange={(e) => setStudentId(Number(e.target.value))}>
            <option value="">اختر الطالب</option>
            {students.list.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <input
            className={`${inputCls} w-40`}
            placeholder="العام الدراسي"
            value={yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
          />
          <input
            className={`${inputCls} w-40`}
            placeholder="إجمالي المبلغ"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {installments.map((inst, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 text-xs text-slate-400">#{idx + 1}</span>
              <input
                className={inputCls}
                type="date"
                value={inst.due_date}
                onChange={(e) =>
                  setInstallments((arr) => arr.map((x, i) => (i === idx ? { ...x, due_date: e.target.value } : x)))
                }
              />
              <input
                className={`${inputCls} w-32`}
                placeholder="المبلغ"
                type="number"
                value={inst.amount}
                onChange={(e) => setInstallments((arr) => arr.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)))}
              />
              <button
                onClick={() => setInstallments((arr) => arr.filter((_, i) => i !== idx))}
                disabled={installments.length === 1}
                className="text-xs text-red-500 disabled:opacity-40"
              >
                حذف
              </button>
            </div>
          ))}
          <button
            onClick={() => setInstallments((arr) => [...arr, { due_date: '', amount: '' }])}
            className="text-xs font-bold text-gold-600"
          >
            + إضافة قسط
          </button>
        </div>

        <button
          disabled={!canSubmitPlan}
          onClick={() => createPlan.mutate()}
          className="mt-4 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          حفظ الخطة
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الطالب</th>
              <th className="p-3 text-start">العام الدراسي</th>
              <th className="p-3 text-start">الإجمالي</th>
              <th className="p-3 text-start">المدفوع</th>
              <th className="p-3 text-start">المتبقي</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {feePlans.data?.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{p.student?.full_name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{p.academic_year_label}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{p.total_amount}</td>
                <td className="p-3 text-emerald-600">{p.paid_amount}</td>
                <td className={`p-3 font-bold ${p.remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{p.remaining}</td>
                <td className="p-3 text-end">
                  <button onClick={() => setDetailFor(p.id)} className="me-3 text-xs font-bold text-gold-600">
                    عرض الأقساط
                  </button>
                  <button onClick={() => deletePlan.mutate(p.id)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => setDetailFor(null)}>
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">
              أقساط: {detail.data?.student?.full_name} — {detail.data?.academic_year_label}
            </h3>
            <div className="space-y-2">
              {detail.data?.installments.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white">قسط #{inst.installment_number}</span>
                    <span className="ms-2 text-xs text-slate-500 dark:text-slate-400">استحقاق {inst.due_date.slice(0, 10)}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      المبلغ: {inst.amount} · المدفوع: {inst.paid_amount} · المتبقي:{' '}
                      <span className={inst.remaining > 0 ? 'font-bold text-red-500' : 'font-bold text-emerald-600'}>
                        {inst.remaining}
                      </span>
                    </div>
                  </div>
                  {inst.remaining > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        className={`${inputCls} w-24`}
                        placeholder="دفعة"
                        type="number"
                        value={payAmounts[inst.id] ?? ''}
                        onChange={(e) => setPayAmounts((a) => ({ ...a, [inst.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => payInstallment.mutate({ installmentId: inst.id, amount: Number(payAmounts[inst.id]) })}
                        disabled={!payAmounts[inst.id] || Number(payAmounts[inst.id]) <= 0}
                        className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-bold text-navy-950 disabled:opacity-60"
                      >
                        تسجيل الدفع
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
