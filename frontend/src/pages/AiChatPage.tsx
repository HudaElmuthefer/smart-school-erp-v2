import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';

interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
}

export default function AiChatPage() {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [message, setMessage] = useState('');

  const send = useMutation({
    mutationFn: (text: string) => api.post<{ reply: string }>('/ai/chat', { message: text }),
    onSuccess: (res, text) => {
      setHistory((h) => [...h, { role: 'user', text }, { role: 'assistant', text: res.data.reply }]);
      setMessage('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء التواصل مع المساعد الذكي');
    },
  });

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">🤖 المساعد الذكي</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        اسأل عن درجات ابنك، حضوره، أو واجباته. الإجابات تعتمد فقط على بياناته المسجّلة في النظام.
      </p>

      <div className="mb-4 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
        <div className="mb-3 max-h-96 min-h-[10rem] space-y-2 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-slate-400">ابدأ بسؤال، مثل: "كيف أداء ابني في الرياضيات؟"</p>}
          {history.map((entry, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                entry.role === 'user' ? 'ms-auto bg-gold-500 text-navy-950' : 'bg-slate-100 text-navy-900 dark:bg-navy-900 dark:text-white'
              }`}
            >
              {entry.text}
            </div>
          ))}
          {send.isPending && <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-navy-900">يكتب...</div>}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-900 dark:text-white"
            placeholder="اكتب سؤالك..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && message && !send.isPending && send.mutate(message)}
          />
          <button
            disabled={!message || send.isPending}
            onClick={() => send.mutate(message)}
            className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
          >
            إرسال
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
