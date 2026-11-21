import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  blockedUntil: string | null;
}

export function BlockedBanner({ blockedUntil }: Props) {
  const { colors, spacing, typography, radii } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!blockedUntil) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);

  if (!blockedUntil) return null;
  const expiry = new Date(blockedUntil).getTime();
  if (expiry <= now) return null;

  const formattedTime = new Date(blockedUntil).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

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
        <Text style={{ ...typography.caption, color: colors.dangerText, fontWeight: '600', lineHeight: 18 }}>
          You are blocked until {formattedTime}. You can view gigs but cannot accept or post.
        </Text>
      </View>
    </View>
  );
}
