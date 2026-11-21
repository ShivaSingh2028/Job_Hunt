import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAuthStore } from '../../../src/store/authStore';
import { useJobStore } from '../../../src/store/jobStore';
import { jobService, chatService } from '../../../src/services';
import { Button } from '../../../src/components/ui/Button';
import { Chip } from '../../../src/components/ui/Chip';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';
import { SkeletonJobCard } from '../../../src/components/ui/Skeleton';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ReportDialog } from '../../../src/components/shared/ReportDialog';
import type { Job } from '../../../src/types';
import { formatPay, formatDistance, formatDate, formatTime } from '../../../src/utils/businessRules';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow, isDark } = useTheme();
  const { user, setUser } = useAuthStore();
  const { updateJob } = useJobStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobService.getJobById(id);
      setJob(data);
      if (user?.activeMode === 'SEEKER') {
        const apps = await jobService.getMyApplications().catch(() => []);
        const accepted = apps.some(
          (a) => a.job.id === id && (a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS')
        );
        setIsAccepted(accepted);
      } else {
        setIsAccepted(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load gig details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAccept = async () => {
    if (!job) return;
    if (user && !user.isVerified) {
      Alert.alert(
        'Email Verification Required',
        'Please verify your email address before accepting gigs.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/(auth)/verify-otp' as any) },
        ]
      );
      return;
    }
    if (user?.isBlocked) {
      Alert.alert('Account Blocked', 'You cannot accept gigs while your account is blocked.');
      return;
    }
    if (user?.activeMode !== 'SEEKER') {
      Alert.alert('Seeker Mode Required', 'Please switch your active mode to Seeker to accept gigs.');
      return;
    }
    if (job.postedBy.id === user.id) {
      Alert.alert('Notice', 'You cannot accept your own job post.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await jobService.acceptJob(job.id);
      setIsAccepted(true);
      setJob(res.job);
      Alert.alert(
        'Gig Confirmed',
        'You have successfully accepted this gig. The exact work location and reporting instructions are now unlocked below.',
        [{ text: 'View Details' }]
      );
    } catch (err: any) {
      const code = err?.code;
      if (code === 'ALREADY_TAKEN') {
        Alert.alert('Gig Filled', 'Another candidate has claimed the last opening for this gig.', [
          { text: 'Return to Feed', onPress: () => router.back() },
        ]);
      } else if (code === 'TIME_CONFLICT') {
        Alert.alert(
          'Schedule Conflict',
          'You already have another short-term gig confirmed during these overlapping hours.'
        );
      } else if (code === 'OWN_JOB') {
        Alert.alert('Notice', 'You cannot accept your own job listing.');
      } else if (code === 'USER_BLOCKED') {
        const timeStr = err?.blockedUntil ? new Date(err.blockedUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        Alert.alert(
          'Account Blocked',
          `You are blocked${timeStr ? ` until ${timeStr}` : ''}. You can view gigs but cannot accept or post.`
        );
        if (user && err?.blockedUntil) {
          setUser({ ...user, isBlocked: true, blockedUntil: err.blockedUntil });
        }
      } else {
        Alert.alert('Unable to Accept', err?.message || 'Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAcceptance = async () => {
    if (!job) return;
    Alert.alert(
      'Withdraw Confirmation',
      'Are you sure you want to withdraw? The opening will be reopened for other students.\n\nNote: After 3 cancellations, your account will be temporarily blocked for 24 hours.',
      [
        { text: 'Keep Gig', style: 'cancel' },
        {
          text: 'Confirm Withdrawal',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await jobService.cancelAcceptance(job.id);
              setIsAccepted(false);
              if (user) {
                setUser({
                  ...user,
                  cancellationCount: res.cancellationCount,
                  isBlocked: res.isBlocked,
                  blockedUntil: res.blockedUntil,
                });
              }
              if (res.isBlocked) {
                Alert.alert(
                  'Account Blocked',
                  'You have accumulated 3 cancellations. Your account is temporarily suspended for 24 hours.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else if (res.warning) {
                Alert.alert('Notice', res.warning, [{ text: 'OK' }]);
              } else {
                Alert.alert('Withdrawal Confirmed', 'Your acceptance has been cancelled.');
              }
              fetchDetail();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not cancel.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      const res = await chatService.getOrCreateJobChat(job.id);
      router.push({
        pathname: '/(app)/chat/[id]',
        params: {
          id: res.conversationId,
          jobTitle: job.title,
          peerName: job.postedBy.name,
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Chat Error', err?.message || 'Could not open conversation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!job) return;
    try {
      const res = await jobService.saveJob(job.id);
      setJob((j) => (j ? { ...j, isSaved: res.isSaved } : null));
      updateJob(job.id, { isSaved: res.isSaved });
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <SkeletonJobCard />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ErrorState message={error || 'Job not found'} onRetry={fetchDetail} />
      </SafeAreaView>
    );
  }

  const isOwnJob = job.postedBy.id === user?.id;
  const remainingSlots = Math.max(0, job.openings - job.filledCount);
  const isShortTerm = job.type === 'SHORT_TERM';
  const isUserBlocked = Boolean(user?.blockedUntil && new Date(user.blockedUntil).getTime() > Date.now());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Navbar */}
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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={{ ...typography.secondary, color: colors.text, fontWeight: '600' }}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleToggleSave}
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.full,
              backgroundColor: job.isSaved ? colors.primaryBg : colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: job.isSaved ? colors.primaryLight : colors.borderSubtle,
            }}
            activeOpacity={0.7}
            accessibilityLabel="Save gig"
          >
            <Ionicons
              name={job.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={job.isSaved ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowReport(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.full,
              backgroundColor: colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
            activeOpacity={0.7}
            accessibilityLabel="Report listing"
          >
            <Ionicons name="flag-outline" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type & Distance Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            size="sm"
            label={isShortTerm ? 'Short-term Gig' : 'Long-term Role'}
            variant={isShortTerm ? 'warning' : 'info'}
            icon={
              <Ionicons
                name={isShortTerm ? 'flash-outline' : 'calendar-outline'}
                size={12}
                color={isShortTerm ? colors.warningText : colors.infoText}
              />
            }
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={job.isRemote ? 'globe-outline' : 'location-outline'}
              size={14}
              color={colors.textMuted}
            />
            <Text
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {job.isRemote ? 'Remote' : `${formatDistance(job.approximateDistance)} from campus`}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ ...typography.title, fontSize: 24, lineHeight: 32, color: colors.text, fontWeight: '700' }}>
          {job.title}
        </Text>

        {/* Compensation & Openings Card */}
        <Card variant="elevated" style={{ padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textMuted,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }}
              >
                Compensation
              </Text>
              <Text
                style={{
                  ...typography.title,
                  fontSize: 24,
                  lineHeight: 32,
                  color: colors.primary,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                  marginTop: 2,
                }}
              >
                {formatPay(job.pay, job.payUnit)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                  Direct payout upon completion
                </Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textMuted,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }}
              >
                Openings
              </Text>
              <Text
                style={{
                  ...typography.title,
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.text,
                  fontVariant: ['tabular-nums'],
                  marginTop: 2,
                }}
              >
                {job.filledCount} / {job.openings}
              </Text>
              <Chip
                size="sm"
                label={remainingSlots > 0 ? `${remainingSlots} open` : 'Filled'}
                variant={remainingSlots > 0 ? 'success' : 'danger'}
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        </Card>

        {/* Work Location Card */}
        <Card variant="outlined" style={{ padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
              Work Location
            </Text>
          </View>

          {isAccepted ? (
            <View style={{ marginTop: 4, gap: 4 }}>
              <Text style={{ ...typography.body, color: colors.text, fontWeight: '700' }}>
                {job.location.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={{ ...typography.caption, color: colors.successText }}>
                  Exact venue and check-in instructions unlocked.
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 4, gap: 4 }}>
              <Text style={{ ...typography.secondary, color: colors.textSecondary }}>
                {job.isRemote
                  ? 'Fully Remote (Work from anywhere)'
                  : `Within ~${formatDistance(job.approximateDistance)} of campus`}
              </Text>
              {!job.isRemote && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    Exact address and room disclosed upon acceptance.
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Schedule & Time */}
        <Card variant="outlined" style={{ padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
              Schedule & Timing
            </Text>
          </View>
          <Text style={{ ...typography.secondary, color: colors.text }}>
            Date:{' '}
            <Text style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
              {formatDate(job.startDate)}
            </Text>
            {job.endDate && job.endDate !== job.startDate ? ` to ${formatDate(job.endDate)}` : ''}
          </Text>
          {isShortTerm && job.startTime && (
            <Text style={{ ...typography.secondary, color: colors.text }}>
              Time:{' '}
              <Text style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                {formatTime(job.startTime)} – {formatTime(job.endTime)}
              </Text>
              {' '}
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>(Up to 5 hours)</Text>
            </Text>
          )}
        </Card>

        {/* Overview / Description */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
            Gig Overview
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 24 }}>
            {job.description}
          </Text>
        </View>

        {/* Posted By Coordinator */}
        <Card variant="outlined" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
          <Avatar name={job.postedBy.name} size="md" isVerified />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>Posted by</Text>
            <Text style={{ ...typography.body, fontWeight: '600', color: colors.text }}>
              {job.postedBy.name}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Floating Bottom Sticky Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          ...shadow.md,
        }}
      >
        {isAccepted ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ ...typography.secondary, color: colors.successText, fontWeight: '700' }}>
                Gig Confirmed
              </Text>
            </View>
            <Button
              label="Chat with Coordinator"
              variant="primary"
              onPress={handleOpenChat}
              loading={actionLoading}
              fullWidth
              size="lg"
            />
            <Button
              label="Withdraw Acceptance"
              variant="outline"
              onPress={handleCancelAcceptance}
              disabled={actionLoading}
              fullWidth
              size="md"
            />
          </View>
        ) : isOwnJob ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ ...typography.secondary, color: colors.textMuted }}>
              This is your own job post.
            </Text>
          </View>
        ) : (
          <Button
            label={remainingSlots > 0 ? (isUserBlocked ? 'Account Blocked' : 'Accept Gig') : 'Gig Filled'}
            onPress={handleAccept}
            loading={actionLoading}
            disabled={remainingSlots <= 0 || isUserBlocked || user?.activeMode !== 'SEEKER'}
            fullWidth
            size="lg"
          />
        )}
      </View>

      {/* Report Dialog */}
      <ReportDialog
        visible={showReport}
        onClose={() => setShowReport(false)}
        targetType="JOB"
        targetId={job.id}
        targetTitle={job.title}
      />
    </SafeAreaView>
  );
}
