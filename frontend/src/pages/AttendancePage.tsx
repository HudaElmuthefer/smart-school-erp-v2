import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Student {
  id: number;
  full_name: string;
}

interface Attendance {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  source: string;
  student?: Student;
}

const STATUS_LABEL: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'معذور' };
const STATUS_COLOR: Record<string, string> = {
  present: 'text-emerald-600',
  absent: 'text-red-500',
  late: 'text-amber-500',
  excused: 'text-slate-400',
};

export default function AttendancePage() {
  const students = useEntityCrud<Student>('students', 'students');
  const attendance = useEntityCrud<Attendance>('attendances', 'attendances');

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const inputCls =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

  const markAttendance = (studentId: number, status: string) => {
    attendance.create.mutate({ student_id: studentId, date, status });
  };

  const recordFor = (studentId: number) =>
    attendance.list.data?.find((a) => a.student?.id === studentId && a.date.startsWith(date));

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">التاريخ:</span>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الطالب</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">تسجيل</th>
            </tr>
          </thead>
          <tbody>
            {students.list.data?.map((s) => {
              const record = recordFor(s.id);
              return (
                <tr key={s.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="p-3 text-navy-900 dark:text-white">{s.full_name}</td>
                  <td className={`p-3 font-bold ${record ? STATUS_COLOR[record.status] : 'text-slate-300'}`}>
                    {record ? STATUS_LABEL[record.status] : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => markAttendance(s.id, status)}
                          className={`rounded-lg border px-2 py-1 text-xs ${
                            record?.status === status
                              ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                              : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                          }`}
                        >
                          {STATUS_LABEL[status]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
