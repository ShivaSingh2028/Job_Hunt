import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useJobStore } from '../../src/store/jobStore';
import { jobService } from '../../src/services';
import { Screen } from '../../src/components/ui/Screen';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonJobCard } from '../../src/components/ui/Skeleton';
import { JobCard } from '../../src/components/ui/JobCard';
import { ModeSwitcher } from '../../src/components/shared/ModeSwitcher';
import { FilterSheet } from '../../src/components/jobs/FilterSheet';
import { Logo } from '../../src/components/ui/Logo';
import { Chip } from '../../src/components/ui/Chip';
import { Badge } from '../../src/components/ui/Badge';
import { useLiveLocation } from '../../src/hooks/useLiveLocation';
import type { JobFilters } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { user } = useAuthStore();
  const { jobs, filters, setJobs, setFilters, isLoading, setLoading, error, setError } = useJobStore();
  const { coords, locationName, isLocating, refreshLocation } = useLiveLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isSeeker = user?.activeMode === 'SEEKER';

  const fetchJobs = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const lat = coords?.lat ?? user?.location?.lat ?? 28.6139;
        const lng = coords?.lng ?? user?.location?.lng ?? 77.209;
        const result = await jobService.getJobs(lat, lng, {
          ...filters,
          keyword: keyword.trim() || undefined,
        });
        setJobs(result.jobs);
      } catch (e: any) {
        setError(e?.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, keyword, coords, user?.location]
  );

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await fetchJobs(true);
  };

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    (filters.minPay !== undefined ? 1 : 0) +
    (filters.maxPay !== undefined ? 1 : 0);

  if (!isSeeker) {
    return (
      <RecruiterHome
        router={router}
        colors={colors}
        typography={typography}
        spacing={spacing}
        radii={radii}
        isDark={isDark}
      />
    );
  }

  return (
    <Screen>
      {/* Top Header Bar */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          gap: spacing.md,
        }}
      >
        {/* Row 1: Title "Nearby work" with readable location line beneath it */}
        <View style={{ gap: 4 }}>
          <Text
            style={{
              ...typography.title,
              fontSize: 24,
              lineHeight: 30,
              fontWeight: '700',
              color: colors.text,
            }}
          >
            Nearby work
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/location-picker')}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={`Location: ${locationName}, 5 km radius. Tap to change.`}
            >
              <Ionicons name="location-sharp" size={15} color={colors.primary} />
              <Text
                style={{
                  ...typography.secondary,
                  color: colors.textSecondary,
                  fontWeight: '500',
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {locationName} · 5 km radius
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.primary,
                  fontWeight: '700',
                  paddingHorizontal: 2,
                }}
              >
                Change
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                refreshLocation();
                fetchJobs();
              }}
              disabled={isLocating}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Use my current GPS location"
              style={{ padding: 4 }}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="locate-outline" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Full-width ModeSwitcher */}
        <ModeSwitcher />

        {/* Row 3: Search field with filter button and list/map toggle */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radii.input,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              paddingHorizontal: spacing.md,
              height: 46,
              gap: spacing.xs,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                color: colors.text,
                ...typography.body,
                fontSize: 14,
                paddingVertical: 8,
              }}
              placeholder="Search tasks, tutoring, help..."
              placeholderTextColor={colors.textSecondary}
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={() => fetchJobs()}
              returnKeyType="search"
            />
            {keyword ? (
              <TouchableOpacity
                onPress={() => {
                  setKeyword('');
                  fetchJobs();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter button */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
            style={{
              width: 46,
              height: 46,
              borderRadius: radii.input,
              backgroundColor: activeFilterCount > 0 ? colors.primaryBg : colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            accessibilityRole="button"
            accessibilityLabel={`Filter jobs${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: colors.primary,
                  borderRadius: radii.full,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Map view toggle */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/map')}
            activeOpacity={0.8}
            style={{
              width: 46,
              height: 46,
              borderRadius: radii.input,
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="View gigs on map"
          >
            <Ionicons name="map-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
          >
            {filters.type && (
              <Chip
                size="sm"
                label={filters.type === 'SHORT_TERM' ? 'Short-term (≤5h)' : 'Long-term'}
                variant={filters.type === 'SHORT_TERM' ? 'warning' : 'info'}
                onPress={() => setFilters({ ...filters, type: undefined })}
                icon={<Ionicons name="close" size={12} color={colors.textSecondary} />}
              />
            )}
            {filters.minPay !== undefined && (
              <Chip
                size="sm"
                label={`Min ₹${filters.minPay}`}
                variant="primary"
                onPress={() => setFilters({ ...filters, minPay: undefined })}
                icon={<Ionicons name="close" size={12} color={colors.primary} />}
              />
            )}
            {filters.maxPay !== undefined && (
              <Chip
                size="sm"
                label={`Max ₹${filters.maxPay}`}
                variant="primary"
                onPress={() => setFilters({ ...filters, maxPay: undefined })}
                icon={<Ionicons name="close" size={12} color={colors.primary} />}
              />
            )}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonJobCard />
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : error ? (
        <ErrorState
          title="Could not load gigs"
          message={error}
          onRetry={fetchJobs}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: 40,
          }}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(app)/job/${item.id}`)}
              quickActionLabel="View"
              onQuickAction={() => router.push(`/(app)/job/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="search-outline"
              title="No open gigs found"
              description="No open listings matched your filters within 5 km of campus. Try clearing your filters or check back shortly."
              actionLabel="Reset Search & Filters"
              onAction={() => {
                setFilters({});
                setKeyword('');
                fetchJobs();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(f: JobFilters) => {
          setFilters(f);
          setShowFilters(false);
          fetchJobs();
        }}
      />
    </Screen>
  );
}

function RecruiterHome({ router, colors, typography, spacing, radii, isDark }: any) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    jobService.getMyPosts().then(setPosts).catch(() => {});
  }, []);

  const activePosts = posts.filter(p => p.status === 'OPEN').length;
  const inProgress = posts.filter(p => p.status === 'FILLED').length;
  const totalConfirmed = posts.reduce((sum, p) => sum + (p.filledCount || 0), 0);

  return (
    <Screen scroll>
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ gap: 4 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
            Recruiter Mode Active
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
            Recruiter Hub
          </Text>
        </View>

        {/* Full-width ModeSwitcher */}
        <ModeSwitcher />

        {/* Hero Post Action Card */}
        <TouchableOpacity
          onPress={() => {
            if (user?.isBlocked) {
              alert('Your account is currently suspended. You cannot post gigs.');
              return;
            }
            router.push('/(app)/post-job');
          }}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radii.card,
            padding: spacing.xl,
            gap: spacing.md,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.full,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radii.full,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: '#FFFFFF',
                  fontWeight: '600',
                  letterSpacing: 0.2,
                }}
              >
                Instant dispatch
              </Text>
            </View>
          </View>

          <View>
            <Text style={{ ...typography.title, fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>
              Post a new gig
            </Text>
            <Text
              style={{
                ...typography.secondary,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 4,
                lineHeight: 20,
              }}
            >
              Find reliable student helpers for events, stalls, lab assistance, or remote projects.
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FFFFFF',
              alignSelf: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: radii.button,
              marginTop: 4,
            }}
          >
            <Text style={{ ...typography.secondary, color: colors.primary, fontWeight: '600' }}>
              Create gig post
            </Text>
            <Ionicons name="arrow-forward" size={15} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
            Activity Overview
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.card,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  ...typography.title,
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {activePosts}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                Active Posts
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.card,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  ...typography.title,
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.warning,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {inProgress}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                Filled
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.card,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  ...typography.title,
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.success,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {totalConfirmed}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                Confirmed
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/my-jobs')}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.full,
              backgroundColor: colors.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="documents-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
              Manage All My Posts
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              Review applicants, track status, and coordinate jobs
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Recruiter Rules Notice */}
        <View
          style={{
            backgroundColor: colors.infoBg,
            borderRadius: radii.card,
            padding: spacing.md,
            gap: 6,
            borderLeftWidth: 3,
            borderLeftColor: colors.info,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={{ ...typography.caption, color: colors.infoText, fontWeight: '700' }}>
              Recruiter Guidelines
            </Text>
          </View>
          <Text style={{ ...typography.secondary, color: colors.infoText, lineHeight: 18, fontSize: 13 }}>
            Job postings connect you directly with verified students near campus. When a student confirms your listing, coordinates and reporting instructions unlock immediately. Unclaimed posts can be updated or withdrawn anytime penalty-free.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
