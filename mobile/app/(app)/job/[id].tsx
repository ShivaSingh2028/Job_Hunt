import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAuthStore } from '../../../src/store/authStore';
import { useJobStore } from '../../../src/store/jobStore';
import { jobService, chatService } from '../../../src/services';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ReportDialog } from '../../../src/components/shared/ReportDialog';
import type { Job } from '../../../src/types';
import { formatPay, formatDistance, formatDate, formatTime } from '../../../src/utils/businessRules';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow } = useTheme();
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
        const accepted = apps.some(a => a.job.id === id && (a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS'));
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
        'Student Verification Required',
        'Please verify your college email identity before accepting campus gigs.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/(auth)/verify-otp' as any) },
        ]
      );
      return;
    }
    if (user?.isBlocked) {
      Alert.alert('Account Blocked', 'You cannot accept gigs while blocked.');
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
        'You have successfully accepted this gig. The exact work location and coordinator notes are now unlocked below.',
        [{ text: 'View Details' }]
      );
    } catch (err: any) {
      const code = err?.code;
      if (code === 'ALREADY_TAKEN') {
        Alert.alert('Gig Filled', 'Another candidate has just claimed the last remaining opening for this gig.', [
          { text: 'Return to Feed', onPress: () => router.back() },
        ]);
      } else if (code === 'TIME_CONFLICT') {
        Alert.alert('Schedule Conflict', 'You already have another short-term gig confirmed during these overlapping hours.');
      } else if (code === 'OWN_JOB') {
        Alert.alert('Notice', 'You cannot accept your own job listing.');
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
      'Cancel Confirmation',
      `Are you sure you want to cancel? The opening will be reopened for other students.\n\nNote: After 3 cancellations, your account will be temporarily blocked for 24 hours.`,
      [
        { text: 'Keep Gig', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
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
                Alert.alert('Cancellation Confirmed', 'Your acceptance has been removed.');
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
      setJob(j => j ? { ...j, isSaved: res.isSaved } : null);
      updateJob(job.id, { isSaved: res.isSaved });
    } catch {}
  };

  if (loading) return <LoadingSpinner message="Loading gig details..." />;
  if (error || !job) return <ErrorState message={error || 'Job not found'} onRetry={fetchDetail} />;

  const isOwnJob = job.postedBy.id === user?.id;
  const remainingSlots = Math.max(0, job.openings - job.filledCount);
  const initials = job.postedBy.name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Navbar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleToggleSave}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: job.isSaved ? colors.primaryLight : colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
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
              borderRadius: 18,
              backgroundColor: colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 110 }}>
        {/* Badges & Distance */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge
            label={job.type === 'SHORT_TERM' ? 'Short-term Gig' : 'Long-term'}
            variant={job.type === 'SHORT_TERM' ? 'warning' : 'info'}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={job.isRemote ? 'globe-outline' : 'location-outline'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={{ ...typography.bodySm, color: colors.textMuted }}>
              {job.isRemote ? 'Remote' : `${formatDistance(job.approximateDistance)} from campus`}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ ...typography.displayMd, color: colors.text }}>{job.title}</Text>

        {/* Pay & Slots Card */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...shadow.sm,
        }}>
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted, letterSpacing: 0.5 }}>COMPENSATION</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 2 }}>
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
            <Text style={{ ...typography.caption, color: colors.textMuted, letterSpacing: 0.5 }}>OPENINGS</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 }}>
              {job.filledCount} / {job.openings}
            </Text>
            <Text style={{
              ...typography.caption,
              color: remainingSlots > 0 ? colors.success : colors.error,
              fontWeight: '600',
              marginTop: 4,
            }}>
              {remainingSlots > 0 ? `${remainingSlots} slot available` : 'Filled'}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={{
          backgroundColor: colors.bgSecondary,
          borderRadius: radii.lg,
          padding: spacing.lg,
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="navigate-outline" size={17} color={colors.primary} />
            <Text style={{ ...typography.headingSm, color: colors.text }}>Work Location</Text>
          </View>

          {isAccepted ? (
            <View style={{ marginTop: 4, gap: 4 }}>
              <Text style={{ ...typography.bodyMd, color: colors.text, fontWeight: '700' }}>
                {job.location.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={{ ...typography.caption, color: colors.success }}>
                  Exact venue and check-in instructions unlocked.
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 4, gap: 4 }}>
              <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>
                {job.isRemote ? 'Fully Remote (Work from anywhere)' : `Within ~${formatDistance(job.approximateDistance)} of campus`}
              </Text>
              {!job.isRemote && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    Exact address and reporting room disclosed upon acceptance.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Schedule & Time */}
        <View style={{
          backgroundColor: colors.bgSecondary,
          borderRadius: radii.lg,
          padding: spacing.lg,
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={17} color={colors.primary} />
            <Text style={{ ...typography.headingSm, color: colors.text }}>Schedule</Text>
          </View>
          <Text style={{ ...typography.bodyMd, color: colors.text }}>
            Date: <Text style={{ fontWeight: '600' }}>{formatDate(job.startDate)}</Text>
            {job.endDate && job.endDate !== job.startDate ? ` to ${formatDate(job.endDate)}` : ''}
          </Text>
          {job.type === 'SHORT_TERM' && job.startTime && (
            <Text style={{ ...typography.bodyMd, color: colors.text }}>
              Time: <Text style={{ fontWeight: '600' }}>{formatTime(job.startTime)} - {formatTime(job.endTime)}</Text>
              {' '}<Text style={{ ...typography.caption, color: colors.textSecondary }}>(Up to 5 hours)</Text>
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.headingSm, color: colors.text }}>Gig Overview</Text>
          <Text style={{ ...typography.bodyLg, color: colors.textSecondary, lineHeight: 24 }}>
            {job.description}
          </Text>
        </View>

        {/* Posted By */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.bodySm, color: colors.textMuted }}>Posted by</Text>
            <Text style={{ ...typography.headingSm, color: colors.text }}>{job.postedBy.name}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadow.lg,
      }}>
        {isAccepted ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ ...typography.headingSm, color: colors.success }}>Gig Confirmed</Text>
            </View>
            <Button
              label="Chat with Recruiter"
              variant="primary"
              onPress={handleOpenChat}
              loading={actionLoading}
              fullWidth
            />
            <Button
              label="Cancel Acceptance"
              variant="outline"
              onPress={handleCancelAcceptance}
              disabled={actionLoading}
              fullWidth
            />
          </View>
        ) : isOwnJob ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ ...typography.bodyMd, color: colors.textMuted }}>
              This is your own job post.
            </Text>
          </View>
        ) : (
          <Button
            label={remainingSlots > 0 ? "Accept Gig" : "Gig Filled"}
            onPress={handleAccept}
            loading={actionLoading}
            disabled={remainingSlots <= 0 || user?.isBlocked || user?.activeMode !== 'SEEKER'}
            fullWidth
            size="lg"
          />
        )}
      </View>

      {/* Report dialog */}
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
