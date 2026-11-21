import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { jobService, userService, authService } from '../../src/services';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { Badge } from '../../src/components/ui/Badge';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { KeyboardScreen } from '../../src/components/ui/KeyboardScreen';
import type { JobType, PayUnit } from '../../src/types';
import { validateShortTermHours } from '../../src/utils/businessRules';

export default function PostJobScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { user } = useAuthStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [type, setType] = useState<JobType>('SHORT_TERM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pay, setPay] = useState('');
  const [payUnit, setPayUnit] = useState<PayUnit>('FIXED');
  const [openings, setOpenings] = useState('1');
  const [isRemote, setIsRemote] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Campus Student Center, Room 204');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [loading, setLoading] = useState(false);
  const isUserBlocked = Boolean(user?.blockedUntil && new Date(user.blockedUntil).getTime() > Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refresh user verification status from server on mount and ensure RECRUITER mode
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_USE_MOCK !== 'true') {
      userService.getMe().then(async (fresh) => {
        if (fresh) {
          useAuthStore.getState().setUser(fresh);
          if (fresh.activeMode !== 'RECRUITER') {
            try {
              const res = await userService.switchMode('RECRUITER');
              if ('error' in res && res.error) {
                const items = res.error.pendingItems || [];
                const itemTitles = items.map((i: any) => `• ${i.title || 'Accepted gig'}`).join('\n');
                Alert.alert(
                  'Seeker Commitments Active',
                  `You have active accepted gigs as a Seeker.\n\n${itemTitles || '• Accepted gig in progress'}\n\nPlease complete or withdraw these commitments in 'My Gigs' before posting a gig.`,
                  [
                    { text: 'Go to My Gigs', onPress: () => router.replace('/(app)/my-jobs' as any) },
                    { text: 'Go Back', style: 'cancel', onPress: () => router.back() },
                  ]
                );
                return;
              }
              useAuthStore.getState().setUser({ ...fresh, activeMode: 'RECRUITER' });
            } catch (err: any) {
              console.warn('[POST-JOB] Auto mode switch error:', err?.message);
            }
          }
        }
      }).catch(() => {});
    }
  }, []);

  const openVerificationGate = (emailToVerify: string) => {
    Alert.alert(
      'Email Verification Required',
      'Please verify your student email address before publishing gigs. A 6-digit confirmation code will be sent to your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify Now',
          onPress: async () => {
            try {
              if (emailToVerify) {
                await authService.resendVerification(emailToVerify);
              }
            } catch {
              // Ignore resend error and continue to OTP screen
            }
            router.push({
              pathname: '/(auth)/verify-otp',
              params: { email: emailToVerify, next: '/(app)/post-job', autoSent: 'true' },
            } as any);
          },
        },
      ]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!pay || isNaN(Number(pay)) || Number(pay) <= 0) e.pay = 'Enter a valid amount';
    if (!openings || isNaN(Number(openings)) || Number(openings) < 1) e.openings = 'Min 1 opening';

    if (type === 'SHORT_TERM') {
      if (!startTime || !endTime) e.time = 'Start and end time required';
      else if (!validateShortTermHours(startTime, endTime)) {
        e.time = 'Short-term gigs cannot exceed 5 hours in duration.';
      }
    } else {
      if (!startDate || !endDate) e.date = 'Start and end date required';
      else if (new Date(startDate) >= new Date(endDate)) {
        e.date = 'End date must be after start date.';
      }
    }

    if (!isRemote && !locationLabel.trim()) {
      e.location = 'On-site jobs require an exact location or room';
    }

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstError = Object.values(e)[0];
      Alert.alert('Required Information', firstError);
      return false;
    }
    return true;
  };

  const handlePost = async () => {
    let currentUser = user;
    if (isUserBlocked) {
      Alert.alert('Account Blocked', 'You cannot post gigs while your account is blocked.');
      return;
    }
    if (process.env.EXPO_PUBLIC_USE_MOCK !== 'true') {
      try {
        const fresh = await userService.getMe();
        if (fresh) {
          useAuthStore.getState().setUser(fresh);
          currentUser = fresh;
        }
      } catch {}
    }

    if (currentUser && !currentUser.isVerified) {
      openVerificationGate(currentUser.email);
      return;
    }

    // Auto ensure mode is RECRUITER before posting
    if (currentUser && currentUser.activeMode !== 'RECRUITER') {
      try {
        const res = await userService.switchMode('RECRUITER');
        if ('error' in res && res.error) {
          const items = res.error.pendingItems || [];
          const itemTitles = items.map((i: any) => `• ${i.title || 'Accepted gig'}`).join('\n');
          Alert.alert(
            'Cannot Post Gig',
            `You cannot publish gigs while you have active commitments as a Seeker.\n\nActive Commitments:\n${itemTitles || '• Accepted gig in progress'}\n\nPlease complete or withdraw these commitments in 'My Gigs' before posting.`,
            [
              { text: 'Go to My Gigs', onPress: () => router.replace('/(app)/my-jobs' as any) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
        useAuthStore.getState().setUser({ ...currentUser, activeMode: 'RECRUITER' });
        currentUser = { ...currentUser, activeMode: 'RECRUITER' };
      } catch (err: any) {
        Alert.alert('Recruiter Mode Required', err?.message || 'Please switch to Recruiter mode before posting a gig.');
        return;
      }
    }

    if (!validate()) return;
    setLoading(true);
    try {
      await jobService.createJob({
        type,
        title: title.trim(),
        description: description.trim(),
        pay: Number(pay),
        payUnit,
        openings: Number(openings),
        isRemote: type === 'SHORT_TERM' ? false : isRemote,
        location: isRemote ? undefined : {
          lat: currentUser?.location?.lat ?? 28.6145,
          lng: currentUser?.location?.lng ?? 77.2085,
          label: locationLabel.trim(),
        },
        startDate,
        endDate: type === 'SHORT_TERM' ? startDate : endDate,
        startTime: type === 'SHORT_TERM' ? startTime : undefined,
        endTime: type === 'SHORT_TERM' ? endTime : undefined,
      });

      Alert.alert(
        'Listing Published',
        'Your gig is live and visible to students within campus radius.',
        [{ text: 'View My Posts', onPress: () => router.replace('/(app)/my-jobs') }]
      );
    } catch (e: any) {
      if (e?.code === 'USER_NOT_VERIFIED') {
        openVerificationGate(currentUser?.email || user?.email || '');
      } else if (e?.code === 'USER_BLOCKED') {
        const timeStr = e?.blockedUntil ? new Date(e.blockedUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        Alert.alert(
          'Account Blocked',
          `You are blocked${timeStr ? ` until ${timeStr}` : ''}. You can view gigs but cannot accept or post.`
        );
        if (user && e?.blockedUntil) {
          useAuthStore.getState().setUser({ ...user, isBlocked: true, blockedUntil: e.blockedUntil });
        }
      } else {
        Alert.alert('Post Failed', e?.message || 'Could not post gig.');
      }
    } finally {
      setLoading(false);
    }
  };

  const payUnitOptions: { label: string; value: PayUnit }[] =
    type === 'SHORT_TERM'
      ? [
          { label: 'Fixed ₹', value: 'FIXED' },
          { label: '₹ / hr', value: 'PER_HOUR' },
        ]
      : [
          { label: '₹ / mo', value: 'PER_MONTH' },
          { label: '₹ / hr', value: 'PER_HOUR' },
          { label: 'Fixed ₹', value: 'FIXED' },
        ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Navigation Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel job creation"
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ ...typography.heading, color: colors.text, fontWeight: '700' }}>
          Publish a Gig
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardScreen contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 }}>
        {/* Step 1: Gig Type Selection */}
        <Card variant="elevated" style={{ gap: spacing.md, padding: spacing.cardPadding }}>
          <SectionHeader
            title="Gig Format"
            subtitle="Choose between quick on-demand campus tasks or ongoing engagements."
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => {
                setType('SHORT_TERM');
                setIsRemote(false);
                setPayUnit('FIXED');
              }}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === 'SHORT_TERM' }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: type === 'SHORT_TERM' ? colors.primaryBg : colors.surfaceSecondary,
                borderWidth: 1.5,
                borderColor: type === 'SHORT_TERM' ? colors.primary : colors.borderSubtle,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Ionicons
                  name="flash"
                  size={20}
                  color={type === 'SHORT_TERM' ? colors.primary : colors.textSecondary}
                />
                {type === 'SHORT_TERM' && (
                  <Badge label="Active" variant="primary" size="sm" />
                )}
              </View>
              <Text
                style={{
                  ...typography.heading,
                  fontSize: 16,
                  color: type === 'SHORT_TERM' ? colors.primary : colors.text,
                  fontWeight: '700',
                }}
              >
                Short-Term
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                On-site · Up to 5 hours max
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setType('LONG_TERM');
                setPayUnit('PER_MONTH');
              }}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === 'LONG_TERM' }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: type === 'LONG_TERM' ? colors.primaryBg : colors.surfaceSecondary,
                borderWidth: 1.5,
                borderColor: type === 'LONG_TERM' ? colors.primary : colors.borderSubtle,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={type === 'LONG_TERM' ? colors.primary : colors.textSecondary}
                />
                {type === 'LONG_TERM' && (
                  <Badge label="Active" variant="primary" size="sm" />
                )}
              </View>
              <Text
                style={{
                  ...typography.heading,
                  fontSize: 16,
                  color: type === 'LONG_TERM' ? colors.primary : colors.text,
                  fontWeight: '700',
                }}
              >
                Long-Term
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                1–2 months · Remote / On-site
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Step 2: Role Details */}
        <Card variant="elevated" style={{ gap: spacing.md, padding: spacing.cardPadding }}>
          <SectionHeader
            title="Role Details"
            subtitle="Clearly define what help is needed and required openings."
          />
          <TextField
            label="Gig Title"
            placeholder="e.g. Science Lab Assistant, Event Coordinator"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            leftIcon={<Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} />}
          />

          <TextField
            label="Description & Responsibilities"
            placeholder="Specify key tasks, arrival instructions, and prerequisites..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
            helperText="Clear details attract dependable, qualified applicants."
          />

          <TextField
            label="Required Student Openings"
            placeholder="1"
            value={openings}
            onChangeText={setOpenings}
            keyboardType="number-pad"
            error={errors.openings}
            leftIcon={<Ionicons name="people-outline" size={18} color={colors.textSecondary} />}
          />
        </Card>

        {/* Step 3: Compensation */}
        <Card variant="elevated" style={{ gap: spacing.md, padding: spacing.cardPadding }}>
          <SectionHeader
            title="Compensation"
            subtitle="Transparent pay structure for students upon task completion."
          />
          <TextField
            label="Pay Amount"
            placeholder="e.g. 500"
            value={pay}
            onChangeText={setPay}
            keyboardType="numeric"
            error={errors.pay}
            leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textSecondary} />}
          />

          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
              Payment frequency / unit
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {payUnitOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={payUnit === opt.value}
                  onPress={() => setPayUnit(opt.value)}
                  size="md"
                />
              ))}
            </View>
          </View>
        </Card>

        {/* Step 4: Schedule & Location */}
        <Card variant="elevated" style={{ gap: spacing.md, padding: spacing.cardPadding }}>
          <SectionHeader
            title="Schedule & Location"
            subtitle="Where and when the student will perform the task."
          />

          {type === 'SHORT_TERM' ? (
            <View style={{ gap: spacing.md }}>
              <TextField
                label="Date of Gig"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                helperText="Must occur on a single day (max 5 hrs)"
                leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Start Time"
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="10:00"
                    leftIcon={<Ionicons name="time-outline" size={18} color={colors.textSecondary} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="End Time"
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="13:00"
                    leftIcon={<Ionicons name="time-outline" size={18} color={colors.textSecondary} />}
                  />
                </View>
              </View>
              {errors.time && (
                <Text style={{ ...typography.caption, color: colors.dangerText }}>
                  {errors.time}
                </Text>
              )}
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Start Date"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="End Date"
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              {errors.date && (
                <Text style={{ ...typography.caption, color: colors.dangerText }}>
                  {errors.date}
                </Text>
              )}

              {/* Remote toggle for long-term */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSecondary,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="globe-outline" size={16} color={colors.text} />
                    <Text style={{ ...typography.heading, fontSize: 15, color: colors.text, fontWeight: '600' }}>
                      Remote Project
                    </Text>
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                    Can be completed remotely from anywhere.
                  </Text>
                </View>
                <Switch
                  value={isRemote}
                  onValueChange={setIsRemote}
                  trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {!isRemote && (
            <TextField
              label="Campus Location / Building & Room"
              placeholder="e.g. North Campus, Block C, Room 201"
              value={locationLabel}
              onChangeText={setLocationLabel}
              error={errors.location}
              helperText="Exact room is kept private until student acceptance is confirmed."
              leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />}
            />
          )}
        </Card>

        {/* Submit Action */}
        <Button
          label={isUserBlocked ? 'Account Blocked' : 'Publish Gig'}
          onPress={handlePost}
          loading={loading}
          disabled={isUserBlocked || loading}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
        />
      </KeyboardScreen>
    </SafeAreaView>
  );
}
