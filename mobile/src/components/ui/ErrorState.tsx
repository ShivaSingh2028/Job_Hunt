import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: Props) {
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
          width: 72,
          height: 72,
          borderRadius: radii.full,
          backgroundColor: `${colors.error}15`,
          borderWidth: 1,
          borderColor: `${colors.error}30`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Ionicons name="alert-circle-outline" size={38} color={colors.error} />
      </View>
      <Text style={{ ...typography.headingMd, color: colors.text, textAlign: 'center', fontWeight: '700' }}>
        {title}
      </Text>
      {message && (
        <Text style={{ ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 22 }}>
          {message}
        </Text>
      )}
      {onRetry && (
        <Button label="Try Again" onPress={onRetry} variant="outline" size="md" style={{ marginTop: spacing.sm }} />
      )}
    </View>
  );
}
