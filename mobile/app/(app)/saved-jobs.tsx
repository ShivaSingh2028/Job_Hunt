import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { jobService } from '../../src/services';
import { SkeletonJobCard } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { JobCard } from '../../src/components/ui/JobCard';
import type { Job } from '../../src/types';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = async () => {
    try {
      const data = await jobService.getSavedJobs();
      setSavedJobs(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaved();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          gap: spacing.md,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={{ ...typography.secondary, color: colors.text, fontWeight: '600' }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            ...typography.title,
            fontSize: 20,
            color: colors.text,
            fontWeight: '700',
          }}
        >
          Saved Gigs
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : (
        <FlatList
          data={savedJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(app)/job/${item.id}`)}
              quickActionLabel="View"
              onQuickAction={() => router.push(`/(app)/job/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              iconName="bookmark-outline"
              title="No saved gigs yet"
              description="Tap the bookmark icon on any gig detail page to keep track of it here."
              actionLabel="Explore Nearby Gigs"
              onAction={() => router.push('/(app)')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
