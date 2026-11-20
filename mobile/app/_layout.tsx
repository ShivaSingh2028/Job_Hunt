import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../src/store/authStore';
import { loadSession } from '../src/services/session';
import { userService } from '../src/services';

// Catch any splash-screen promise rejections during cold boot
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { setAuth, clearAuth } = useAuthStore();
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
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
        if (isMounted) setSessionLoaded(true);

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
    };
  }, []);

  useEffect(() => {
    // Hide splash once fonts and session are resolved
    if ((fontsLoaded || fontError) && sessionLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }

    // Safety timeout: splash screen will never freeze longer than 2 seconds
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(safetyTimer);
  }, [fontsLoaded, fontError, sessionLoaded]);

  // Keep native splash screen visible until fonts and basic session are ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {isServerWaking && (
          <View
            style={{
              position: 'absolute',
              top: 52,
              left: 16,
              right: 16,
              backgroundColor: '#1E1B4B',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 99,
              zIndex: 99999,
              borderWidth: 1,
              borderColor: '#4338CA',
            }}
          >
            <ActivityIndicator size="small" color="#A78BFA" />
            <Text style={{ color: '#F3F4F6', fontSize: 13, fontWeight: '600' }}>
              Waking up the server... Please wait a moment.
            </Text>
          </View>
        )}
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="design-preview" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
