import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface School {
  id: number;
  name_ar: string;
  school_type: string;
  is_active: boolean;
}

export default function BranchesTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await api.get<{ schools: School[] }>('/schools')).data.schools,
  });

  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/schools', { name_ar: name, school_type: 'private' })).data,
    onSuccess: () => {
      toast.success('تمت إضافة الفرع');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: () => toast.error('تعذّر إنشاء الفرع (متاح للمدير العام فقط)'),
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-navy-900 dark:text-white">🏫 الفروع</h2>

      <div className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الفرع الجديد"
          className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white"
        />
        <button
          disabled={!name || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة فرع
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">النوع</th>
              <th className="p-3 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((school) => (
              <tr key={school.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-navy-900 dark:text-white">{school.name_ar}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{school.school_type}</td>
                <td className="p-3">{school.is_active ? 'مفعّل' : 'معطّل'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
