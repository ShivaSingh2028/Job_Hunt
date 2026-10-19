import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { blockTimeRemaining } from '../../utils/businessRules';

interface Props {
  blockedUntil: string | null;
}

export function BlockedBanner({ blockedUntil }: Props) {
  const { colors, spacing, typography } = useTheme();
  if (!blockedUntil) return null;
  return (
    <View
      style={{
        backgroundColor: colors.error,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <Ionicons name="lock-closed" size={20} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.headingSm, color: '#fff', fontWeight: '700' }}>
          Account Temporarily Suspended
        </Text>
        <Text style={{ ...typography.bodySm, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
          Temporary restriction due to 3 cancellations. Unlocks in {blockTimeRemaining(blockedUntil)}.
        </Text>
      </View>
    </View>
  );
}
