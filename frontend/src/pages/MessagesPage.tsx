import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../lib/api';

interface Contact {
  id: number;
  full_name: string;
  role_ar: string | null;
}
interface Conversation {
  user_id: number;
  full_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
}
interface ThreadMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  created_at: string;
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [newContactId, setNewContactId] = useState<number | ''>('');
  const [draft, setDraft] = useState('');

  const contacts = useQuery({
    queryKey: ['message-contacts'],
    queryFn: async () => (await api.get<{ contacts: Contact[] }>('/messages/contacts')).data.contacts,
  });

  const inbox = useQuery({
    queryKey: ['message-inbox'],
    queryFn: async () => (await api.get<{ conversations: Conversation[] }>('/messages/inbox')).data.conversations,
    refetchInterval: 10000,
  });

  const thread = useQuery({
    enabled: !!activeUserId,
    queryKey: ['message-thread', activeUserId],
    queryFn: async () => (await api.get<{ messages: ThreadMessage[] }>(`/messages/thread/${activeUserId}`)).data.messages,
  });

  const sendMessage = useMutation({
    mutationFn: () => api.post('/messages', { recipient_id: activeUserId, body: draft }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['message-thread', activeUserId] });
      queryClient.invalidateQueries({ queryKey: ['message-inbox'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إرسال الرسالة');
    },
  });

  const activeName =
    contacts.data?.find((c) => c.id === activeUserId)?.full_name ??
    inbox.data?.find((c) => c.user_id === activeUserId)?.full_name;

  return (
    <AppLayout>
      <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">💬 الرسائل</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-800 md:col-span-1">
          <div className="mb-3 flex gap-2">
            <select className={`${inputCls} flex-1`} value={newContactId} onChange={(e) => setNewContactId(Number(e.target.value))}>
              <option value="">محادثة جديدة مع...</option>
              {contacts.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.role_ar})
                </option>
              ))}
            </select>
            <button
              disabled={!newContactId}
              onClick={() => {
                setActiveUserId(Number(newContactId));
                setNewContactId('');
              }}
              className="rounded-xl bg-gold-500 px-3 py-2 text-xs font-bold text-navy-950 disabled:opacity-60"
            >
              فتح
            </button>
          </div>

          <div className="space-y-1">
            {inbox.data?.length === 0 && <p className="p-2 text-xs text-slate-400">لا توجد محادثات بعد</p>}
            {inbox.data?.map((c) => (
              <button
                key={c.user_id}
                onClick={() => setActiveUserId(c.user_id)}
                className={`w-full rounded-xl p-2 text-start text-sm ${
                  activeUserId === c.user_id ? 'bg-gold-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 dark:text-white">{c.full_name}</span>
                  {c.unread_count > 0 && (
                    <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-950">{c.unread_count}</span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.last_message}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800 md:col-span-2">
          {!activeUserId ? (
            <p className="text-sm text-slate-400">اختر محادثة أو ابدأ محادثة جديدة</p>
          ) : (
            <>
              <h3 className="mb-3 font-bold text-navy-900 dark:text-white">{activeName}</h3>
              <div className="mb-3 max-h-96 flex-1 space-y-2 overflow-y-auto">
                {thread.data?.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender_id === activeUserId
                        ? 'bg-slate-100 text-navy-900 dark:bg-navy-900 dark:text-white'
                        : 'ms-auto bg-gold-500 text-navy-950'
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="اكتب رسالة..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft && sendMessage.mutate()}
                />
                <button
                  disabled={!draft}
                  onClick={() => sendMessage.mutate()}
                  className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
                >
                  إرسال
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
