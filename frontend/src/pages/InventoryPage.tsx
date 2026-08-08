import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Item {
  id: number;
  name: string;
  unit: string;
  reorder_level: number | null;
  quantity_on_hand: number;
}
interface StockMovement {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  note: string | null;
  movement_date: string;
  item?: { name: string; unit: string };
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const items = useEntityCrud<Item>('items', 'items');

  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');

  const [filterItemId, setFilterItemId] = useState<number | ''>('');
  const [mvItemId, setMvItemId] = useState<number | ''>('');
  const [mvType, setMvType] = useState<'in' | 'out'>('in');
  const [mvQuantity, setMvQuantity] = useState('');
  const [mvNote, setMvNote] = useState('');
  const [mvDate, setMvDate] = useState('');

  const movements = useQuery({
    queryKey: ['stock-movements', filterItemId],
    queryFn: async () =>
      (
        await api.get<{ stock_movements: StockMovement[] }>('/stock-movements', {
          params: filterItemId ? { item_id: filterItemId } : {},
        })
      ).data.stock_movements,
  });

  const createMovement = useMutation({
    mutationFn: () =>
      api.post('/stock-movements', {
        item_id: mvItemId,
        type: mvType,
        quantity: Number(mvQuantity),
        note: mvNote || null,
        movement_date: mvDate,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل الحركة');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setMvQuantity('');
      setMvNote('');
      setMvDate('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء تسجيل الحركة');
    },
  });

  const deleteMovement = useMutation({
    mutationFn: (id: number) => api.delete(`/stock-movements/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الحركة');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const canSubmitMovement = mvItemId && mvQuantity && Number(mvQuantity) > 0 && mvDate;

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">📦 الأصناف</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputCls} w-48`} placeholder="اسم الصنف" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        <input className={`${inputCls} w-32`} placeholder="الوحدة" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} />
        <input
          className={`${inputCls} w-40`}
          placeholder="حد إعادة الطلب"
          type="number"
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value)}
        />
        <button
          disabled={!itemName}
          onClick={() => {
            items.create.mutate({ name: itemName, unit: itemUnit || 'قطعة', reorder_level: reorderLevel ? Number(reorderLevel) : null });
            setItemName('');
            setItemUnit('');
            setReorderLevel('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة صنف
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.list.data?.map((it) => {
          const low = it.reorder_level != null && it.quantity_on_hand <= it.reorder_level;
          return (
            <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy-900 dark:text-white">{it.name}</h3>
                <button onClick={() => items.remove.mutate(it.id)} className="text-xs text-red-500">
                  حذف
                </button>
              </div>
              <p className={`mt-2 text-xl font-bold ${low ? 'text-red-500' : 'text-gold-600'}`}>
                {it.quantity_on_hand} <span className="text-sm font-normal text-slate-400">{it.unit}</span>
              </p>
              {low && <p className="text-xs font-bold text-red-500">⚠️ وصل لحد إعادة الطلب</p>}
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">🔄 حركات المخزون</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className={inputCls} value={mvItemId} onChange={(e) => setMvItemId(Number(e.target.value))}>
          <option value="">اختر الصنف</option>
          {items.list.data?.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
        <select className={inputCls} value={mvType} onChange={(e) => setMvType(e.target.value as 'in' | 'out')}>
          <option value="in">وارد</option>
          <option value="out">صادر</option>
        </select>
        <input
          className={`${inputCls} w-28`}
          placeholder="الكمية"
          type="number"
          value={mvQuantity}
          onChange={(e) => setMvQuantity(e.target.value)}
        />
        <input className={inputCls} type="date" value={mvDate} onChange={(e) => setMvDate(e.target.value)} />
        <input className={`${inputCls} w-56`} placeholder="ملاحظة (اختياري)" value={mvNote} onChange={(e) => setMvNote(e.target.value)} />
        <button
          disabled={!canSubmitMovement}
          onClick={() => createMovement.mutate()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + تسجيل حركة
        </button>
      </div>

      <div className="mb-4">
        <select className={inputCls} value={filterItemId} onChange={(e) => setFilterItemId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">كل الأصناف</option>
          {items.list.data?.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3 text-start">الصنف</th>
              <th className="p-3 text-start">النوع</th>
              <th className="p-3 text-start">الكمية</th>
              <th className="p-3 text-start">ملاحظة</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {movements.data?.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-slate-500 dark:text-slate-400">{m.movement_date.slice(0, 10)}</td>
                <td className="p-3 text-navy-900 dark:text-white">{m.item?.name}</td>
                <td className={`p-3 font-bold ${m.type === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.type === 'in' ? 'وارد' : 'صادر'}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  {m.quantity} {m.item?.unit}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{m.note ?? '—'}</td>
                <td className="p-3 text-end">
                  <button onClick={() => deleteMovement.mutate(m.id)} className="text-xs text-red-500">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
