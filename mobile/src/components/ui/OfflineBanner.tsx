import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export function OfflineBanner() {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.warning,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs + 2,
      }}
    >
      <Ionicons name="cloud-offline-outline" size={15} color="#000" />
      <Text style={{ ...typography.bodySm, color: '#000', fontWeight: '600' }}>
        No internet connection. Operating offline.
      </Text>
    </View>
  );
}
