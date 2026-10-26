import { useAuthStore } from '../store/authStore';
import { authService, userService } from '../services';

export function useAuth() {
  const { user, tokens, isAuthenticated, isLoading, setAuth, clearAuth, setUser } = useAuthStore();

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setAuth(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const result = await authService.register(name, email, password, phone);
    setAuth(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  };

  const logout = async () => {
    const refreshToken = tokens?.refreshToken;
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {}
    }
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

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
    sendVerificationOtp,
    verifyEmailOtp,
  };
}
