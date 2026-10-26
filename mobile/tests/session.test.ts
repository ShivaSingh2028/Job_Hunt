import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory mocks for SecureStore and AsyncStorage
const secureStoreMap = new Map<string, string>();
const asyncStorageMap = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => secureStoreMap.get(key) || null),
  setItemAsync: vi.fn(async (key: string, val: string) => { secureStoreMap.set(key, val); }),
  deleteItemAsync: vi.fn(async (key: string) => { secureStoreMap.delete(key); }),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStorageMap.get(key) || null),
    setItem: vi.fn(async (key: string, val: string) => { asyncStorageMap.set(key, val); }),
    removeItem: vi.fn(async (key: string) => { asyncStorageMap.delete(key); }),
  },
}));

import { saveSession, saveUserSession, clearSession, loadSession, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_SESSION_KEY } from '../src/services/session';
import { setMockUser, resetMockUser, mockUserService } from '../src/services/mockService';
import type { User } from '../src/types';

describe('JobHunt Session Management & Storage Restoration', () => {
  const dummyUser: User = {
    id: 'user-test-123',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    phone: '+91 99999 88888',
    avatarUrl: null,
    activeMode: 'RECRUITER',
    isVerified: true,
    cancellationCount: 0,
    isBlocked: false,
    blockedUntil: null,
    savedJobIds: ['job-1', 'job-2'],
    location: { lat: 28.5, lng: 77.1, label: 'Campus Block B' },
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    secureStoreMap.clear();
    asyncStorageMap.clear();
    resetMockUser();
  });

  it('saves session tokens to SecureStore and user to AsyncStorage', async () => {
    await saveSession(dummyUser, {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    expect(secureStoreMap.get(ACCESS_TOKEN_KEY)).toBe('test-access-token');
    expect(secureStoreMap.get(REFRESH_TOKEN_KEY)).toBe('test-refresh-token');
    expect(asyncStorageMap.get(USER_SESSION_KEY)).toBe(JSON.stringify(dummyUser));
  });

  it('restores saved session on startup without making network calls', async () => {
    await saveSession(dummyUser, {
      accessToken: 'saved-access-token',
      refreshToken: 'saved-refresh-token',
    });

    const restored = await loadSession();
    expect(restored).not.toBeNull();
    expect(restored?.tokens.accessToken).toBe('saved-access-token');
    expect(restored?.tokens.refreshToken).toBe('saved-refresh-token');
    expect(restored?.user.id).toBe('user-test-123');
    expect(restored?.user.activeMode).toBe('RECRUITER');
    expect(restored?.user.email).toBe('sarah@example.com');
  });

  it('returns null if token or user is missing in storage', async () => {
    // Only user saved, no token
    await saveUserSession(dummyUser);
    const noTokenResult = await loadSession();
    expect(noTokenResult).toBeNull();

    // Only token saved, no user
    asyncStorageMap.clear();
    secureStoreMap.set(ACCESS_TOKEN_KEY, 'some-token');
    const noUserResult = await loadSession();
    expect(noUserResult).toBeNull();
  });

  it('updates AsyncStorage and mock user when activeMode is switched', async () => {
    await saveSession(dummyUser, { accessToken: 'token-1', refreshToken: 'token-2' });

    const switchedUser: User = { ...dummyUser, activeMode: 'SEEKER' };
    await saveUserSession(switchedUser);

    expect(asyncStorageMap.get(USER_SESSION_KEY)).toBe(JSON.stringify(switchedUser));

    // Verify mockUserService reflects the restored user
    const me = await mockUserService.getMe();
    expect(me.activeMode).toBe('SEEKER');
  });

  it('clears tokens and user from phone storage on logout', async () => {
    await saveSession(dummyUser, { accessToken: 'token-1', refreshToken: 'token-2' });
    expect(secureStoreMap.size).toBe(2);
    expect(asyncStorageMap.size).toBe(1);

    await clearSession();

    expect(secureStoreMap.get(ACCESS_TOKEN_KEY)).toBeUndefined();
    expect(secureStoreMap.get(REFRESH_TOKEN_KEY)).toBeUndefined();
    expect(asyncStorageMap.get(USER_SESSION_KEY)).toBeUndefined();
  });
});
