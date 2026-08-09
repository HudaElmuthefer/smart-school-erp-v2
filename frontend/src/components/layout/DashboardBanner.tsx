import { type ReactNode } from 'react';
import { useThemeStore } from '../../store/themeStore';
import bannerLight from '../../assets/banner-quote-light.png';
import bannerDark from '../../assets/banner-quote-dark.png';

export default function DashboardBanner({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  const { mode } = useThemeStore();
  const banner = mode === 'dark' ? bannerDark : bannerLight;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl">
      <img src={banner} alt="" className="block w-full object-cover" />
      <div className="absolute inset-0 flex flex-col justify-center px-6">
        <h1 className="text-lg font-bold text-white drop-shadow">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/90 drop-shadow">{subtitle}</p>}
      </div>
    </div>
  );
}
