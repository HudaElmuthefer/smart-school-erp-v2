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

type BackupType = 'db' | 'files';
type ConfirmAction = { type: BackupType; backup: Backup } | null;

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
    mutationFn: (type: BackupType) => api.post('/backups', { type }),
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
  const dbBackups = backups.data?.filter((b) => b.has_db) ?? [];
  const fileBackups = backups.data?.filter((b) => b.has_files) ?? [];

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">🗄️ النسخ الاحتياطي</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <BackupSection
          icon="🧬"
          title="قاعدة البيانات"
          createLabel="+ إنشاء نسخة قاعدة بيانات"
          isCreating={runBackup.isPending}
          onCreate={() => runBackup.mutate('db')}
          backups={dbBackups}
          restoreLabel="استرجاع"
          onRestore={(b) => setConfirmAction({ type: 'db', backup: b })}
          onDownload={download}
          onDelete={(b) => deleteBackup.mutate(b)}
        />
        <BackupSection
          icon="💾"
          title="كود الخادم"
          createLabel="+ إنشاء نسخة كود"
          isCreating={runBackup.isPending}
          onCreate={() => runBackup.mutate('files')}
          backups={fileBackups}
          restoreLabel="استرجاع"
          onRestore={(b) => setConfirmAction({ type: 'files', backup: b })}
          onDownload={download}
          onDelete={(b) => deleteBackup.mutate(b)}
        />
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => !isRestoring && setConfirmAction(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-bold text-navy-900 dark:text-white">
              {confirmAction.type === 'db' ? 'استرجاع قاعدة البيانات' : 'استرجاع كود الخادم'}
            </h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              {confirmAction.type === 'db'
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
                  confirmAction.type === 'db'
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

function BackupSection({
  icon,
  title,
  createLabel,
  isCreating,
  onCreate,
  backups,
  restoreLabel,
  onRestore,
  onDownload,
  onDelete,
}: {
  icon: string;
  title: string;
  createLabel: string;
  isCreating: boolean;
  onCreate: () => void;
  backups: Backup[];
  restoreLabel: string;
  onRestore: (b: Backup) => void;
  onDownload: (b: Backup) => void;
  onDelete: (b: Backup) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-bold text-navy-900 dark:text-white">
          {icon} {title}
        </h3>
        <button
          disabled={isCreating}
          onClick={onCreate}
          className="rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-navy-950 disabled:opacity-60"
        >
          {isCreating ? 'جارٍ الإنشاء...' : createLabel}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-2 text-start">الملف</th>
              <th className="p-2 text-start">الحجم</th>
              <th className="p-2 text-start">التاريخ</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  لا توجد نسخ بعد
                </td>
              </tr>
            )}
            {backups.map((b) => (
              <tr key={b.path} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-2 text-navy-900 dark:text-white">{b.path.split('/').pop()}</td>
                <td className="p-2 text-slate-500 dark:text-slate-400">{formatSize(b.size)}</td>
                <td className="p-2 text-slate-500 dark:text-slate-400">{b.date}</td>
                <td className="p-2 text-end whitespace-nowrap">
                  <button onClick={() => onRestore(b)} className="me-2 font-bold text-blue-600">
                    {restoreLabel}
                  </button>
                  <button onClick={() => onDownload(b)} className="me-2 font-bold text-gold-600">
                    تنزيل
                  </button>
                  <button onClick={() => onDelete(b)} className="text-red-500">
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
