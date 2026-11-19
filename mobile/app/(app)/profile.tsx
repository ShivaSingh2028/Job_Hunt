import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useAuth } from '../../src/hooks/useAuth';
import { ModeSwitcher } from '../../src/components/shared/ModeSwitcher';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { blockTimeRemaining } from '../../src/utils/businessRules';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark, toggleTheme } = useTheme();
  const { user } = useAuthStore();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ ...typography.title, fontSize: 24, color: colors.text, fontWeight: '700' }}>
          Profile & Account
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-width Mode Switcher */}
        <ModeSwitcher />
        {/* Profile Identity Card */}
        <Card variant="elevated" style={{ alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
          <Avatar
            name={user?.name || 'User'}
            size="lg"
            isVerified={user?.isVerified}
          />

          <View style={{ alignItems: 'center', gap: 2, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ ...typography.title, fontSize: 22, color: colors.text, fontWeight: '700' }}>
                {user?.name}
              </Text>
              {user?.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </View>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>
              {user?.email}
            </Text>
            {user?.phone && (
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                {user.phone}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Badge
              label={user?.activeMode === 'SEEKER' ? 'Student Seeker' : 'Campus Recruiter'}
              variant="primary"
            />
            <Badge
              label={user?.isVerified ? 'Verified Student' : 'Unverified'}
              variant={user?.isVerified ? 'success' : 'warning'}
            />
          </View>
        </Card>

        {/* Verification Status Card */}
        <Card
          variant="outlined"
          style={{
            backgroundColor: user?.isVerified ? colors.successBg : colors.warningBg,
            borderColor: user?.isVerified ? colors.success : colors.warning,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <Ionicons
              name={user?.isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={user?.isVerified ? colors.successText : colors.warningText}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...typography.heading,
                  fontSize: 15,
                  fontWeight: '700',
                  color: user?.isVerified ? colors.successText : colors.warningText,
                }}
              >
                {user?.isVerified ? 'Account Verified' : 'Email Verification Required'}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: user?.isVerified ? colors.successText : colors.warningText,
                  marginTop: 2,
                }}
              >
                {user?.isVerified
                  ? 'Full campus access unlocked. You can post and claim gigs.'
                  : 'Verify your email to unlock one-tap gig confirmations.'}
              </Text>
            </View>
          </View>

          {!user?.isVerified && (
            <Button
              label="Verify"
              size="sm"
              variant="primary"
              onPress={() => router.push('/(auth)/verify-otp' as any)}
            />
          )}
        </Card>

        {/* Reliability Score & Strikes */}
        <Card variant="elevated" style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={user?.isBlocked ? colors.dangerText : colors.primary}
              />
              <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '700' }}>
                Reliability Standing
              </Text>
            </View>
            <Badge
              label={`${user?.cancellationCount ?? 0} / 3 Strikes`}
              variant={(user?.cancellationCount ?? 0) >= 2 ? 'danger' : 'neutral'}
            />
          </View>

          {user?.isBlocked ? (
            <View style={{ backgroundColor: colors.dangerBg, padding: spacing.md, borderRadius: radii.md }}>
              <Text style={{ ...typography.body, color: colors.dangerText, fontWeight: '600' }}>
                Account temporarily suspended due to 3 cancellations. Reopens in {blockTimeRemaining(user.blockedUntil)}.
              </Text>
            </View>
          ) : (
            <Text style={{ ...typography.caption, color: colors.textSecondary, lineHeight: 18 }}>
              Cancelling accepted gigs shortly before start times impacts peer trust. Members with 3 strikes face a temporary 24-hour restriction.
            </Text>
          )}
        </Card>

        {/* Campus Location */}
        <Card variant="elevated" style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
            CAMPUS LOCATION
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.heading, fontSize: 15, color: colors.text, fontWeight: '600' }}>
                  {user?.location?.label || 'Campus not selected'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                  Search radius: 5 km zone
                </Text>
              </View>
            </View>
            <Button
              label="Change"
              size="sm"
              variant="outline"
              onPress={() => router.push('/(auth)/location-picker')}
            />
          </View>
        </Card>

        {/* Preferences & Settings */}
        <Card variant="elevated" style={{ overflow: 'hidden', padding: 0 }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
              PREFERENCES
            </Text>
          </View>

          {/* Dark Mode Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="moon-outline" size={20} color={colors.text} />
              <Text style={{ ...typography.body, color: colors.text, fontWeight: '500' }}>
                Dark Appearance
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Saved Gigs Row */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/saved-jobs')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="bookmark-outline" size={20} color={colors.text} />
              <Text style={{ ...typography.body, color: colors.text, fontWeight: '500' }}>
                Saved Gigs
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Design System Preview (Dev only) */}
          {__DEV__ && (
            <TouchableOpacity
              onPress={() => router.push('/design-preview' as any)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>
                  Design System Preview (Dev)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Sign Out Button */}
        <Button
          label="Sign Out"
          variant="destructive"
          size="lg"
          fullWidth
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.dangerText} />}
        />

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            JobHunt · Campus Gig Network · Production Edition
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
