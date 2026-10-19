import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services';
import type { UserMode } from '../../types';

export function ModeSwitcher() {
  const { colors, radii } = useTheme();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const isSeeker = user?.activeMode === 'SEEKER';

  const handleToggle = async () => {
    if (loading) return;
    const targetMode: UserMode = isSeeker ? 'RECRUITER' : 'SEEKER';
    setLoading(true);
    // Optimistically update store
    if (user) {
      setUser({ ...user, activeMode: targetMode });
    }
    try {
      await userService.switchMode(targetMode);
    } catch {
      // Revert on failure
      if (user) {
        setUser({ ...user, activeMode: isSeeker ? 'SEEKER' : 'RECRUITER' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Switch mode. Currently in ${isSeeker ? 'Seeker' : 'Recruiter'} mode.`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: isSeeker ? colors.primaryLight : `${colors.accent}18`,
        borderRadius: radii.full,
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderWidth: 1.5,
        borderColor: isSeeker ? colors.primary : colors.accent,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isSeeker ? colors.primary : colors.accent} />
      ) : (
        <Ionicons
          name={isSeeker ? 'compass' : 'briefcase'}
          size={15}
          color={isSeeker ? colors.primary : colors.accent}
        />
      )}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: isSeeker ? colors.primary : colors.accent,
          letterSpacing: 0.4,
        }}
      >
        {isSeeker ? 'SEEKER' : 'RECRUITER'}
      </Text>
      <Ionicons
        name="swap-horizontal"
        size={14}
        color={isSeeker ? colors.primary : colors.accent}
      />
    </TouchableOpacity>
  );
}
