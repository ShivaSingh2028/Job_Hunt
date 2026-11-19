import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

export interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  iconName = 'search-outline',
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xxxl,
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radii.full,
          backgroundColor: colors.primaryBg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {iconName ? (
          <Ionicons name={iconName} size={32} color={colors.primary} />
        ) : (
          <Text style={{ fontSize: 32 }}>{emoji}</Text>
        )}
      </View>

      <Text
        style={{
          ...typography.heading,
          color: colors.text,
          textAlign: 'center',
          fontWeight: '600',
        }}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={{
            ...typography.secondary,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={{ marginTop: spacing.xs }}
        />
      ) : null}
    </View>
  );
}
