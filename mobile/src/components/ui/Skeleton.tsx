import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}: SkeletonProps) {
  const { colors, radii } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? radii.sm,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonJobCard() {
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        padding: spacing.cardPadding,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={90} height={24} borderRadius={radii.chip} />
        <Skeleton width={60} height={16} />
      </View>
      <Skeleton width="75%" height={20} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="60%" height={14} />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
        <Skeleton width={80} height={18} />
        <Skeleton width={100} height={18} />
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  const { spacing, radii } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
      }}
    >
      <Skeleton width={40} height={40} borderRadius={radii.full} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={20} height={20} borderRadius={radii.xs} />
    </View>
  );
}
