import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = true,
  onPress,
  destructive = false,
  style,
  titleStyle,
  subtitleStyle,
  disabled = false,
}: ListItemProps) {
  const { colors, typography, spacing } = useTheme();

  const isInteractive = !!onPress && !disabled;

  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          gap: spacing.md,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {leftIcon}

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[
            {
              ...typography.body,
              fontWeight: '500',
              color: destructive ? colors.dangerText : colors.text,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              {
                ...typography.caption,
                color: colors.textSecondary,
              },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement}

      {showChevron && isInteractive && !rightElement ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
