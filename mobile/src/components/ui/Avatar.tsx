import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name?: string;
  source?: ImageSourcePropType | { uri: string };
  size?: AvatarSize;
  isOnline?: boolean;
  isVerified?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  name,
  source,
  size = 'md',
  isOnline,
  isVerified,
  style,
}: AvatarProps) {
  const { colors, radii, typography } = useTheme();
  const [imageError, setImageError] = useState(false);

  const sizeDimensions: Record<AvatarSize, { dimension: number; fontSize: number; badgeSize: number }> = {
    sm: { dimension: 32, fontSize: 12, badgeSize: 10 },
    md: { dimension: 40, fontSize: 15, badgeSize: 12 },
    lg: { dimension: 56, fontSize: 20, badgeSize: 16 },
    xl: { dimension: 72, fontSize: 26, badgeSize: 20 },
  };

  const { dimension, fontSize, badgeSize } = sizeDimensions[size];

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasImage = !!source && !imageError;

  return (
    <View style={[{ width: dimension, height: dimension }, style]}>
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: radii.full,
          backgroundColor: colors.primaryBg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <Image
            source={source}
            onError={() => setImageError(true)}
            style={{ width: dimension, height: dimension, borderRadius: radii.full }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={{
              ...typography.caption,
              fontSize,
              fontWeight: '700',
              color: colors.primary,
            }}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>

      {isVerified ? (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: radii.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: colors.surface,
          }}
        >
          <Ionicons name="checkmark" size={badgeSize * 0.75} color="#FFFFFF" />
        </View>
      ) : isOnline ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: badgeSize,
            height: badgeSize,
            borderRadius: radii.full,
            backgroundColor: colors.success,
            borderWidth: 1.5,
            borderColor: colors.surface,
          }}
        />
      ) : null}
    </View>
  );
}
