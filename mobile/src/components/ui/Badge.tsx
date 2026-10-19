import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const { colors, radii } = useTheme();

  const bgMap: Record<BadgeVariant, string> = {
    default: colors.bgTertiary,
    success: `${colors.success}20`,
    error: `${colors.error}20`,
    warning: `${colors.warning}20`,
    info: `${colors.info}20`,
    primary: colors.primaryLight,
  };

  const textMap: Record<BadgeVariant, string> = {
    default: colors.textSecondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    primary: colors.primary,
  };

  return (
    <View style={[
      {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.full,
        backgroundColor: bgMap[variant],
        alignSelf: 'flex-start',
      },
      style,
    ]}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: textMap[variant] }}>{label}</Text>
    </View>
  );
}
