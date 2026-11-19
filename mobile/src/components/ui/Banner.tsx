import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export type BannerVariant = 'success' | 'warning' | 'danger' | 'info' | 'offline';

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function Banner({
  variant = 'info',
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  style,
}: BannerProps) {
  const { colors, radii, typography, spacing } = useTheme();

  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.successBorder,
          text: colors.successText,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: colors.warningBorder,
          text: colors.warningText,
          icon: 'warning-outline' as const,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          border: colors.dangerBorder,
          text: colors.dangerText,
          icon: 'alert-circle-outline' as const,
        };
      case 'offline':
        return {
          bg: colors.warningBg,
          border: colors.warningBorder,
          text: colors.warningText,
          icon: 'cloud-offline-outline' as const,
        };
      case 'info':
      default:
        return {
          bg: colors.infoBg,
          border: colors.infoBorder,
          text: colors.infoText,
          icon: 'information-circle-outline' as const,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: config.bg,
          borderWidth: 1,
          borderColor: config.border,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.text} />

      <View style={{ flex: 1 }}>
        {title ? (
          <Text
            style={{
              ...typography.caption,
              color: config.text,
              fontWeight: '600',
              marginBottom: 1,
            }}
          >
            {title}
          </Text>
        ) : null}
        <Text
          style={{
            ...typography.secondary,
            fontSize: 13,
            color: config.text,
            lineHeight: 18,
          }}
        >
          {message}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              ...typography.caption,
              color: config.text,
              fontWeight: '700',
              textDecorationLine: 'underline',
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={config.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export const Toast = Banner;
