import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  inline?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  style,
  inline = false,
}: ErrorStateProps) {
  const { colors, typography, spacing, radii } = useTheme();

  if (inline) {
    return (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.dangerBg,
            borderColor: colors.dangerBorder,
            borderWidth: 1,
            borderRadius: radii.md,
            padding: spacing.md,
            gap: spacing.sm,
          },
          style,
        ]}
      >
        <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.caption, color: colors.dangerText, fontWeight: '600' }}>
            {title}
          </Text>
          {message && (
            <Text style={{ ...typography.caption, color: colors.dangerText, opacity: 0.9 }}>
              {message}
            </Text>
          )}
        </View>
        {onRetry && (
          <Button
            label={retryLabel}
            onPress={onRetry}
            variant="destructive"
            size="sm"
          />
        )}
      </View>
    );
  }

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
          backgroundColor: colors.dangerBg,
          borderWidth: 1,
          borderColor: colors.dangerBorder,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
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

      {message ? (
        <Text
          style={{
            ...typography.secondary,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
      ) : null}

      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="md"
          style={{ marginTop: spacing.xs }}
        />
      ) : null}
    </View>
  );
}
