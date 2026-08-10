import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Copy } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { SECTION_LABELS, ROLE_BADGE_CLASSES, AVATAR_COLOR_CLASSES } from '../constants';

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  role_id: number;
  role: string;
  role_ar: string;
  is_active: boolean;
  sections: string[];
}

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-navy-800 dark:text-white';

const PREVIEW_COUNT = 8;

function avatarColor(id: number): string {
  return AVATAR_COLOR_CLASSES[id % AVATAR_COLOR_CLASSES.length];
}

export default function UsersPermissionsTab() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const users = useQuery({
    queryKey: ['settings-users'],
    queryFn: async () => (await api.get<{ users: UserRow[]; available_sections: string[] }>('/users')).data,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<UserRow | null>(null);
  const [resetResult, setResetResult] = useState<{ user: UserRow; password: string } | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '' });

  const createUser = useMutation({
    mutationFn: () => api.post('/users', { ...form, role_id: Number(form.role_id) }),
    onSuccess: () => {
      toast.success('تم إنشاء المستخدم');
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setShowCreate(false);
      setForm({ full_name: '', email: '', password: '', role_id: '' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إنشاء المستخدم');
    },
  });

  const updateUser = useMutation({
    mutationFn: (payload: { id: number; full_name: string; email: string; role_id: number }) =>
      api.put(`/users/${payload.id}`, { full_name: payload.full_name, email: payload.email, role_id: payload.role_id }),
    onSuccess: () => {
      toast.success('تم حفظ التعديل');
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setEditingUser(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء التعديل');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('تم حذف المستخدم');
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء الحذف');
    },
  });

  const resetPassword = useMutation({
    mutationFn: (user: UserRow) => api.post<{ new_password: string }>(`/users/${user.id}/reset-password`, {}),
    onSuccess: (res, user) => {
      setResetResult({ user, password: res.data.new_password });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'حدث خطأ أثناء إعادة التعيين');
    },
  });

  const togglePermission = useMutation({
    mutationFn: ({ userId, sectionKey }: { userId: number; sectionKey: string }) =>
      api.post(`/users/${userId}/toggle-permission`, { section_key: sectionKey }),
  });

  const availableSections = users.data?.available_sections ?? Object.keys(SECTION_LABELS);
  const canSubmitCreate = form.full_name && form.email && form.password.length >= 8 && form.role_id;

  const copyPassword = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult.password);
    toast.success('تم النسخ');
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">👥 المستخدمون والصلاحيات</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
        >
          + إضافة مستخدم جديد
        </button>
      </div>

      <div className="space-y-3">
        {users.data?.users.map((u) => {
          const preview = u.sections.slice(0, PREVIEW_COUNT);
          const overflow = u.sections.length - preview.length;
          return (
            <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(u.id)}`}
                  >
                    {u.full_name.trim().charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 dark:text-white">{u.full_name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_BADGE_CLASSES[u.role] ?? 'bg-slate-500/15 text-slate-600'}`}>
                        {u.role_ar}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button onClick={() => setEditingUser(u)} className="font-bold text-gold-600">
                    تعديل
                  </button>
                  <button onClick={() => setPermissionsUser(u)} className="font-bold text-navy-700 dark:text-slate-200">
                    الصلاحيات
                  </button>
                  <button onClick={() => resetPassword.mutate(u)} className="font-bold text-blue-600">
                    إعادة تعيين كلمة المرور
                  </button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => deleteUser.mutate(u.id)} className="font-bold text-red-500">
                      حذف
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400"
                  >
                    {SECTION_LABELS[key] ?? key}
                  </span>
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => setPermissionsUser(u)}
                    className="rounded-full border border-gold-500 px-2.5 py-1 text-xs font-bold text-gold-600"
                  >
                    +{overflow}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(showCreate || editingUser) && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6"
          onClick={() => {
            setShowCreate(false);
            setEditingUser(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-bold text-navy-900 dark:text-white">
              {editingUser ? `تعديل — ${editingUser.full_name}` : 'إضافة مستخدم جديد'}
            </h3>
            {editingUser ? (
              <EditUserForm
                user={editingUser}
                onSave={(payload) => updateUser.mutate(payload)}
                onCancel={() => setEditingUser(null)}
              />
            ) : (
              <div className="space-y-3">
                <input
                  className={`${inputCls} w-full`}
                  placeholder="الاسم الكامل"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                <input
                  className={`${inputCls} w-full`}
                  placeholder="البريد الإلكتروني"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  className={`${inputCls} w-full`}
                  placeholder="كلمة المرور (8+ أحرف)"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <RoleSelect value={form.role_id} onChange={(v) => setForm({ ...form, role_id: v })} />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    disabled={!canSubmitCreate}
                    onClick={() => createUser.mutate()}
                    className="flex-1 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
                  >
                    إنشاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {permissionsUser && (
        <PermissionsModal
          user={permissionsUser}
          availableSections={availableSections}
          onCancel={() => setPermissionsUser(null)}
          onSave={async (sectionKey) => {
            await togglePermission.mutateAsync({ userId: permissionsUser.id, sectionKey });
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['settings-users'] });
            setPermissionsUser(null);
          }}
        />
      )}

      {resetResult && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setResetResult(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-bold text-navy-900 dark:text-white">كلمة المرور الجديدة</h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              لمستخدم: {resetResult.user.full_name} — انسخها الآن، لن تظهر مجدداً.
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-navy-900">
              <code className="text-sm font-bold tracking-wide text-navy-900 dark:text-white">{resetResult.password}</code>
              <button onClick={copyPassword} title="نسخ" className="rounded-lg p-1.5 text-gold-600 hover:bg-gold-500/10">
                <Copy size={16} />
              </button>
            </div>
            <button
              onClick={() => setResetResult(null)}
              className="mt-4 w-full rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionsModal({
  user,
  availableSections,
  onCancel,
  onSave,
  onSaved,
}: {
  user: UserRow;
  availableSections: string[];
  onCancel: () => void;
  onSave: (sectionKey: string) => Promise<void>;
  onSaved: () => void;
}) {
  // نسخة محلية (draft) — لا تُرسَل أي صلاحية للخادم إلا عند الضغط على "حفظ"،
  // حتى يكون زر "إلغاء" فعلياً بلا أي أثر جانبي، ويعكس زر "حفظ" فعلاً حقيقياً واحداً واضحاً
  const [draft, setDraft] = useState<Set<string>>(() => new Set(user.sections));
  const [saving, setSaving] = useState(false);
  const allSelected = availableSections.every((key) => draft.has(key));

  const toggleDraft = (key: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    const toAdd = availableSections.filter((k) => draft.has(k) && !user.sections.includes(k));
    const toRemove = availableSections.filter((k) => !draft.has(k) && user.sections.includes(k));
    if (toAdd.length === 0 && toRemove.length === 0) {
      onSaved();
      return;
    }
    setSaving(true);
    try {
      for (const key of [...toAdd, ...toRemove]) {
        await onSave(key);
      }
      toast.success('تم حفظ الصلاحيات');
      onSaved();
    } catch {
      toast.error('تعذّر حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => !saving && onCancel()}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-navy-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-navy-900 dark:text-white">صلاحيات — {user.full_name}</h3>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setDraft(new Set(availableSections))} className="font-bold text-gold-600">
              تحديد الكل
            </button>
            <button onClick={() => setDraft(new Set())} className="font-bold text-red-500">
              إلغاء تحديد الكل
            </button>
          </div>
        </div>
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {availableSections.map((key) => {
            const active = draft.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleDraft(key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                  active
                    ? 'border-gold-500 bg-gold-500/10 font-bold text-gold-600'
                    : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    active ? 'border-gold-500 bg-gold-500 text-navy-950' : 'border-slate-300 dark:border-white/20'
                  }`}
                >
                  {active && <Check size={12} />}
                </span>
                {SECTION_LABELS[key] ?? key}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">{allSelected ? 'كل الأقسام مفعّلة لهذا المستخدم' : ''}</p>
        <div className="mt-4 flex gap-2">
          <button
            disabled={saving}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
          >
            إلغاء
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex-1 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // الأدوار ثابتة بالنظام (seed) — معروضة هنا مباشرة لتفادي حاجة نقطة API إضافية لقائمة قصيرة وثابتة
  const roles = [
    { id: 2, label: 'مدير فرع' },
    { id: 3, label: 'معلم' },
    { id: 4, label: 'موظف' },
    { id: 5, label: 'ولي أمر' },
    { id: 6, label: 'محاسب' },
    { id: 7, label: 'موارد بشرية' },
  ];

  return (
    <select className={inputCls + ' w-full'} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">اختر الدور</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.label}
        </option>
      ))}
    </select>
  );
}

function EditUserForm({
  user,
  onSave,
  onCancel,
}: {
  user: UserRow;
  onSave: (payload: { id: number; full_name: string; email: string; role_id: number }) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [roleId, setRoleId] = useState(String(user.role_id));

  return (
    <div className="space-y-3">
      <input className={`${inputCls} w-full`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input className={`${inputCls} w-full`} value={email} onChange={(e) => setEmail(e.target.value)} />
      <RoleSelect value={roleId} onChange={setRoleId} />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/10 dark:text-slate-200"
        >
          إلغاء
        </button>
        <button
          onClick={() => onSave({ id: user.id, full_name: fullName, email, role_id: Number(roleId) })}
          className="flex-1 rounded-xl bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}
