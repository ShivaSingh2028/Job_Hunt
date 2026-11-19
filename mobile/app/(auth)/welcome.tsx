import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/hooks/useTheme';
import { UnifiedAuthScreen } from '../../src/components/auth/UnifiedAuthScreen';

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <UnifiedAuthScreen initialTab="login" />
    </SafeAreaView>
  );
}
