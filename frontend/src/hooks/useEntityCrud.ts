import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export function useEntityCrud<T extends { id: number }>(endpoint: string, listKey: string, params?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  const queryKey = [endpoint, params];

  const list = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/${endpoint}`, { params });
      const raw = res.data[listKey];
      return (Array.isArray(raw) ? raw : (raw?.data ?? [])) as T[];
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [endpoint] });
  }

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/${endpoint}`, payload),
    onSuccess: () => {
      toast.success('تمت الإضافة بنجاح');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء الإضافة');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      api.put(`/${endpoint}/${id}`, payload),
    onSuccess: () => {
      toast.success('تم التعديل بنجاح');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء التعديل');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/${endpoint}/${id}`),
    onSuccess: () => {
      toast.success('تم الحذف بنجاح');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء الحذف');
    },
  });

  return { list, create, update, remove };
}
