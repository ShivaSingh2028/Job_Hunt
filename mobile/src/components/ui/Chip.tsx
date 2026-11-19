import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ChipVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  variant = 'neutral',
  selected = false,
  onPress,
  icon,
  style,
  textStyle,
  size = 'md',
}: ChipProps) {
  const { colors, radii, typography } = useTheme();

  const getColors = () => {
    if (selected) {
      return {
        bg: colors.primary,
        border: colors.primary,
        text: '#FFFFFF',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          bg: colors.primaryBg,
          border: colors.primaryLight,
          text: colors.primary,
        };
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.successBorder,
          text: colors.successText,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: colors.warningBorder,
          text: colors.warningText,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          border: colors.dangerBorder,
          text: colors.dangerText,
        };
      case 'info':
        return {
          bg: colors.infoBg,
          border: colors.infoBorder,
          text: colors.infoText,
        };
      case 'neutral':
      default:
        return {
          bg: colors.neutralBg,
          border: colors.neutralBorder,
          text: colors.neutralText,
        };
    }
  };

  const scheme = getColors();
  const isInteractive = !!onPress;
  const isSm = size === 'sm';

  const content = (
    <>
      {icon}
      <Text
        style={[
          isSm
            ? { ...typography.caption, fontSize: 11 }
            : { ...typography.secondary, fontSize: 13, fontWeight: '500' },
          { color: scheme.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </>
  );

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: isSm ? 8 : 12,
    paddingVertical: isSm ? 4 : 6,
    minHeight: isSm ? 26 : 34,
    borderRadius: radii.chip,
    backgroundColor: scheme.bg,
    borderWidth: 1,
    borderColor: scheme.border,
    alignSelf: 'flex-start',
  };

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        style={[containerStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
}
