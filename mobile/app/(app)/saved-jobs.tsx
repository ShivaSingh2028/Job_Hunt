import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { jobService } from '../../src/services';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { JobCard } from '../../src/components/jobs/JobCard';
import type { Job } from '../../src/types';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = async () => {
    try {
      const data = await jobService.getSavedJobs();
      setSavedJobs(data);
    } catch {}
    finally {
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
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.md,
        backgroundColor: colors.card,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>Saved Gigs</Text>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading saved gigs..." />
      ) : (
        <FlatList
          data={savedJobs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(app)/job/${item.id}`)}
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
        />
      )}
    </SafeAreaView>
  );
}
