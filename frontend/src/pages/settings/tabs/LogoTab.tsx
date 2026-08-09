import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface School {
  id: number;
  logo_url: string | null;
}

export default function LogoTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: School }>('/school-settings')).data.school,
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return api.post('/school-settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('تم تحديث الشعار');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: () => toast.error('تعذّر رفع الشعار'),
  });

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-navy-900 dark:text-white">🖼️ الشعار</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-white/10 dark:bg-navy-800">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20">
          {data?.logo_url ? (
            <img src={data.logo_url} alt="الشعار الحالي" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-slate-400">لا يوجد شعار</span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
        />
        <button
          disabled={upload.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          {upload.isPending ? 'جاري الرفع...' : 'رفع شعار جديد'}
        </button>
      </div>
    </div>
  );
}
