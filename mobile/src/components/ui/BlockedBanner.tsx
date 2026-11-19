import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { blockTimeRemaining } from '../../utils/businessRules';

interface Props {
  blockedUntil: string | null;
}

export function BlockedBanner({ blockedUntil }: Props) {
  const { colors, spacing, typography, radii } = useTheme();
  if (!blockedUntil) return null;

  return (
    <View
      style={{
        backgroundColor: colors.dangerBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.danger,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
      }}
      accessibilityRole="alert"
      accessibilityLabel="Account suspension warning"
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.full,
          backgroundColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.heading, fontSize: 14, color: colors.dangerText, fontWeight: '700' }}>
          Account Restricted for 24 Hours
        </Text>
        <Text style={{ ...typography.caption, color: colors.dangerText, marginTop: 2, lineHeight: 16 }}>
          Action locked due to repeated cancellations. Access automatically restores in {blockTimeRemaining(blockedUntil)}.
        </Text>
      </View>
    </View>
  );
}
