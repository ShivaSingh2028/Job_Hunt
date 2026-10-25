import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useAuth } from '../../src/hooks/useAuth';
import { ModeSwitcher } from '../../src/components/shared/ModeSwitcher';
import { blockTimeRemaining } from '../../src/utils/businessRules';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark, toggleTheme } = useTheme();
  const { user, setUser } = useAuthStore();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of JobHunt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JH';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Profile Card */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.primary,
          }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary }}>
              {getInitials(user?.name)}
            </Text>
          </View>

          <Text style={{ ...typography.headingLg, color: colors.text, fontWeight: '800' }}>
            {user?.name}
          </Text>
          <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>
            {user?.email}
          </Text>
          {user?.phone && (
            <Text style={{ ...typography.bodySm, color: colors.textMuted }}>{user.phone}</Text>
          )}

          <View style={{ marginTop: spacing.xs }}>
            <ModeSwitcher />
          </View>
        </View>

        {/* Verification Status Card */}
        <View style={{
          backgroundColor: user?.isVerified ? `${colors.success}10` : `${colors.warning}15`,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: user?.isVerified ? `${colors.success}40` : `${colors.warning}40`,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: user?.isVerified ? `${colors.success}20` : `${colors.warning}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons
                name={user?.isVerified ? "shield-checkmark" : "shield-outline"}
                size={22}
                color={user?.isVerified ? colors.success : colors.warning}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ ...typography.headingSm, fontWeight: '700', color: colors.text }}>
                  {user?.isVerified ? 'College ID Verified' : 'ID Not Verified'}
                </Text>
                {user?.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
              </View>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                {user?.isVerified
                  ? 'Authenticated student account. Full access unlocked.'
                  : 'Verify with college email OTP to post and accept jobs.'}
              </Text>
            </View>
          </View>

          {!user?.isVerified && (
            <TouchableOpacity
              onPress={() => router.push('/(auth)/verify-otp' as any)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radii.md,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cancellation Record & Reliability Score */}
        <View style={{
          backgroundColor: user?.isBlocked ? colors.error : colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 6,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={user?.isBlocked ? '#fff' : colors.primary}
              />
              <Text style={{
                ...typography.headingSm,
                fontWeight: '700',
                color: user?.isBlocked ? '#fff' : colors.text,
              }}>
                Reliability Record: {user?.cancellationCount ?? 0} / 3 Strikes
              </Text>
            </View>
            {user?.cancellationCount === 2 && !user.isBlocked && (
              <View style={{ backgroundColor: `${colors.warning}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full }}>
                <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '700' }}>1 Strike Left</Text>
              </View>
            )}
          </View>

          {user?.isBlocked ? (
            <Text style={{ ...typography.bodySm, color: 'rgba(255,255,255,0.9)' }}>
              Account suspended for 24h due to 3 cancellations. Reopens in: {blockTimeRemaining(user.blockedUntil)}
            </Text>
          ) : (
            <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 18 }}>
              Maintaining commitments preserves high platform standing. Accounts with 3 consecutive cancellations face a temporary 24-hour restriction.
            </Text>
          )}
        </View>

        {/* Location setting */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        }}>
          <Text style={{ ...typography.label, color: colors.textMuted, letterSpacing: 0.5 }}>CAMPUS LOCATION</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '600' }}>
                  {user?.location?.label || 'Not set'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                  Radius filter: 5 km zone
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/location-picker')}
              style={{
                backgroundColor: colors.primaryLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radii.md,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences / Settings */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}>
          <Text style={{ ...typography.label, color: colors.textMuted, margin: spacing.md, letterSpacing: 0.5 }}>
            PREFERENCES
          </Text>

          {/* Dark mode switch */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="moon-outline" size={18} color={colors.text} />
              <Text style={{ ...typography.bodyMd, color: colors.text, fontWeight: '500' }}>Dark Appearance</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {/* Saved gigs link */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/saved-jobs')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="bookmark-outline" size={18} color={colors.text} />
              <Text style={{ ...typography.bodyMd, color: colors.text, fontWeight: '500' }}>Saved Gigs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Developer & Demonstration Suite */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
            <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Platform Demonstration Suite</Text>
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            Test state conditions and business rule enforcement directly:
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => {
                if (user) {
                  setUser({ ...user, cancellationCount: 2, isBlocked: false, blockedUntil: null });
                  Alert.alert('Notice Simulation', 'Account updated to 2 cancellation strikes. Next warning banner is now active.');
                }
              }}
              style={{
                backgroundColor: `${colors.warning}15`,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: `${colors.warning}40`,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Ionicons name="warning-outline" size={13} color={colors.warning} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning }}>
                Simulate 2 Strikes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (user) {
                  const blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                  setUser({ ...user, cancellationCount: 3, isBlocked: true, blockedUntil });
                  Alert.alert('Suspension Simulation', 'Account updated to suspended state. Action restrictions are now active.');
                }
              }}
              style={{
                backgroundColor: `${colors.error}15`,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: `${colors.error}40`,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Ionicons name="lock-closed-outline" size={13} color={colors.error} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>
                Simulate 24h Lock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (user) {
                  setUser({ ...user, cancellationCount: 0, isBlocked: false, blockedUntil: null });
                  Alert.alert('State Cleared', 'Strikes reset to 0 and account returned to full good standing.');
                }
              }}
              style={{
                backgroundColor: `${colors.success}15`,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: `${colors.success}40`,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                Reset to Good Standing
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: `${colors.error}10`,
            borderRadius: radii.lg,
            padding: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            borderWidth: 1,
            borderColor: `${colors.error}30`,
            marginTop: spacing.xs,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Version Footer */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>JobHunt • Campus Gig Platform • Production v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
