export const SECTION_LABELS: Record<string, string> = {
  home: 'الرئيسية',
  announcements: 'الإعلانات',
  messages: 'الرسائل',
  students: 'الطلاب',
  academic: 'البنية الأكاديمية',
  teachers: 'المعلمون',
  attendance: 'الحضور',
  grades: 'الدرجات',
  assignments: 'الواجبات',
  lms: 'الدروس والاختبارات',
  staff: 'الموظفون',
  finance: 'المالية والحسابات',
  installments: 'الأقساط',
  inventory: 'المخزون',
  exportImport: 'تصدير/استيراد',
  backups: 'النسخ الاحتياطي',
  aiChat: 'المساعد الذكي',
  earlyWarning: 'الإنذار المبكر',
  schools: 'الفروع',
  settings: 'الإعدادات',
};

export const ROLE_BADGE_CLASSES: Record<string, string> = {
  super_admin: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  admin: 'bg-gold-500/20 text-gold-600',
  teacher: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  staff: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  parent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  accountant: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  hr: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
};

export const AVATAR_COLOR_CLASSES = [
  'bg-navy-700',
  'bg-gold-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
];

export interface SettingsTabDef {
  key: string;
  label: string;
  icon: string;
}

export const SETTINGS_TABS: SettingsTabDef[] = [
  { key: 'users', label: 'المستخدمون والصلاحيات', icon: '👥' },
  { key: 'appearance', label: 'المظهر والألوان', icon: '🎨' },
  { key: 'system', label: 'إعدادات النظام', icon: '⚙️' },
  { key: 'print', label: 'إعدادات الطباعة', icon: '🖨️' },
  { key: 'logo', label: 'الشعار', icon: '🖼️' },
  { key: 'systemName', label: 'اسم النظام', icon: '🏷️' },
  { key: 'branches', label: 'الفروع', icon: '🏫' },
  { key: 'backup', label: 'النسخ الاحتياطي', icon: '🗄️' },
  { key: 'updates', label: 'التحديثات', icon: '🔄' },
  { key: 'trash', label: 'سلة المحذوفات', icon: '🗑️' },
  { key: 'about', label: 'حول النظام', icon: 'ℹ️' },
];
