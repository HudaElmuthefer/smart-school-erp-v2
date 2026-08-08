import { create } from 'zustand';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  role_ar: string;
  school_id: number | null;
  student_id: number | null;
  locale: string;
  theme: string;
  avatar_path: string | null;
  dashboard_prefs: Record<string, unknown> | null;
  is_super_admin: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

const storedToken = localStorage.getItem('auth_token');
const storedUser = localStorage.getItem('auth_user');

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
  setSession: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user });
  },
  clearSession: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null });
  },
}));
