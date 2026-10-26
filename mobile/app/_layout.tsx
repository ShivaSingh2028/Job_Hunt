import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { loadSession } from '../src/services/session';
import { userService } from '../src/services';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure splash screen hides in <= 2 seconds under all circumstances
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      if (useAuthStore.getState().isLoading) {
        clearAuth();
      }
    }, 2000);

    (async () => {
      try {
        // Pure local storage check (SecureStore + AsyncStorage) - NO network or mock delay!
        const session = await loadSession();
        if (!isMounted) return;

        if (session) {
          setAuth(session.user, session.tokens, true);
        } else {
          clearAuth();
        }
      } catch {
        if (isMounted) clearAuth();
      } finally {
        clearTimeout(safetyTimer);
        await SplashScreen.hideAsync().catch(() => {});

        // Non-blocking background session revalidation for real API mode
        // MUST NEVER block splash or initial screen presentation
        if (process.env.EXPO_PUBLIC_USE_MOCK !== 'true') {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            userService
              .getMe()
              .then((freshUser) => {
                if (isMounted && freshUser) {
                  useAuthStore.getState().setUser(freshUser);
                }
              })
              .catch((err: any) => {
                if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
                  useAuthStore.getState().clearAuth();
                }
              });
          }
        }
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
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
