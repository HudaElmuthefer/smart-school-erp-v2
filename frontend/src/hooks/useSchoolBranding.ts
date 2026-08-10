import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { applyBrandColors } from '../lib/brandColors';

export interface SchoolBranding {
  id: number;
  name_ar: string;
  app_name_ar: string | null;
  app_name_en: string | null;
  login_tagline_ar: string | null;
  login_tagline_en: string | null;
  logo_path: string | null;
  logo_url: string | null;
  primary_color: string | null;
  primary_color_dark: string | null;
}

// مصدر مركزي واحد لبيانات العلامة التجارية (اسم النظام، الشعار، الألوان) —
// يُستخدم بكل مكان يعرضها (القائمة الجانبية، صفحة تسجيل الدخول...) حتى تنعكس
// أي تعديل من صفحة الإعدادات فوراً بلا نسخة محلية ثابتة. React Query يتشارك
// نفس queryKey فتُجلب مرة واحدة وتُحدَّث تلقائياً بعد أي mutation ناجحة تستدعي
// invalidateQueries(['school-settings']).
export function useSchoolBranding() {
  const query = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => (await api.get<{ school: SchoolBranding }>('/school-settings')).data.school,
  });

  useEffect(() => {
    if (query.data) applyBrandColors(query.data.primary_color, query.data.primary_color_dark);
  }, [query.data?.primary_color, query.data?.primary_color_dark]);

  useEffect(() => {
    if (query.data?.app_name_ar) document.title = query.data.app_name_ar;
  }, [query.data?.app_name_ar]);

  return query;
}
