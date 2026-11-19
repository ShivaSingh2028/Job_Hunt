import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({
  children,
  style,
  padded = true,
  variant = 'elevated',
}: CardProps) {
  const { colors, radii, shadow, spacing, isDark } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceElevated,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.borderSubtle,
          ...shadow.sm,
        };
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: radii.card,
          ...(padded ? { padding: spacing.cardPadding } : {}),
        },
        getVariantStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
}
