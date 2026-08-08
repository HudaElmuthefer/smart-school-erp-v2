import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';
import { useEntityCrud } from '../hooks/useEntityCrud';

interface Account {
  id: number;
  name: string;
  opening_balance: number;
  balance: number;
}
interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  account?: { name: string };
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const accounts = useEntityCrud<Account>('accounts', 'accounts');

  const [accountName, setAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const [filterAccountId, setFilterAccountId] = useState<number | ''>('');
  const [txAccountId, setTxAccountId] = useState<number | ''>('');
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState('');

  const transactions = useQuery({
    queryKey: ['transactions', filterAccountId],
    queryFn: async () =>
      (
        await api.get<{ transactions: Transaction[] }>('/transactions', {
          params: filterAccountId ? { account_id: filterAccountId } : {},
        })
      ).data.transactions,
  });

  const createTransaction = useMutation({
    mutationFn: () =>
      api.post('/transactions', {
        account_id: txAccountId,
        type: txType,
        category: txCategory || null,
        amount: Number(txAmount),
        description: txDescription || null,
        transaction_date: txDate,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل الحركة المالية');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setTxCategory('');
      setTxAmount('');
      setTxDescription('');
      setTxDate('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء تسجيل الحركة');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الحركة');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const canSubmitTx = txAccountId && txAmount && Number(txAmount) > 0 && txDate;

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">💰 الحسابات</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputCls} w-48`}
          placeholder="اسم الحساب"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
        <input
          className={`${inputCls} w-40`}
          placeholder="الرصيد الافتتاحي"
          type="number"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
        <button
          disabled={!accountName}
          onClick={() => {
            accounts.create.mutate({ name: accountName, opening_balance: openingBalance ? Number(openingBalance) : 0 });
            setAccountName('');
            setOpeningBalance('');
          }}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + إضافة حساب
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {accounts.list.data?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy-900 dark:text-white">{a.name}</h3>
              <button onClick={() => accounts.remove.mutate(a.id)} className="text-xs text-red-500">
                حذف
              </button>
            </div>
            <p className={`mt-2 text-xl font-bold ${a.balance >= 0 ? 'text-gold-600' : 'text-red-500'}`}>{a.balance}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">📒 الحركات المالية</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className={inputCls} value={txAccountId} onChange={(e) => setTxAccountId(Number(e.target.value))}>
          <option value="">اختر الحساب</option>
          {accounts.list.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select className={inputCls} value={txType} onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}>
          <option value="income">دخل</option>
          <option value="expense">مصروف</option>
        </select>
        <input className={`${inputCls} w-36`} placeholder="التصنيف" value={txCategory} onChange={(e) => setTxCategory(e.target.value)} />
        <input
          className={`${inputCls} w-32`}
          placeholder="المبلغ"
          type="number"
          value={txAmount}
          onChange={(e) => setTxAmount(e.target.value)}
        />
        <input className={inputCls} type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
        <input
          className={`${inputCls} w-56`}
          placeholder="الوصف (اختياري)"
          value={txDescription}
          onChange={(e) => setTxDescription(e.target.value)}
        />
        <button
          disabled={!canSubmitTx}
          onClick={() => createTransaction.mutate()}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          + تسجيل حركة
        </button>
      </div>

      <div className="mb-4">
        <select className={inputCls} value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">كل الحسابات</option>
          {accounts.list.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-navy-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3 text-start">الحساب</th>
              <th className="p-3 text-start">النوع</th>
              <th className="p-3 text-start">التصنيف</th>
              <th className="p-3 text-start">المبلغ</th>
              <th className="p-3 text-start">الوصف</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.data?.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.transaction_date.slice(0, 10)}</td>
                <td className="p-3 text-navy-900 dark:text-white">{t.account?.name}</td>
                <td className={`p-3 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? 'دخل' : 'مصروف'}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.category ?? '—'}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.amount}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{t.description ?? '—'}</td>
                <td className="p-3 text-end">
                  <button onClick={() => deleteTransaction.mutate(t.id)} className="text-xs text-red-500">
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
