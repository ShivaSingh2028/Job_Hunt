import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
  leftIcon,
  rightIcon,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, radii, typography } = useTheme();
  const isDisabled = disabled || loading;
  const effectiveLeftIcon = leftIcon || icon;

  const resolvedVariant = variant === 'danger' ? 'destructive' : variant;

  const bgMap: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.primaryBg,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: colors.dangerBg,
  };

  const textColorMap: Record<string, string> = {
    primary: '#FFFFFF',
    secondary: colors.primary,
    outline: colors.text,
    ghost: colors.textSecondary,
    destructive: colors.dangerText,
  };

  const borderColorMap: Record<string, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: colors.border,
    ghost: 'transparent',
    destructive: colors.dangerBorder,
  };

  const heightMap: Record<ButtonSize, number> = {
    sm: 36,
    md: 48,
    lg: 52,
  };

  const paddingHorizontalMap: Record<ButtonSize, number> = {
    sm: 12,
    md: 20,
    lg: 24,
  };

  const fontStyleMap: Record<ButtonSize, TextStyle> = {
    sm: { ...typography.caption, fontWeight: '600', fontSize: 13 },
    md: { ...typography.secondary, fontWeight: '600', fontSize: 15 },
    lg: { ...typography.body, fontWeight: '600', fontSize: 16 },
  };

  const spinnerColor = textColorMap[resolvedVariant] || '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          minHeight: heightMap[size],
          paddingHorizontal: paddingHorizontalMap[size],
          backgroundColor: bgMap[resolvedVariant],
          borderRadius: radii.button,
          borderWidth: resolvedVariant === 'outline' || resolvedVariant === 'destructive' ? 1.5 : 0,
          borderColor: borderColorMap[resolvedVariant],
          opacity: isDisabled ? 0.5 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {effectiveLeftIcon}
          <Text
            style={[
              fontStyleMap[size],
              { color: textColorMap[resolvedVariant] },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
