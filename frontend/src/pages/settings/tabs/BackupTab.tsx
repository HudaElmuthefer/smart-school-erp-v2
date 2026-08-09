import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface Backup {
  disk: string;
  path: string;
  size: number;
  date: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

export default function BackupTab() {
  const queryClient = useQueryClient();

  const backups = useQuery({
    queryKey: ['backups'],
    queryFn: async () => (await api.get<{ backups: Backup[] }>('/backups')).data.backups,
  });

  const runBackup = useMutation({
    mutationFn: () => api.post('/backups'),
    onSuccess: () => {
      toast.success('تم إنشاء نسخة احتياطية جديدة');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    },
  });

  const deleteBackup = useMutation({
    mutationFn: (b: Backup) => api.delete('/backups', { data: { disk: b.disk, path: b.path } }),
    onSuccess: () => {
      toast.success('تم حذف النسخة الاحتياطية');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  const download = async (b: Backup) => {
    const res = await api.get('/backups/download', { params: { disk: b.disk, path: b.path }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = b.path.split('/').pop() ?? 'backup.zip';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">🗄️ النسخ الاحتياطي</h2>
        <button
          disabled={runBackup.isPending}
          onClick={() => runBackup.mutate()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          {runBackup.isPending ? 'جارٍ الإنشاء...' : '+ إنشاء نسخة احتياطية الآن'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الملف</th>
              <th className="p-3 text-start">الحجم</th>
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {backups.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  لا توجد نسخ احتياطية بعد
                </td>
              </tr>
            )}
            {backups.data?.map((b) => (
              <tr key={b.path} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{b.path.split('/').pop()}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{formatSize(b.size)}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{b.date}</td>
                <td className="p-3 text-end">
                  <button onClick={() => download(b)} className="me-3 text-xs font-bold text-gold-600">
                    تنزيل
                  </button>
                  <button onClick={() => deleteBackup.mutate(b)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
