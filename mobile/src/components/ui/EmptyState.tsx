import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface Props {
  iconName?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName = 'search-outline',
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xxl,
        marginVertical: spacing.xl,
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: radii.full,
          backgroundColor: colors.bgSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {iconName ? (
          <Ionicons name={iconName} size={36} color={colors.textSecondary} />
        ) : (
          <Text style={{ fontSize: 36 }}>{emoji}</Text>
        )}
      </View>
      <Text
        style={{
          ...typography.headingMd,
          color: colors.text,
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            ...typography.bodyMd,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 22,
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="md"
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
}
