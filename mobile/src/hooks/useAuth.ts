import { useAuthStore } from '../store/authStore';
import { authService, userService } from '../services';
import * as SecureStore from 'expo-secure-store';

export function useAuth() {
  const { user, tokens, isAuthenticated, isLoading, setAuth, clearAuth, setUser } = useAuthStore();

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    await SecureStore.setItemAsync('accessToken', result.accessToken);
    await SecureStore.setItemAsync('refreshToken', result.refreshToken);
    setAuth(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const result = await authService.register(name, email, password, phone);
    await SecureStore.setItemAsync('accessToken', result.accessToken);
    await SecureStore.setItemAsync('refreshToken', result.refreshToken);
    setAuth(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  };

  const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      try { await authService.logout(refreshToken); } catch {}
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    clearAuth();
  };

  const refreshProfile = async () => {
    try {
      const me = await userService.getMe();
      setUser(me);
    } catch {}
  };

  const sendVerificationOtp = async (email: string) => {
    return await authService.sendVerificationOtp(email);
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    const res = await authService.verifyEmailOtp(email, otp);
    setUser(res.user);
    return res;
  };

  return { user, tokens, isAuthenticated, isLoading, login, register, logout, refreshProfile, sendVerificationOtp, verifyEmailOtp };
}
