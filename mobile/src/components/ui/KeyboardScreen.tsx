import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  ViewStyle,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../hooks/useTheme';

export interface KeyboardScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
  scrollEnabled?: boolean;
}

export function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  scrollEnabled = true,
}: KeyboardScreenProps) {
  const { colors, isDark, spacing } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
        },
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {scrollEnabled ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingHorizontal: spacing.screenHorizontal,
                paddingVertical: spacing.screenVertical,
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              {
                flex: 1,
                paddingHorizontal: spacing.screenHorizontal,
                paddingVertical: spacing.screenVertical,
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
