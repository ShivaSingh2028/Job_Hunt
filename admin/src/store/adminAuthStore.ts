import { create } from 'zustand';
import type { AdminUser } from '../types';

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-1',
  name: 'Sarah Connor',
  email: 'admin@jobhunt.campus',
  role: 'ADMIN',
  avatarUrl: null,
};

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,
  login: (email, password) => {
    if (email === 'admin@jobhunt.campus' && password === 'admin123') {
      set({ admin: DEFAULT_ADMIN, token: 'admin-session-token', isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ admin: null, token: null, isAuthenticated: false }),
}));
