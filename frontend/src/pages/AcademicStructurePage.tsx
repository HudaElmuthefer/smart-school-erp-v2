import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface GradeLevel {
  id: number;
  name_ar: string;
  name_en: string;
  order: number;
}

interface Section {
  id: number;
  name_ar: string;
  name_en: string;
  grade_level_id: number;
  grade_level?: GradeLevel;
}

interface Subject {
  id: number;
  name_ar: string;
  name_en: string;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-navy-800">
      <h3 className="mb-3 font-bold text-navy-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function AcademicStructurePage() {
  const gradeLevels = useEntityCrud<GradeLevel>('grade-levels', 'grade_levels');
  const sections = useEntityCrud<Section>('sections', 'sections');
  const subjects = useEntityCrud<Subject>('subjects', 'subjects');

  const [gradeName, setGradeName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionGradeId, setSectionGradeId] = useState<number | ''>('');
  const [subjectName, setSubjectName] = useState('');

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white';
  const btnCls = 'mt-2 w-full rounded-xl bg-gold-500 py-2 text-sm font-bold text-navy-950 disabled:opacity-60';

  return (
    <AppLayout>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card title="🎓 المراحل الدراسية">
          <input className={inputCls} placeholder="اسم المرحلة" value={gradeName} onChange={(e) => setGradeName(e.target.value)} />
          <button
            className={btnCls}
            disabled={!gradeName}
            onClick={() => {
              gradeLevels.create.mutate({ name_ar: gradeName, name_en: gradeName, order: (gradeLevels.list.data?.length ?? 0) + 1 });
              setGradeName('');
            }}
          >
            + إضافة
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {gradeLevels.list.data?.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-navy-900">
                <span className="text-navy-900 dark:text-white">{g.name_ar}</span>
                <button onClick={() => gradeLevels.remove.mutate(g.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="🏫 الشعب">
          <select className={inputCls} value={sectionGradeId} onChange={(e) => setSectionGradeId(Number(e.target.value))}>
            <option value="">اختر المرحلة</option>
            {gradeLevels.list.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_ar}
              </option>
            ))}
          </select>
          <input
            className={`${inputCls} mt-2`}
            placeholder="اسم الشعبة"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
          />
          <button
            className={btnCls}
            disabled={!sectionName || !sectionGradeId}
            onClick={() => {
              sections.create.mutate({ name_ar: sectionName, name_en: sectionName, grade_level_id: sectionGradeId });
              setSectionName('');
            }}
          >
            + إضافة
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {sections.list.data?.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-navy-900">
                <span className="text-navy-900 dark:text-white">
                  {s.name_ar} <span className="text-xs text-slate-400">({s.grade_level?.name_ar})</span>
                </span>
                <button onClick={() => sections.remove.mutate(s.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="📖 المواد">
          <input className={inputCls} placeholder="اسم المادة" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <button
            className={btnCls}
            disabled={!subjectName}
            onClick={() => {
              subjects.create.mutate({ name_ar: subjectName, name_en: subjectName });
              setSubjectName('');
            }}
          >
            + إضافة
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {subjects.list.data?.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-navy-900">
                <span className="text-navy-900 dark:text-white">{s.name_ar}</span>
                <button onClick={() => subjects.remove.mutate(s.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
