// Zustand auth store
import { create } from 'zustand';
import type { User, AuthTokens } from '../types';
import { saveSession, saveUserSession, clearSession } from '../services/session';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isServerWaking: boolean;
  setAuth: (user: User, tokens: AuthTokens, skipStorage?: boolean) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
  setServerWaking: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  isServerWaking: false,
  setAuth: (user, tokens, skipStorage = false) => {
    if (!skipStorage) {
      saveSession(user, tokens);
    }
    set({ user, tokens, isAuthenticated: true, isLoading: false, isServerWaking: false });
  },
  setUser: (user) => {
    saveUserSession(user);
    set({ user });
  },
  clearAuth: () => {
    clearSession();
    set({ user: null, tokens: null, isAuthenticated: false, isLoading: false, isServerWaking: false });
  },
  setLoading: (v) => set({ isLoading: v }),
  setServerWaking: (v) => set({ isServerWaking: v }),
}));
