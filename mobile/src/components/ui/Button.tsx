import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle, fullWidth }: ButtonProps) {
  const { colors, radii } = useTheme();
  const isDisabled = disabled || loading;

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.bgTertiary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  };

  const textColorMap: Record<Variant, string> = {
    primary: '#fff',
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
    danger: '#fff',
  };

  const paddingMap: Record<Size, { paddingVertical: number; paddingHorizontal: number }> = {
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 20 },
    lg: { paddingVertical: 15, paddingHorizontal: 28 },
  };

  const fontSizeMap: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bgMap[variant],
          borderRadius: radii.md,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          opacity: isDisabled ? 0.55 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          ...(fullWidth ? { width: '100%' } : {}),
        },
        paddingMap[size],
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={textColorMap[variant]} />}
      <Text style={[
        { color: textColorMap[variant], fontSize: fontSizeMap[size], fontWeight: '600' },
        textStyle,
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}
