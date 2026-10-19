import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const { colors, radii, shadow, spacing } = useTheme();
  return (
    <View style={[
      {
        backgroundColor: colors.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...(padded ? { padding: spacing.lg } : {}),
        ...shadow.sm,
      },
      style,
    ]}>
      {children}
    </View>
  );
}
