import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: Props) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>{message}</Text>}
    </View>
  );
}
