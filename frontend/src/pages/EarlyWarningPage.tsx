import { useQuery } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';

interface Flag {
  student_id: number;
  student_name: string;
  reasons: string[];
}

export default function EarlyWarningPage() {
  const flags = useQuery({
    queryKey: ['early-warning'],
    queryFn: async () => (await api.get<{ flags: Flag[] }>('/ai/early-warning')).data.flags,
  });

  return (
    <AppLayout>
      <h2 className="mb-2 text-lg font-bold text-navy-900 dark:text-white">⚠️ الإنذار المبكر</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        فحص إحصائي تلقائي يرصد الطلاب المعرّضين لخطر أكاديمي: معدل عام أقل من 60، غياب أعلى من 20% خلال آخر 30 يوماً، أو واجبات متأخرة غير مُسلَّمة.
      </p>

      {flags.isLoading && <p className="text-sm text-slate-400">جارٍ الفحص...</p>}
      {flags.data?.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-navy-800">
          <p className="text-emerald-600">✅ لا يوجد طلاب في وضع خطر حالياً</p>
        </div>
      )}

      <div className="space-y-3">
        {flags.data?.map((f) => (
          <div key={f.student_id} className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <h3 className="mb-2 font-bold text-navy-900 dark:text-white">{f.student_name}</h3>
            <ul className="list-disc space-y-1 ps-4 text-sm text-red-600 dark:text-red-400">
              {f.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
