import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { jobService } from '../../src/services';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import type { Application, JobPost, AppStatus, JobStatus } from '../../src/types';
import { formatPay, formatDate, formatTime } from '../../src/utils/businessRules';

export default function MyJobsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow } = useTheme();
  const { user, setUser } = useAuthStore();
  const isSeeker = user?.activeMode === 'SEEKER';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posts, setPosts] = useState<JobPost[]>([]);

  // Filter tabs
  const seekerTabs: { label: string; value: AppStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const recruiterTabs: { label: string; value: JobStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Filled', value: 'FILLED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const [activeSeekerTab, setActiveSeekerTab] = useState<AppStatus | 'ALL'>('ALL');
  const [activeRecruiterTab, setActiveRecruiterTab] = useState<JobStatus | 'ALL'>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isSeeker) {
        const data = await jobService.getMyApplications();
        setApplications(data);
      } else {
        const data = await jobService.getMyPosts();
        setPosts(data);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSeeker]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCancelApplication = async (jobId: string, title: string) => {
    Alert.alert(
      'Withdraw Gig Acceptance',
      `Are you sure you want to cancel your commitment for "${title}"?\n\nNote: Repeated cancellations may result in a temporary 24-hour account suspension.`,
      [
        { text: 'Keep Gig', style: 'cancel' },
        {
          text: 'Confirm Withdrawal',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await jobService.cancelAcceptance(jobId);
              if (user) {
                setUser({
                  ...user,
                  cancellationCount: res.cancellationCount,
                  isBlocked: res.isBlocked,
                  blockedUntil: res.blockedUntil,
                });
              }
              if (res.isBlocked) {
                Alert.alert('Account Suspended', 'Your account has been temporarily restricted for 24 hours.');
              } else if (res.warning) {
                Alert.alert('Notice', res.warning);
              }
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not cancel commitment.');
            }
          },
        },
      ]
    );
  };

  const handleCancelPost = async (jobId: string, title: string, hasSeekers: boolean) => {
    const msg = hasSeekers
      ? `This listing has confirmed student workers. Withdrawing will notify them and log to your account record.`
      : `No students have confirmed this gig yet. You can withdraw penalty-free.`;

    Alert.alert(
      'Withdraw Listing?',
      msg,
      [
        { text: 'Keep Live', style: 'cancel' },
        {
          text: 'Withdraw Listing',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobService.cancelJob(jobId);
              Alert.alert('Listing Withdrawn', 'The gig posting has been closed.');
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not withdraw listing.');
            }
          },
        },
      ]
    );
  };

  const filteredApps = applications.filter(a =>
    activeSeekerTab === 'ALL' ? true : a.status === activeSeekerTab
  );

  const filteredPosts = posts.filter(p =>
    activeRecruiterTab === 'ALL' ? true : p.status === activeRecruiterTab
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
        gap: spacing.sm,
      }}>
        <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
          {isSeeker ? 'Your Commitments & History' : 'Your Published Listings'}
        </Text>
        <Text style={{ ...typography.displayMd, color: colors.text, fontWeight: '800' }}>
          {isSeeker ? 'My Gigs' : 'My Posts'}
        </Text>

        {/* Tab Filters */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {isSeeker ? seekerTabs.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setActiveSeekerTab(t.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radii.full,
                backgroundColor: activeSeekerTab === t.value ? colors.primary : colors.bgSecondary,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: activeSeekerTab === t.value ? '#fff' : colors.textSecondary,
              }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          )) : recruiterTabs.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setActiveRecruiterTab(t.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radii.full,
                backgroundColor: activeRecruiterTab === t.value ? colors.primary : colors.bgSecondary,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: activeRecruiterTab === t.value ? '#fff' : colors.textSecondary,
              }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading listings..." />
      ) : isSeeker ? (
        <FlatList
          data={filteredApps}
          keyExtractor={item => item.applicationId}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const isCanCancel = item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS';
            const isShortTerm = item.job.type === 'SHORT_TERM';

            return (
              <View style={{
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                gap: spacing.sm,
                ...shadow.sm,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isShortTerm ? `${colors.warning}18` : `${colors.info}18`,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radii.full,
                  }}>
                    <Ionicons
                      name={isShortTerm ? 'flash' : 'calendar-outline'}
                      size={12}
                      color={isShortTerm ? colors.warning : colors.info}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isShortTerm ? colors.warning : colors.info }}>
                      {isShortTerm ? 'Short-term' : 'Long-term'}
                    </Text>
                  </View>
                  <Badge
                    label={item.status}
                    variant={item.status === 'ACCEPTED' ? 'success' : item.status === 'COMPLETED' ? 'primary' : 'error'}
                  />
                </View>

                <TouchableOpacity onPress={() => router.push(`/(app)/job/${item.job.id}`)}>
                  <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>
                    {item.job.title}
                  </Text>
                </TouchableOpacity>

                <View style={{
                  backgroundColor: colors.bgSecondary,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  gap: 6,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location-outline" size={15} color={colors.primary} />
                    <Text style={{ ...typography.bodySm, color: colors.text, fontWeight: '600', flex: 1 }}>
                      {item.job.location.label}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                      {formatDate(item.job.startDate)} {item.job.startTime ? `· ${formatTime(item.job.startTime)} - ${formatTime(item.job.endTime)}` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Ionicons name="cash-outline" size={15} color={colors.primary} />
                    <Text style={{ ...typography.headingSm, color: colors.primary, fontWeight: '800' }}>
                      {formatPay(item.job.pay, item.job.payUnit)}
                    </Text>
                  </View>
                </View>

                {isCanCancel && (
                  <Button
                    label="Withdraw Commitment"
                    variant="danger"
                    size="sm"
                    onPress={() => handleCancelApplication(item.job.id, item.job.title)}
                  />
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              iconName="briefcase-outline"
              title="No gigs in this category"
              description="Explore verified opportunities on the home feed and claim your first gig."
              actionLabel="Browse Gigs"
              onAction={() => router.push('/(app)')}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const hasSeekers = item.filledCount > 0;
            const canCancel = item.status === 'OPEN' || item.status === 'FILLED';
            const isShortTerm = item.type === 'SHORT_TERM';

            return (
              <View style={{
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
                gap: spacing.sm,
                ...shadow.sm,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isShortTerm ? `${colors.warning}18` : `${colors.info}18`,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radii.full,
                  }}>
                    <Ionicons
                      name={isShortTerm ? 'flash' : 'calendar-outline'}
                      size={12}
                      color={isShortTerm ? colors.warning : colors.info}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isShortTerm ? colors.warning : colors.info }}>
                      {isShortTerm ? 'Short-term' : 'Long-term'}
                    </Text>
                  </View>
                  <Badge
                    label={item.status}
                    variant={item.status === 'OPEN' ? 'success' : item.status === 'FILLED' ? 'warning' : 'error'}
                  />
                </View>

                <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>
                  {item.title}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="cash-outline" size={15} color={colors.primary} />
                    <Text style={{ ...typography.headingSm, color: colors.primary, fontWeight: '800' }}>
                      {formatPay(item.pay, item.payUnit)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
                      {item.filledCount} of {item.openings} confirmed
                    </Text>
                  </View>
                </View>

                {/* Confirmed students info */}
                {item.acceptedSeekers && item.acceptedSeekers.length > 0 ? (
                  <View style={{
                    backgroundColor: colors.bgSecondary,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    gap: 8,
                  }}>
                    <Text style={{ ...typography.label, color: colors.text, fontWeight: '700' }}>
                      Confirmed Students:
                    </Text>
                    {item.acceptedSeekers.map(s => (
                      <View key={s.applicationId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                          <Text style={{ ...typography.bodySm, color: colors.text, fontWeight: '600' }}>
                            {s.seeker.name}
                          </Text>
                        </View>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>{s.seeker.email}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    Awaiting student confirmations.
                  </Text>
                )}

                {canCancel && (
                  <Button
                    label="Withdraw Listing"
                    variant="outline"
                    size="sm"
                    onPress={() => handleCancelPost(item.id, item.title, hasSeekers)}
                  />
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              iconName="documents-outline"
              title="No active listings"
              description="You have not published any job listings yet."
              actionLabel="Publish a Listing"
              onAction={() => router.push('/(app)/post-job')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
