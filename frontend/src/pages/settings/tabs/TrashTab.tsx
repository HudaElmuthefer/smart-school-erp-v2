import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface TrashItem {
  type: string;
  type_label: string;
  id: number;
  name: string;
  deleted_at: string;
}

export default function TrashTab() {
  const queryClient = useQueryClient();

  const trash = useQuery({
    queryKey: ['trash'],
    queryFn: async () => (await api.get<{ trash: TrashItem[] }>('/trash')).data.trash,
  });

  const restore = useMutation({
    mutationFn: (item: TrashItem) => api.post(`/trash/${item.type}/${item.id}/restore`),
    onSuccess: () => {
      toast.success('تم الاسترجاع');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء الاسترجاع');
    },
  });

  const forceDelete = useMutation({
    mutationFn: (item: TrashItem) => api.delete(`/trash/${item.type}/${item.id}`),
    onSuccess: () => {
      toast.success('تم الحذف نهائياً');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء الحذف النهائي');
    },
  });

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-navy-900 dark:text-white">🗑️ سلة المحذوفات</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        السجلات المحذوفة من أي قسم بالنظام (حذف ناعم) — يمكن استرجاعها أو حذفها نهائياً بلا رجعة.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">النوع</th>
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">تاريخ الحذف</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {trash.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  سلة المحذوفات فارغة
                </td>
              </tr>
            )}
            {trash.data?.map((item) => (
              <tr key={`${item.type}-${item.id}`} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-slate-500 dark:text-slate-400">{item.type_label}</td>
                <td className="p-3 text-navy-900 dark:text-white">{item.name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{item.deleted_at?.slice(0, 10)}</td>
                <td className="p-3 text-end">
                  <button onClick={() => restore.mutate(item)} className="me-3 text-xs font-bold text-emerald-600">
                    استرجاع
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل تريد حذف "${item.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                        forceDelete.mutate(item);
                      }
                    }}
                    className="text-xs text-red-500"
                  >
                    حذف نهائي
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
