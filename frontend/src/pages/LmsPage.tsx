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
interface Lesson {
  id: number;
  title: string;
  content: string | null;
  subject?: Subject;
  section?: Section;
}
interface QuizAttempt {
  id: number;
  score: number | null;
  submitted_at: string | null;
}
interface QuizListItem {
  id: number;
  title: string;
  questions_count: number;
  subject?: Subject;
  section?: Section;
  my_attempt?: QuizAttempt | null;
}
interface QuizQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_option?: number;
  points: number;
}
interface QuizDetail {
  id: number;
  title: string;
  questions: QuizQuestion[];
}
interface RosterRow {
  student_id: number;
  student_name: string;
  attempt: (QuizAttempt & { answers: Record<string, number> }) | null;
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

function ParentLms() {
  const queryClient = useQueryClient();
  const [takingQuizId, setTakingQuizId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const lessons = useQuery({
    queryKey: ['lessons', 'parent'],
    queryFn: async () => (await api.get<{ lessons: Lesson[] }>('/lessons')).data.lessons,
  });

  const quizzes = useQuery({
    queryKey: ['quizzes', 'parent'],
    queryFn: async () => (await api.get<{ quizzes: QuizListItem[] }>('/quizzes')).data.quizzes,
  });

  const quizDetail = useQuery({
    enabled: !!takingQuizId,
    queryKey: ['quiz-detail', takingQuizId],
    queryFn: async () => (await api.get<{ quiz: QuizDetail }>(`/quizzes/${takingQuizId}`)).data.quiz,
  });

  const submitAttempt = useMutation({
    mutationFn: () => api.post(`/quizzes/${takingQuizId}/attempts`, { answers }),
    onSuccess: () => {
      toast.success('تم تصحيح الاختبار تلقائياً');
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'parent'] });
      setTakingQuizId(null);
      setAnswers({});
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إرسال الاختبار');
    },
  });

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">📖 الدروس</h2>
      <div className="mb-8 space-y-3">
        {lessons.data?.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد دروس بعد</p>}
        {lessons.data?.map((l) => (
          <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <h3 className="font-bold text-navy-900 dark:text-white">{l.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{l.subject?.name_ar}</p>
            {l.content && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{l.content}</p>}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">📝 الاختبارات</h2>
      <div className="space-y-3">
        {quizzes.data?.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد اختبارات بعد</p>}
        {quizzes.data?.map((q) => (
          <div key={q.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <div>
              <h3 className="font-bold text-navy-900 dark:text-white">{q.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {q.subject?.name_ar} · {q.questions_count} سؤال
              </p>
            </div>
            {q.my_attempt ? (
              <span className="rounded-full bg-gold-500/20 px-3 py-1 text-sm font-bold text-gold-600">
                النتيجة: {q.my_attempt.score}%
              </span>
            ) : (
              <button
                onClick={() => {
                  setTakingQuizId(q.id);
                  setAnswers({});
                }}
                className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950"
              >
                ابدأ الاختبار
              </button>
            )}
          </div>
        ))}
      </div>

      {takingQuizId && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800">
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">{quizDetail.data?.title}</h3>
            <div className="space-y-4">
              {quizDetail.data?.questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <p className="mb-2 text-sm font-bold text-navy-900 dark:text-white">
                    {idx + 1}. {q.question_text}
                  </p>
                  <div className="space-y-1">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === optIdx}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: optIdx }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setTakingQuizId(null);
                  setAnswers({});
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
              >
                إلغاء
              </button>
              <button
                disabled={!quizDetail.data || Object.keys(answers).length !== quizDetail.data.questions.length}
                onClick={() => submitAttempt.mutate()}
                className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
              >
                إرسال الإجابات
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StaffLms() {
  const queryClient = useQueryClient();
  const sections = useEntityCrud<Section>('sections', 'sections');
  const subjects = useEntityCrud<Subject>('subjects', 'subjects');
  const lessons = useEntityCrud<Lesson>('lessons', 'lessons');

  const [tab, setTab] = useState<'lessons' | 'quizzes'>('lessons');

  const [sectionId, setSectionId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const quizzes = useQuery({
    queryKey: ['quizzes', 'staff'],
    queryFn: async () => (await api.get<{ quizzes: QuizListItem[] }>('/quizzes')).data.quizzes,
  });

  const [quizTitle, setQuizTitle] = useState('');
  const [quizSectionId, setQuizSectionId] = useState<number | ''>('');
  const [quizSubjectId, setQuizSubjectId] = useState<number | ''>('');
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', ''], correct_option: 0, points: 1 }]);
  const [rosterFor, setRosterFor] = useState<QuizListItem | null>(null);

  const createQuiz = useMutation({
    mutationFn: () =>
      api.post('/quizzes', {
        title: quizTitle,
        section_id: quizSectionId,
        subject_id: quizSubjectId,
        questions,
      }),
    onSuccess: () => {
      toast.success('تم إنشاء الاختبار');
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'staff'] });
      setQuizTitle('');
      setQuizSectionId('');
      setQuizSubjectId('');
      setQuestions([{ question_text: '', options: ['', ''], correct_option: 0, points: 1 }]);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إنشاء الاختبار');
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: (id: number) => api.delete(`/quizzes/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الاختبار');
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'staff'] });
    },
  });

  const roster = useQuery({
    enabled: !!rosterFor,
    queryKey: ['quiz-roster', rosterFor?.id],
    queryFn: async () => (await api.get<{ roster: RosterRow[]; max_score: number }>(`/quizzes/${rosterFor?.id}/roster`)).data,
  });

  const canSubmitLesson = sectionId && subjectId && title;
  const canSubmitQuiz =
    quizTitle &&
    quizSectionId &&
    quizSubjectId &&
    questions.every((q) => q.question_text && q.options.every((o) => o) && q.options.length >= 2);

  return (
    <AppLayout>
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('lessons')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'lessons' ? 'bg-gold-500 text-navy-950' : 'bg-white text-slate-500 dark:bg-navy-800 dark:text-slate-300'}`}
        >
          📖 الدروس
        </button>
        <button
          onClick={() => setTab('quizzes')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'quizzes' ? 'bg-gold-500 text-navy-950' : 'bg-white text-slate-500 dark:bg-navy-800 dark:text-slate-300'}`}
        >
          📝 الاختبارات
        </button>
      </div>

      {tab === 'lessons' && (
        <>
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
            <input className={`${inputCls} w-56`} placeholder="عنوان الدرس" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input
              className={`${inputCls} w-64`}
              placeholder="محتوى الدرس (اختياري)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              disabled={!canSubmitLesson}
              onClick={() => {
                lessons.create.mutate({ section_id: sectionId, subject_id: subjectId, title, content: content || null });
                setTitle('');
                setContent('');
              }}
              className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
            >
              + إضافة درس
            </button>
          </div>

          <div className="space-y-3">
            {lessons.list.data?.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white">{l.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {l.subject?.name_ar} · {l.section?.name_ar}
                  </p>
                </div>
                <button onClick={() => lessons.remove.mutate(l.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'quizzes' && (
        <>
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <h3 className="mb-3 font-bold text-navy-900 dark:text-white">إنشاء اختبار جديد</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <select className={inputCls} value={quizSectionId} onChange={(e) => setQuizSectionId(Number(e.target.value))}>
                <option value="">اختر الشعبة</option>
                {sections.list.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
              <select className={inputCls} value={quizSubjectId} onChange={(e) => setQuizSubjectId(Number(e.target.value))}>
                <option value="">اختر المادة</option>
                {subjects.list.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
              <input className={`${inputCls} w-56`} placeholder="عنوان الاختبار" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
            </div>

            <div className="space-y-3">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <div className="mb-2 flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder={`نص السؤال ${qIdx + 1}`}
                      value={q.question_text}
                      onChange={(e) =>
                        setQuestions((qs) => qs.map((x, i) => (i === qIdx ? { ...x, question_text: e.target.value } : x)))
                      }
                    />
                    <button
                      onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIdx))}
                      disabled={questions.length === 1}
                      className="text-xs text-red-500 disabled:opacity-40"
                    >
                      حذف السؤال
                    </button>
                  </div>
                  <div className="space-y-1">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={q.correct_option === optIdx}
                          onChange={() =>
                            setQuestions((qs) => qs.map((x, i) => (i === qIdx ? { ...x, correct_option: optIdx } : x)))
                          }
                        />
                        <input
                          className={`${inputCls} flex-1`}
                          placeholder={`خيار ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) =>
                            setQuestions((qs) =>
                              qs.map((x, i) =>
                                i === qIdx ? { ...x, options: x.options.map((o, oi) => (oi === optIdx ? e.target.value : o)) } : x,
                              ),
                            )
                          }
                        />
                        <button
                          onClick={() =>
                            setQuestions((qs) =>
                              qs.map((x, i) => (i === qIdx ? { ...x, options: x.options.filter((_, oi) => oi !== optIdx) } : x)),
                            )
                          }
                          disabled={q.options.length <= 2}
                          className="text-xs text-red-500 disabled:opacity-40"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setQuestions((qs) => qs.map((x, i) => (i === qIdx ? { ...x, options: [...x.options, ''] } : x)))
                      }
                      className="text-xs font-bold text-gold-600"
                    >
                      + إضافة خيار
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  setQuestions((qs) => [...qs, { question_text: '', options: ['', ''], correct_option: 0, points: 1 }])
                }
                className="text-sm font-bold text-gold-600"
              >
                + إضافة سؤال جديد
              </button>
            </div>

            <button
              disabled={!canSubmitQuiz}
              onClick={() => createQuiz.mutate()}
              className="mt-4 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
            >
              حفظ الاختبار
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="p-3 text-start">العنوان</th>
                  <th className="p-3 text-start">المادة</th>
                  <th className="p-3 text-start">الشعبة</th>
                  <th className="p-3 text-start">عدد الأسئلة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {quizzes.data?.map((q) => (
                  <tr key={q.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="p-3 text-navy-900 dark:text-white">{q.title}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{q.subject?.name_ar}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{q.section?.name_ar}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{q.questions_count}</td>
                    <td className="p-3 text-end">
                      <button onClick={() => setRosterFor(q)} className="me-3 text-xs font-bold text-gold-600">
                        عرض النتائج
                      </button>
                      <button onClick={() => deleteQuiz.mutate(q.id)} className="text-xs text-red-500">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rosterFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => setRosterFor(null)}>
          <div
            className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">نتائج: {rosterFor.title}</h3>
            <div className="space-y-2">
              {roster.data?.roster.map((row) => (
                <div key={row.student_id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5">
                  <span className="text-navy-900 dark:text-white">{row.student_name}</span>
                  {row.attempt ? (
                    <span className="font-bold text-gold-600">{row.attempt.score}%</span>
                  ) : (
                    <span className="text-xs text-slate-400">لم يُخض الاختبار بعد</span>
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

export default function LmsPage() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'parent' ? <ParentLms /> : <StaffLms />;
}
