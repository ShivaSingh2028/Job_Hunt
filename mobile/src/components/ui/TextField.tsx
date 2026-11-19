import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const TextField = React.forwardRef<any, TextFieldProps>(function TextField(
  {
    label,
    helperText,
    error,
    containerStyle,
    inputStyle,
    leftIcon,
    rightIcon,
    isPassword = false,
    secureTextEntry,
    style,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const { colors, radii, typography, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isActuallyPassword = isPassword || secureTextEntry;
  const isSecured = isActuallyPassword && !showPassword;

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label && (
        <Text
          style={{
            ...typography.caption,
            color: error ? colors.danger : focused ? colors.primary : colors.textSecondary,
            fontWeight: '600',
            textTransform: 'none',
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radii.input,
          borderWidth: focused ? 2 : 1.5,
          borderColor,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          gap: spacing.sm,
        }}
      >
        {leftIcon}

        <TextInput
          ref={ref}
          style={[
            {
              flex: 1,
              ...typography.body,
              color: colors.text,
              minHeight: 48,
              paddingVertical: 10,
            },
            inputStyle,
            style as any,
          ]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecured}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {isActuallyPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : (
          rightIcon
        )}
      </View>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={{ ...typography.caption, color: colors.danger }}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

// Backwards compatibility alias
export const Input = TextField;
