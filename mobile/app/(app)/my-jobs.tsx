import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { jobService, chatService } from '../../src/services';
import { SkeletonJobCard } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import type { Application, JobPost, AppStatus, JobStatus } from '../../src/types';
import { formatPay, formatDate, formatTime } from '../../src/utils/businessRules';

export default function MyJobsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
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
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [isSeeker])
  );

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
                Alert.alert(
                  'Account Suspended',
                  'Your account has been temporarily restricted for 24 hours.'
                );
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

    Alert.alert('Withdraw Listing?', msg, [
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
    ]);
  };

  const filteredApps = applications.filter((a) =>
    activeSeekerTab === 'ALL' ? true : a.status === activeSeekerTab
  );

  const filteredPosts = posts.filter((p) =>
    activeRecruiterTab === 'ALL' ? true : p.status === activeRecruiterTab
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          gap: spacing.xs,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
          {isSeeker ? 'Your Commitments & History' : 'Your Published Listings'}
        </Text>
        <Text
          style={{
            ...typography.title,
            fontSize: 24,
            lineHeight: 30,
            color: colors.text,
            fontWeight: '700',
          }}
        >
          {isSeeker ? 'My Gigs' : 'My Posts'}
        </Text>

        {/* Tab Filters */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.xs }}>
          {isSeeker
            ? seekerTabs.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={activeSeekerTab === t.value}
                  onPress={() => setActiveSeekerTab(t.value)}
                  size="sm"
                />
              ))
            : recruiterTabs.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={activeRecruiterTab === t.value}
                  onPress={() => setActiveRecruiterTab(t.value)}
                  size="sm"
                />
              ))}
        </View>
      </View>

      {/* List Body */}
      {loading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : isSeeker ? (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isCanCancel = item.status === 'ACCEPTED' || item.status === 'IN_PROGRESS';
            const isShortTerm = item.job.type === 'SHORT_TERM';

            const statusBadgeVariant =
              item.status === 'ACCEPTED'
                ? 'success'
                : item.status === 'COMPLETED'
                ? 'primary'
                : 'danger';

            return (
              <Card variant="elevated" style={{ gap: spacing.sm, padding: spacing.cardPadding }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    size="sm"
                    label={isShortTerm ? 'Short-term' : 'Long-term'}
                    variant={isShortTerm ? 'warning' : 'info'}
                    icon={
                      <Ionicons
                        name={isShortTerm ? 'flash-outline' : 'calendar-outline'}
                        size={11}
                        color={isShortTerm ? colors.warningText : colors.infoText}
                      />
                    }
                  />
                  <Badge label={item.status} variant={statusBadgeVariant} />
                </View>

                <TouchableOpacity
                  onPress={() => router.push(`/(app)/job/${item.job.id}`)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      ...typography.heading,
                      fontSize: 17,
                      color: colors.text,
                      fontWeight: '700',
                    }}
                  >
                    {item.job.title}
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    backgroundColor: colors.bgSecondary,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location-outline" size={15} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.caption,
                        fontSize: 13,
                        color: colors.text,
                        fontWeight: '600',
                        flex: 1,
                      }}
                    >
                      {item.job.location.label}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text
                      style={{
                        ...typography.caption,
                        color: colors.textSecondary,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatDate(item.job.startDate)}{' '}
                      {item.job.startTime
                        ? `· ${formatTime(item.job.startTime)} – ${formatTime(item.job.endTime)}`
                        : ''}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Ionicons name="cash-outline" size={15} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.heading,
                        fontSize: 16,
                        color: colors.primary,
                        fontWeight: '700',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatPay(item.job.pay, item.job.payUnit)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                  <Button
                    label="Chat with Recruiter"
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={async () => {
                      try {
                        const chat = await chatService.getOrCreateJobChat(item.job.id);
                        router.push({
                          pathname: '/(app)/chat/[id]',
                          params: {
                            id: chat.conversationId,
                            jobTitle: item.job.title,
                            peerName: item.job.postedBy.name,
                            peerRole: 'RECRUITER',
                          },
                        } as any);
                      } catch (e: any) {
                        Alert.alert('Error', e?.message || 'Could not start chat');
                      }
                    }}
                  />
                  {isCanCancel && (
                    <Button
                      label="Withdraw"
                      variant="destructive"
                      size="sm"
                      onPress={() => handleCancelApplication(item.job.id, item.job.title)}
                    />
                  )}
                </View>
              </Card>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
              {/* Recruiter Stats Dashboard */}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    style={{
                      ...typography.title,
                      fontSize: 20,
                      fontWeight: '700',
                      color: colors.primary,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {posts.length}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                    Total Posts
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    style={{
                      ...typography.title,
                      fontSize: 20,
                      fontWeight: '700',
                      color: colors.success,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {posts.reduce((sum, p) => sum + (p.filledCount || 0), 0)}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                    Confirmed
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    style={{
                      ...typography.title,
                      fontSize: 20,
                      fontWeight: '700',
                      color: colors.accent,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {posts.filter((p) => p.status === 'OPEN').reduce((sum, p) => sum + Math.max(0, p.openings - p.filledCount), 0)}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                    Open Slots
                  </Text>
                </View>
              </View>

              {/* Quick Post Action */}
              <TouchableOpacity
                onPress={() => router.push('/(app)/post-job')}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.primaryBg,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="add-circle" size={20} color={colors.primary} />
                  <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>
                    Publish Another Campus Gig
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const hasSeekers = item.filledCount > 0;
            const canCancel = item.status === 'OPEN' || item.status === 'FILLED';
            const isShortTerm = item.type === 'SHORT_TERM';

            const statusBadgeVariant =
              item.status === 'OPEN' ? 'success' : item.status === 'FILLED' ? 'warning' : 'danger';

            return (
              <Card variant="elevated" style={{ gap: spacing.sm, padding: spacing.cardPadding }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    size="sm"
                    label={isShortTerm ? 'Short-term' : 'Long-term'}
                    variant={isShortTerm ? 'warning' : 'info'}
                    icon={
                      <Ionicons
                        name={isShortTerm ? 'flash-outline' : 'calendar-outline'}
                        size={11}
                        color={isShortTerm ? colors.warningText : colors.infoText}
                      />
                    }
                  />
                  <Badge label={item.status} variant={statusBadgeVariant} />
                </View>

                <Text
                  style={{
                    ...typography.heading,
                    fontSize: 17,
                    color: colors.text,
                    fontWeight: '700',
                  }}
                >
                  {item.title}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="cash-outline" size={15} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.heading,
                        fontSize: 16,
                        color: colors.primary,
                        fontWeight: '700',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatPay(item.pay, item.payUnit)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text
                      style={{
                        ...typography.caption,
                        color: colors.textSecondary,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {item.filledCount} of {item.openings} confirmed
                    </Text>
                  </View>
                </View>

                {/* Confirmed students info */}
                {item.acceptedSeekers && item.acceptedSeekers.length > 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      gap: 8,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.text, fontWeight: '700' }}>
                      Confirmed Students ({item.acceptedSeekers.length}):
                    </Text>
                    {item.acceptedSeekers.map((s) => {
                      const seekerName = s.seeker?.name || (s as any).name || 'Student';
                      const seekerEmail = s.seeker?.email || '';
                      const seekerId = s.seeker?.id || (s as any).id;
                      return (
                        <View
                          key={s.applicationId || seekerId}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Avatar name={seekerName} size="sm" isVerified />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  ...typography.caption,
                                  fontSize: 13,
                                  color: colors.text,
                                  fontWeight: '600',
                                }}
                                numberOfLines={1}
                              >
                                {seekerName}
                              </Text>
                              {seekerEmail ? (
                                <Text
                                  style={{ ...typography.caption, fontSize: 11, color: colors.textSecondary }}
                                  numberOfLines={1}
                                >
                                  {seekerEmail}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                const chat = await chatService.getOrCreateJobChat(item.id, seekerId);
                                router.push({
                                  pathname: '/(app)/chat/[id]',
                                  params: {
                                    id: chat.conversationId,
                                    jobTitle: item.title,
                                    peerName: seekerName,
                                    peerRole: 'SEEKER',
                                  },
                                } as any);
                              } catch (e: any) {
                                Alert.alert('Error', e?.message || 'Could not start chat');
                              }
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: colors.primaryBg,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: radii.chip,
                              borderWidth: 1,
                              borderColor: colors.primary,
                            }}
                          >
                            <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Chat</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
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
              </Card>
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
