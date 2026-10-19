import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, containerStyle, leftIcon, rightIcon, style, ...props }: InputProps) {
  const { colors, radii, typography, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label && (
        <Text style={{ ...typography.label, color: colors.textSecondary }}>{label}</Text>
      )}
      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bgSecondary,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: error ? colors.error : focused ? colors.primary : colors.border,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
          minHeight: 48,
        },
      ]}>
        {leftIcon}
        <TextInput
          style={[
            { flex: 1, ...typography.bodyLg, color: colors.text, paddingVertical: 12 },
            style as any,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon}
      </View>
      {error && <Text style={{ ...typography.bodySm, color: colors.error }}>{error}</Text>}
    </View>
  );
}
