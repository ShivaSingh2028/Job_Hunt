import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'info';

export interface BadgeProps {
  label?: string | number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
  textStyle,
}: BadgeProps) {
  const { colors, radii, typography } = useTheme();

  const resolvedVariant =
    variant === 'error' ? 'danger' : variant === 'neutral' ? 'default' : variant;

  const getColors = () => {
    switch (resolvedVariant) {
      case 'primary':
        return { bg: colors.primaryBg, text: colors.primary, border: colors.primaryLight };
      case 'success':
        return { bg: colors.successBg, text: colors.successText, border: colors.successBorder };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.dangerText, border: colors.dangerBorder };
      case 'info':
        return { bg: colors.infoBg, text: colors.infoText, border: colors.infoBorder };
      case 'default':
      default:
        return { bg: colors.neutralBg, text: colors.neutralText, border: colors.neutralBorder };
    }
  };

  const scheme = getColors();

  if (dot) {
    return (
      <View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: radii.full,
            backgroundColor: scheme.text,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          paddingHorizontal: size === 'sm' ? 6 : 8,
          paddingVertical: size === 'sm' ? 1.5 : 3,
          borderRadius: radii.badge,
          backgroundColor: scheme.bg,
          borderWidth: 1,
          borderColor: scheme.border,
          alignSelf: 'flex-start',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            ...typography.caption,
            fontSize: 11,
            fontWeight: '600',
            color: scheme.text,
            fontVariant: ['tabular-nums'],
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
