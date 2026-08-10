import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface Backup {
  disk: string;
  path: string;
  size: number;
  date: string;
  has_db: boolean;
  has_files: boolean;
}

type ConfirmAction = { kind: 'restore-db' | 'restore-files'; backup: Backup } | null;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

export default function BackupTab() {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const backups = useQuery({
    queryKey: ['backups'],
    queryFn: async () => (await api.get<{ backups: Backup[] }>('/backups')).data.backups,
  });

  const runBackup = useMutation({
    mutationFn: (type: 'db' | 'full') => api.post('/backups', { type }),
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

  const restoreDatabase = useMutation({
    mutationFn: (b: Backup) => api.post('/backups/restore-database', { disk: b.disk, path: b.path }),
    onSuccess: () => {
      toast.success('تم استرجاع قاعدة البيانات بنجاح');
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'تعذّر استرجاع قاعدة البيانات');
    },
  });

  const restoreFiles = useMutation({
    mutationFn: (b: Backup) => api.post('/backups/restore-files', { disk: b.disk, path: b.path }),
    onSuccess: (res) => {
      toast.success((res.data as { message?: string })?.message || 'تم استرجاع كود الخادم');
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'تعذّر استرجاع كود الخادم');
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

  const isRestoring = restoreDatabase.isPending || restoreFiles.isPending;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">🗄️ النسخ الاحتياطي</h2>
        <div className="flex gap-2">
          <button
            disabled={runBackup.isPending}
            onClick={() => runBackup.mutate('db')}
            className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
          >
            {runBackup.isPending ? 'جارٍ الإنشاء...' : '+ نسخة قاعدة البيانات'}
          </button>
          <button
            disabled={runBackup.isPending}
            onClick={() => runBackup.mutate('full')}
            className="rounded-xl border border-gold-500 px-5 py-2 text-sm font-bold text-gold-600 disabled:opacity-60"
          >
            {runBackup.isPending ? 'جارٍ الإنشاء...' : '+ نسخة كاملة (كود + قاعدة بيانات)'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الملف</th>
              <th className="p-3 text-start">المحتوى</th>
              <th className="p-3 text-start">الحجم</th>
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {backups.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  لا توجد نسخ احتياطية بعد
                </td>
              </tr>
            )}
            {backups.data?.map((b) => (
              <tr key={b.path} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{b.path.split('/').pop()}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  {b.has_db && (
                    <span className="me-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      قاعدة بيانات
                    </span>
                  )}
                  {b.has_files && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      كود
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{formatSize(b.size)}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{b.date}</td>
                <td className="p-3 text-end whitespace-nowrap">
                  {b.has_db && (
                    <button
                      onClick={() => setConfirmAction({ kind: 'restore-db', backup: b })}
                      className="me-3 text-xs font-bold text-blue-600"
                    >
                      استرجاع قاعدة البيانات
                    </button>
                  )}
                  {b.has_files && (
                    <button
                      onClick={() => setConfirmAction({ kind: 'restore-files', backup: b })}
                      className="me-3 text-xs font-bold text-emerald-600"
                    >
                      استرجاع الكود
                    </button>
                  )}
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

      {confirmAction && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => !isRestoring && setConfirmAction(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-bold text-navy-900 dark:text-white">
              {confirmAction.kind === 'restore-db' ? 'استرجاع قاعدة البيانات' : 'استرجاع كود الخادم'}
            </h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              {confirmAction.kind === 'restore-db'
                ? 'سيتم استبدال قاعدة البيانات الحالية بالكامل بمحتوى هذه النسخة. لا يمكن التراجع عن هذا الإجراء.'
                : 'سيتم استبدال ملفات كود الخادم الحالية بمحتوى هذه النسخة (باستثناء .env). لا يمكن التراجع عن هذا الإجراء.'}
            </p>
            <div className="flex gap-2">
              <button
                disabled={isRestoring}
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
              >
                إلغاء
              </button>
              <button
                disabled={isRestoring}
                onClick={() =>
                  confirmAction.kind === 'restore-db'
                    ? restoreDatabase.mutate(confirmAction.backup)
                    : restoreFiles.mutate(confirmAction.backup)
                }
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isRestoring ? 'جارٍ الاسترجاع...' : 'تأكيد الاسترجاع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
