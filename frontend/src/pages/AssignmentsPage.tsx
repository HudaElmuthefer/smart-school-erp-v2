import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';
import { useAuthStore } from '../store/authStore';

interface Section {
  id: number;
  name_ar: string;
}
interface Subject {
  id: number;
  name_ar: string;
}
interface Submission {
  id: number;
  student_id: number;
  submission_text: string | null;
  submitted_at: string | null;
  score: number | null;
  teacher_feedback: string | null;
}
interface Assignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  subject?: Subject;
  section?: Section;
  my_submission?: Submission | null;
}
interface RosterRow {
  student_id: number;
  student_name: string;
  submission: Submission | null;
}

function ParentAssignments() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const assignments = useQuery({
    queryKey: ['assignments', 'parent'],
    queryFn: async () => (await api.get<{ assignments: Assignment[] }>('/assignments')).data.assignments,
  });

  const submit = useMutation({
    mutationFn: ({ assignmentId, text }: { assignmentId: number; text: string }) =>
      api.post(`/assignments/${assignmentId}/submissions`, { submission_text: text }),
    onSuccess: () => {
      toast.success('تم تسليم الواجب');
      queryClient.invalidateQueries({ queryKey: ['assignments', 'parent'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء التسليم');
    },
  });

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">📚 واجبات ابني</h2>
      <div className="space-y-4">
        {assignments.data?.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد واجبات حالياً</p>
        )}
        {assignments.data?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {a.subject?.name_ar} · تاريخ التسليم: {a.due_date.slice(0, 10)}
                </p>
              </div>
              {a.my_submission?.score != null ? (
                <span className="rounded-full bg-gold-500/20 px-3 py-1 text-sm font-bold text-gold-600">
                  الدرجة: {a.my_submission.score}
                </span>
              ) : a.my_submission?.submitted_at ? (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">تم التسليم</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-white/5">لم يُسلَّم بعد</span>
              )}
            </div>
            {a.description && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{a.description}</p>}

            {a.my_submission?.teacher_feedback && (
              <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-navy-900">
                <span className="font-bold text-navy-900 dark:text-white">ملاحظة المعلم: </span>
                <span className="text-slate-600 dark:text-slate-300">{a.my_submission.teacher_feedback}</span>
              </div>
            )}

            <textarea
              className="mb-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
              rows={3}
              placeholder="اكتب إجابة الواجب هنا..."
              defaultValue={a.my_submission?.submission_text ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
            />
            <button
              onClick={() => submit.mutate({ assignmentId: a.id, text: drafts[a.id] ?? a.my_submission?.submission_text ?? '' })}
              disabled={!(drafts[a.id] ?? a.my_submission?.submission_text)}
              className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
            >
              {a.my_submission?.submitted_at ? 'تحديث التسليم' : 'تسليم الواجب'}
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

function StaffAssignments() {
  const queryClient = useQueryClient();
  const sections = useEntityCrud<Section>('sections', 'sections');
  const subjects = useEntityCrud<Subject>('subjects', 'subjects');
  const assignments = useEntityCrud<Assignment>('assignments', 'assignments');

  const [sectionId, setSectionId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [rosterFor, setRosterFor] = useState<Assignment | null>(null);

  const roster = useQuery({
    enabled: !!rosterFor,
    queryKey: ['assignment-roster', rosterFor?.id],
    queryFn: async () => (await api.get<{ roster: RosterRow[] }>(`/assignments/${rosterFor?.id}/roster`)).data.roster,
  });

  const grade = useMutation({
    mutationFn: ({ submissionId, score, feedback }: { submissionId: number; score: number; feedback: string }) =>
      api.put(`/assignment-submissions/${submissionId}/grade`, { score, teacher_feedback: feedback || null }),
    onSuccess: () => {
      toast.success('تم حفظ التصحيح');
      queryClient.invalidateQueries({ queryKey: ['assignment-roster', rosterFor?.id] });
    },
  });

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

  const canSubmit = sectionId && subjectId && title && dueDate;

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
        <input className={`${inputCls} w-56`} placeholder="عنوان الواجب" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <input
          className={`${inputCls} w-64`}
          placeholder="وصف (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          disabled={!canSubmit}
          onClick={() => {
            assignments.create.mutate({
              section_id: sectionId,
              subject_id: subjectId,
              title,
              description: description || null,
              due_date: dueDate,
            });
            setTitle('');
            setDescription('');
            setDueDate('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة واجب
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">العنوان</th>
              <th className="p-3 text-start">المادة</th>
              <th className="p-3 text-start">الشعبة</th>
              <th className="p-3 text-start">تاريخ التسليم</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.list.data?.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{a.title}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{a.subject?.name_ar}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{a.section?.name_ar}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{a.due_date.slice(0, 10)}</td>
                <td className="p-3 text-end">
                  <button onClick={() => setRosterFor(a)} className="me-3 text-xs font-bold text-gold-600">
                    عرض التسليمات
                  </button>
                  <button onClick={() => assignments.remove.mutate(a.id)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rosterFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => setRosterFor(null)}>
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">تسليمات: {rosterFor.title}</h3>
            <div className="space-y-3">
              {roster.data?.map((row) => (
                <div key={row.student_id} className="rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-navy-900 dark:text-white">{row.student_name}</span>
                    <span className="text-xs text-slate-400">
                      {row.submission?.submitted_at ? 'تم التسليم' : 'لم يُسلَّم'}
                    </span>
                  </div>
                  {row.submission?.submission_text && (
                    <p className="mb-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600 dark:bg-navy-900 dark:text-slate-300">
                      {row.submission.submission_text}
                    </p>
                  )}
                  {row.submission && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className={`${inputCls} w-20`}
                        placeholder="الدرجة"
                        defaultValue={row.submission.score ?? ''}
                        id={`score-${row.submission.id}`}
                      />
                      <input
                        className={`${inputCls} flex-1`}
                        placeholder="ملاحظة"
                        defaultValue={row.submission.teacher_feedback ?? ''}
                        id={`feedback-${row.submission.id}`}
                      />
                      <button
                        onClick={() => {
                          const scoreEl = document.getElementById(`score-${row.submission!.id}`) as HTMLInputElement;
                          const feedbackEl = document.getElementById(`feedback-${row.submission!.id}`) as HTMLInputElement;
                          grade.mutate({ submissionId: row.submission!.id, score: Number(scoreEl.value), feedback: feedbackEl.value });
                        }}
                        className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-bold text-navy-950"
                      >
                        حفظ
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

export default function AssignmentsPage() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'parent' ? <ParentAssignments /> : <StaffAssignments />;
}
