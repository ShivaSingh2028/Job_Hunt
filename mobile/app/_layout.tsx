import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { userService, authService } from '../src/services';
import type { User } from '../src/types';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        let token = await SecureStore.getItemAsync('accessToken').catch(() => null);
        const refreshToken = await SecureStore.getItemAsync('refreshToken').catch(() => null);
        const cachedUserStr = await AsyncStorage.getItem('cached_user').catch(() => null);
        let cachedUser: User | null = null;
        if (cachedUserStr) {
          try {
            cachedUser = JSON.parse(cachedUserStr);
          } catch {}
        }

        if (token && refreshToken) {
          try {
            const user = await userService.getMe();
            await AsyncStorage.setItem('cached_user', JSON.stringify(user)).catch(() => {});
            setAuth(user, { accessToken: token, refreshToken });
          } catch (err: any) {
            // If access token expired, attempt silent refresh before clearing auth
            if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
              try {
                const refreshed = await authService.refreshToken(refreshToken);
                token = refreshed.accessToken;
                await SecureStore.setItemAsync('accessToken', refreshed.accessToken);
                if (refreshed.refreshToken) {
                  await SecureStore.setItemAsync('refreshToken', refreshed.refreshToken);
                }
                const user = await userService.getMe();
                await AsyncStorage.setItem('cached_user', JSON.stringify(user)).catch(() => {});
                setAuth(user, {
                  accessToken: refreshed.accessToken,
                  refreshToken: refreshed.refreshToken || refreshToken,
                });
              } catch (refreshErr) {
                // Refresh token is truly expired/invalid -> clear auth
                await SecureStore.deleteItemAsync('accessToken').catch(() => {});
                await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
                await AsyncStorage.removeItem('cached_user').catch(() => {});
                clearAuth();
              }
            } else if (cachedUser) {
              // Network error or offline: restore session from cache so user isn't forced to login!
              setAuth(cachedUser, { accessToken: token, refreshToken });
            } else {
              clearAuth();
            }
          }
        } else if (cachedUser && refreshToken) {
          setAuth(cachedUser, { accessToken: token || '', refreshToken });
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
