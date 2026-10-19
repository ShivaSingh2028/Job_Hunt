// Zustand auth store
import { create } from 'zustand';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true, isLoading: false }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),
  setLoading: (v) => set({ isLoading: v }),
}));
