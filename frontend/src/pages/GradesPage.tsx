import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Month {
  id: number;
  month_number: number;
}
interface Term {
  id: number;
  type: string;
  months: Month[];
}
interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
  terms: Term[];
}
interface Section {
  id: number;
  name_ar: string;
}
interface Subject {
  id: number;
  name_ar: string;
}
interface StudentRow {
  id: number;
  full_name: string;
}
interface ReportRow {
  student_id: number;
  student_name: string;
  first_term_average: number | null;
  second_term_average: number | null;
  mid_year_score: number | null;
  seai: number | null;
  final_exam_score: number | null;
  final_average: number | null;
}

export default function GradesPage() {
  const queryClient = useQueryClient();
  const sections = useEntityCrud<Section>('sections', 'sections');
  const subjects = useEntityCrud<Subject>('subjects', 'subjects');

  const years = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get<{ academic_years: AcademicYear[] }>('/academic-years')).data.academic_years,
  });

  const createYear = useMutation({
    mutationFn: () =>
      api.post('/academic-years', {
        name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        start_date: `${new Date().getFullYear()}-09-01`,
        end_date: `${new Date().getFullYear() + 1}-06-30`,
        is_current: true,
      }),
    onSuccess: () => {
      toast.success('تم إنشاء السنة الدراسية');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });

  const currentYear = years.data?.find((y) => y.is_current) ?? years.data?.[0];
  const firstTermMonths = currentYear?.terms.find((t) => t.type === 'first_term')?.months ?? [];

  const [sectionId, setSectionId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [monthId, setMonthId] = useState<number | ''>('');

  const sectionStudents = useQuery({
    enabled: !!sectionId,
    queryKey: ['students', 'by-section', sectionId],
    queryFn: async () =>
      (await api.get('/students', { params: { section_id: sectionId, per_page: 100 } })).data.students.data as StudentRow[],
  });

  const monthlyScores = useQuery({
    enabled: !!(sectionId && subjectId && monthId),
    queryKey: ['monthly-scores', sectionId, subjectId, monthId],
    queryFn: async () =>
      (
        await api.get('/monthly-scores', { params: { section_id: sectionId, subject_id: subjectId, academic_month_id: monthId } })
      ).data.scores as { student_id: number; daily_exam_score: number | null; monthly_exam_score: number | null; daily_preparation_score: number | null }[],
  });

  const upsertScore = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/monthly-scores', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-scores'] });
      queryClient.invalidateQueries({ queryKey: ['grade-report'] });
    },
  });

  const report = useQuery({
    enabled: !!(sectionId && subjectId && currentYear),
    queryKey: ['grade-report', sectionId, subjectId, currentYear?.id],
    queryFn: async () =>
      (
        await api.get<{ report: ReportRow[] }>('/grade-reports/section', {
          params: { section_id: sectionId, subject_id: subjectId, academic_year_id: currentYear?.id },
        })
      ).data.report,
  });

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';
  const numCls = 'w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white';

  if (!years.data) return <AppLayout><div /></AppLayout>;

  if (years.data.length === 0) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-navy-800">
          <p className="mb-4 text-navy-900 dark:text-white">لا توجد سنة دراسية بعد</p>
          <button onClick={() => createYear.mutate()} className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950">
            + إنشاء السنة الدراسية الحالية
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap gap-2">
        <select className={inputCls} value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))}>
          <option value="">اختر الشعبة</option>
          {sections.list.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name_ar}
            </option>
          ))}
        </select>
        <select className={inputCls} value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>
          <option value="">اختر المادة</option>
          {subjects.list.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name_ar}
            </option>
          ))}
        </select>
        <select className={inputCls} value={monthId} onChange={(e) => setMonthId(Number(e.target.value))}>
          <option value="">اختر الشهر (الفصل الأول)</option>
          {firstTermMonths.map((m) => (
            <option key={m.id} value={m.id}>
              الشهر {m.month_number}
            </option>
          ))}
        </select>
      </div>

      {sectionId && subjectId && monthId && (
        <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
          <h3 className="mb-3 font-bold text-navy-900 dark:text-white">📖 إدخال درجات الشهر</h3>
          <div className="mb-2 flex gap-3 text-xs text-slate-400">
            <span className="flex-1">الطالب</span>
            <span className="w-16 text-center">يومي</span>
            <span className="w-16 text-center">شهري</span>
            <span className="w-16 text-center">تحضير</span>
          </div>
          {sectionStudents.data?.map((student) => {
            const existing = monthlyScores.data?.find((s) => s.student_id === student.id);
            return (
              <div key={student.id} className="flex items-center gap-3 border-t border-slate-100 py-2 text-sm dark:border-white/5">
                <span className="flex-1 text-navy-900 dark:text-white">{student.full_name}</span>
              <input
                type="number"
                className={numCls}
                placeholder="يومي"
                defaultValue={existing?.daily_exam_score ?? ''}
                onBlur={(e) =>
                  upsertScore.mutate({
                    student_id: student.id,
                    subject_id: subjectId,
                    academic_month_id: monthId,
                    daily_exam_score: e.target.value || null,
                  })
                }
              />
              <input
                type="number"
                className={numCls}
                placeholder="شهري"
                defaultValue={existing?.monthly_exam_score ?? ''}
                onBlur={(e) =>
                  upsertScore.mutate({
                    student_id: student.id,
                    subject_id: subjectId,
                    academic_month_id: monthId,
                    monthly_exam_score: e.target.value || null,
                  })
                }
              />
              <input
                type="number"
                className={numCls}
                placeholder="تحضير"
                defaultValue={existing?.daily_preparation_score ?? ''}
                onBlur={(e) =>
                  upsertScore.mutate({
                    student_id: student.id,
                    subject_id: subjectId,
                    academic_month_id: monthId,
                    daily_preparation_score: e.target.value || null,
                  })
                }
              />
            </div>
            );
          })}
        </div>
      )}

      {sectionId && subjectId && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="p-3 text-start">الطالب</th>
                <th className="p-3 text-start">الفصل 1</th>
                <th className="p-3 text-start">الفصل 2</th>
                <th className="p-3 text-start">نصف السنة</th>
                <th className="p-3 text-start">السعي</th>
                <th className="p-3 text-start">النهائي</th>
                <th className="p-3 text-start">المعدل</th>
              </tr>
            </thead>
            <tbody>
              {report.data?.map((r) => (
                <tr key={r.student_id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="p-3 text-navy-900 dark:text-white">{r.student_name}</td>
                  <td className="p-3">{r.first_term_average ?? '—'}</td>
                  <td className="p-3">{r.second_term_average ?? '—'}</td>
                  <td className="p-3">{r.mid_year_score ?? '—'}</td>
                  <td className="p-3">{r.seai ?? '—'}</td>
                  <td className="p-3">{r.final_exam_score ?? '—'}</td>
                  <td className="p-3 font-bold text-gold-500">{r.final_average ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
