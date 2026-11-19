import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
  const path = require('path');
  const expoEnv = require('@expo/env');
  expoEnv.load(path.resolve(__dirname, '..'));
});

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

import { authService } from '../src/services';
import { realAuthService } from '../src/services/realService';

describe('Real API Service URL & Env Resolution', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: { ok: true }, error: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('loads EXPO_PUBLIC_USE_MOCK=false and resolves realAuthService (not mock)', () => {
    expect(process.env.EXPO_PUBLIC_USE_MOCK).toBe('false');
    expect(authService).toBe(realAuthService);
  });

  it('loads EXPO_PUBLIC_API_BASE_URL ending with /api/v1 (not /api/v1s or Render URL)', () => {
    const base = process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(base).toMatch(/^http:\/\/.*:8080\/api\/v1$/);
    expect(base).not.toContain('onrender.com');
  });

  it('calls exact /api/v1/auth/* URLs for login, signup, verifyEmail, resendVerification, and refreshToken', async () => {
    await realAuthService.login('user@example.com', 'password123');
    await realAuthService.signup('Test User', 'user@example.com', 'password123');
    await realAuthService.verifyEmail('user@example.com', '123456');
    await realAuthService.resendVerification('user@example.com');
    await realAuthService.refreshToken('refresh-token-123');

    const base = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
    const calls = (globalThis.fetch as any).mock.calls.map(([url, opts]: [string, RequestInit]) => ({
      method: opts?.method || 'GET',
      url,
    }));

    expect(calls).toEqual([
      { method: 'POST', url: `${base}/auth/login` },
      { method: 'POST', url: `${base}/auth/signup` },
      { method: 'POST', url: `${base}/auth/verify-email` },
      { method: 'POST', url: `${base}/auth/resend-verification` },
      { method: 'POST', url: `${base}/auth/refresh` },
    ]);
  });
});
