import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';

interface ImportResult {
  created: number;
  errors: string[];
}

export default function ExportImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const download = async (endpoint: string, filename: string) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportResult>('/imports/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`تم استيراد ${res.data.created} طالب`);
    } catch {
      toast.error('حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">📊 تصدير واستيراد Excel</h2>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <h3 className="mb-3 font-bold text-navy-900 dark:text-white">تصدير</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => download('/exports/students', 'students.xlsx')}
            className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
          >
            ⬇️ تصدير الطلاب
          </button>
          <button
            onClick={() => download('/exports/transactions', 'transactions.xlsx')}
            className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
          >
            ⬇️ تصدير الحركات المالية
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <h3 className="mb-2 font-bold text-navy-900 dark:text-white">استيراد الطلاب</h3>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          ترتيب الأعمدة في الملف: الاسم الكامل، الرقم الوطني (اختياري)، اسم الشعبة، تاريخ الميلاد (اختياري). الصف الأول للعناوين.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={importing}
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          className="text-sm text-slate-600 dark:text-slate-300"
        />
        {importing && <p className="mt-2 text-sm text-slate-500">جارٍ الاستيراد...</p>}
        {result && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-navy-900">
            <p className="font-bold text-emerald-600">تم إنشاء {result.created} طالب</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc ps-4 text-xs text-red-500">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
