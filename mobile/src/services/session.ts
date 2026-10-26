import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthTokens } from '../types';
import { setMockUser, resetMockUser } from './mockService';

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_SESSION_KEY = 'cached_user';

export async function saveSession(user: User, tokens: AuthTokens): Promise<void> {
  try {
    const promises: Promise<any>[] = [];
    if (tokens.accessToken) {
      promises.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken));
    }
    if (tokens.refreshToken) {
      promises.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken));
    }
    promises.push(AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user)));
    await Promise.all(promises);
    setMockUser(user);
  } catch (e) {
    console.warn('Failed to save session to storage', e);
  }
}

export async function saveUserSession(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    setMockUser(user);
  } catch (e) {
    console.warn('Failed to save user session to storage', e);
  }
}

export async function clearSession(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(USER_SESSION_KEY).catch(() => {}),
    ]);
    resetMockUser();
  } catch (e) {
    console.warn('Failed to clear session from storage', e);
  }
}

export async function loadSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null),
      AsyncStorage.getItem(USER_SESSION_KEY).catch(() => null),
    ]);

    if (!accessToken || !userJson) {
      return null;
    }

    const user: User = JSON.parse(userJson);
    if (!user || !user.id) {
      return null;
    }

    // Sync mock service user state if in mock mode
    setMockUser(user);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: refreshToken || '',
      },
    };
  } catch {
    return null;
  }
}
