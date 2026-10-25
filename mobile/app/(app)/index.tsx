import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useJobStore } from '../../src/store/jobStore';
import { jobService } from '../../src/services';
import { Screen } from '../../src/components/ui/Screen';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { JobCard } from '../../src/components/jobs/JobCard';
import { ModeSwitcher } from '../../src/components/shared/ModeSwitcher';
import { FilterSheet } from '../../src/components/jobs/FilterSheet';
import { Logo } from '../../src/components/ui/Logo';
import { useLiveLocation } from '../../src/hooks/useLiveLocation';
import type { JobFilters } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const { user } = useAuthStore();
  const { jobs, filters, setJobs, setFilters, isLoading, setLoading, error, setError } = useJobStore();
  const { coords, locationName, isLocating, refreshLocation } = useLiveLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isSeeker = user?.activeMode === 'SEEKER';

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const lat = coords?.lat ?? user?.location?.lat ?? 28.6139;
      const lng = coords?.lng ?? user?.location?.lng ?? 77.2090;
      const result = await jobService.getJobs(lat, lng, { ...filters, keyword: keyword.trim() || undefined });
      setJobs(result.jobs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, keyword, coords, user?.location]);

  useEffect(() => {
    fetchJobs();
  }, [filters, coords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(true);
  };

  if (!isSeeker) {
    return (
      <RecruiterHome
        router={router}
        colors={colors}
        typography={typography}
        spacing={spacing}
        radii={radii}
      />
    );
  }

  return (
    <Screen>
      {/* Top Header */}
      <View
        style={{
          padding: spacing.lg,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Logo size={44} />
            <View>
              <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
                JobHunt • Campus Gigs
              </Text>
              <Text style={{ ...typography.headingLg, color: colors.text, fontWeight: '800' }}>
                Nearby Work
              </Text>
            </View>
          </View>
          <ModeSwitcher />
        </View>

        {/* Real-time Location Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/location-picker')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.bgSecondary,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isLocating ? colors.warning : colors.success,
              }}
            />
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text
              style={{ ...typography.caption, color: colors.text, fontWeight: '700', flex: 1 }}
              numberOfLines={1}
            >
              {isLocating ? 'Acquiring GPS...' : `${locationName} • Live GPS`}
            </Text>
            <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '600' }}>Change</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              refreshLocation();
              fetchJobs();
            }}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.bgSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate-outline" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            alignItems: 'center',
            backgroundColor: colors.bgSecondary,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            height: 46,
            marginTop: 4,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
            placeholder="Search tasks, tutoring, event help..."
            placeholderTextColor={colors.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => fetchJobs()}
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => { setKeyword(''); fetchJobs(); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={{
              padding: 6,
              backgroundColor: Object.keys(filters).length > 0 ? colors.primaryLight : 'transparent',
              borderRadius: radii.sm,
            }}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={Object.keys(filters).length > 0 ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/map')}
            style={{
              padding: 6,
              borderRadius: radii.sm,
            }}
          >
            <Ionicons name="map-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active filter chips */}
        {(filters.type || filters.minPay !== undefined || filters.maxPay !== undefined) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {filters.type && (
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, type: undefined })}
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: radii.full,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={filters.type === 'SHORT_TERM' ? 'flash' : 'calendar-outline'}
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                    {filters.type === 'SHORT_TERM' ? 'Short-term (≤5h)' : 'Long-term'}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
              {filters.minPay !== undefined && (
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, minPay: undefined })}
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: radii.full,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                    Min ₹{filters.minPay}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Main List */}
      {isLoading && <LoadingSpinner message="Scanning 5 km radius around campus..." />}
      {error && !isLoading && <ErrorState message={error} onRetry={fetchJobs} />}
      {!isLoading && !error && (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(app)/job/${item.id}`)}
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

      {/* Filter modal */}
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

function RecruiterHome({ router, colors, typography, spacing, radii }: any) {
  const { user } = useAuthStore();

  return (
    <Screen scroll>
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
              Recruiter Mode Active
            </Text>
            <Text style={{ ...typography.displayMd, color: colors.text, fontWeight: '800' }}>
              Recruiter Hub
            </Text>
          </View>
          <ModeSwitcher />
        </View>

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
            borderRadius: radii.xl,
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
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radii.full,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                INSTANT DISPATCH
              </Text>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
              Post a New Gig
            </Text>
            <Text style={{ ...typography.bodyMd, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              Find reliable student helpers for events, stalls, lab assistance, or remote projects.
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fff',
              alignSelf: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: radii.md,
              marginTop: 4,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Create Gig Post</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Activity Overview</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>1</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>Active Post</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.warning }}>0</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>In Progress</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.success }}>2</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/my-jobs')}
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="documents-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>Manage All My Posts</Text>
            <Text style={{ ...typography.bodySm, color: colors.textSecondary, marginTop: 2 }}>
              Review applicants, track status, and coordinate jobs
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Recruiter Rules Notice */}
        <View
          style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: radii.lg,
            padding: spacing.md,
            gap: 6,
            borderLeftWidth: 3,
            borderLeftColor: colors.info,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Recruiter Guidelines</Text>
          </View>
          <Text style={{ ...typography.bodySm, color: colors.textSecondary, lineHeight: 20 }}>
            Job postings connect you directly with verified students near campus. When a student confirms your listing, coordinates and reporting instructions unlock immediately. Unclaimed posts can be updated or withdrawn anytime penalty-free.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
