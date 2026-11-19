import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services';
import type { UserMode } from '../../types';

export function ModeSwitcher() {
  const { colors, radii, typography, isDark } = useTheme();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const activeMode: UserMode = user?.activeMode || 'SEEKER';

  // Animation driver: 0 for SEEKER, 1 for RECRUITER
  const animValue = useRef(new Animated.Value(activeMode === 'SEEKER' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: activeMode === 'SEEKER' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [activeMode, animValue]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleSelectMode = async (targetMode: UserMode) => {
    if (loading || targetMode === activeMode) return;
    setLoading(true);

    const previousMode = activeMode;
    // Optimistically update store
    if (user) {
      setUser({ ...user, activeMode: targetMode });
    }

    try {
      const res = await userService.switchMode(targetMode);

      if (res && 'error' in res && res.error) {
        // Revert on lock error
        if (user) {
          setUser({ ...user, activeMode: previousMode });
        }
        const pendingDetails =
          res.error.pendingItems && res.error.pendingItems.length > 0
            ? `\n\nPending items:\n${res.error.pendingItems
                .map((item: any) => `• ${item.title || 'Active item'}`)
                .join('\n')}`
            : '';

        Alert.alert(
          'Active Commitments Pending',
          `${res.error.message}${pendingDetails}`,
          [{ text: 'Understood' }]
        );
      }
    } catch (err: any) {
      // Revert on exception
      if (user) {
        setUser({ ...user, activeMode: previousMode });
      }
      Alert.alert(
        'Switch Failed',
        err?.message || 'Could not change operating mode. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const segmentWidth = containerWidth > 0 ? (containerWidth - 6) / 2 : 0;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  return (
    <View
      onLayout={onLayout}
      style={{
        width: '100%',
        height: 46,
        flexDirection: 'row',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radii.md,
        padding: 3,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        position: 'relative',
        alignItems: 'center',
      }}
      accessibilityRole="radiogroup"
      accessibilityLabel="Role mode switcher: Seeker or Recruiter"
    >
      {/* Animated Sliding Pill Indicator */}
      {segmentWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 3,
            top: 3,
            width: segmentWidth,
            height: 38,
            backgroundColor: colors.surface,
            borderRadius: radii.md - 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1.5 },
            shadowOpacity: isDark ? 0.35 : 0.08,
            shadowRadius: 3,
            elevation: 2,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            transform: [{ translateX }],
          }}
        />
      )}

      {/* Seeker Option (Left Half) */}
      <TouchableOpacity
        onPress={() => handleSelectMode('SEEKER')}
        disabled={loading}
        activeOpacity={0.85}
        accessibilityRole="radio"
        accessibilityState={{ selected: activeMode === 'SEEKER' }}
        accessibilityLabel="Seeker Mode. Browse and accept campus gigs."
        style={{
          flex: 1,
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          zIndex: 1,
        }}
      >
        <Ionicons
          name={activeMode === 'SEEKER' ? 'person' : 'person-outline'}
          size={16}
          color={activeMode === 'SEEKER' ? colors.primary : colors.textSecondary}
        />
        <Text
          style={{
            ...typography.body,
            fontSize: 14,
            fontWeight: activeMode === 'SEEKER' ? '700' : '500',
            color: activeMode === 'SEEKER' ? colors.primary : colors.textSecondary,
          }}
          numberOfLines={1}
        >
          Seeker
        </Text>
      </TouchableOpacity>

      {/* Recruiter Option (Right Half) */}
      <TouchableOpacity
        onPress={() => handleSelectMode('RECRUITER')}
        disabled={loading}
        activeOpacity={0.85}
        accessibilityRole="radio"
        accessibilityState={{ selected: activeMode === 'RECRUITER' }}
        accessibilityLabel="Recruiter Mode. Post and manage campus gigs."
        style={{
          flex: 1,
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          zIndex: 1,
        }}
      >
        <Ionicons
          name={activeMode === 'RECRUITER' ? 'briefcase' : 'briefcase-outline'}
          size={16}
          color={activeMode === 'RECRUITER' ? colors.accent : colors.textSecondary}
        />
        <Text
          style={{
            ...typography.body,
            fontSize: 14,
            fontWeight: activeMode === 'RECRUITER' ? '700' : '500',
            color: activeMode === 'RECRUITER' ? colors.accent : colors.textSecondary,
          }}
          numberOfLines={1}
        >
          Recruiter
        </Text>
      </TouchableOpacity>

      {loading && (
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 14,
            zIndex: 2,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}
