import { create } from 'zustand';

type Mode = 'light' | 'dark';

interface ThemeState {
  mode: Mode;
  toggle: () => void;
}

const stored = (localStorage.getItem('theme') as Mode | null) ?? 'light';
document.documentElement.classList.toggle('dark', stored === 'dark');

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: stored,
  toggle: () => {
    const next: Mode = get().mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ mode: next });
  },
}));
