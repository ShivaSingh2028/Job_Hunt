import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useJobStore } from '../../src/store/jobStore';
import { jobService } from '../../src/services';
import type { Job } from '../../src/types';
import { formatPay, formatDistance } from '../../src/utils/businessRules';
import { useLiveLocation } from '../../src/hooks/useLiveLocation';
import { Chip } from '../../src/components/ui/Chip';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow, isDark } = useTheme();
  const { user } = useAuthStore();
  const { jobs, setJobs } = useJobStore();
  const { coords, locationName, isLocating, refreshLocation } = useLiveLocation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const mapRef = useRef<MapView>(null);

  const liveLat = coords?.lat ?? user?.location?.lat ?? 28.6139;
  const liveLng = coords?.lng ?? user?.location?.lng ?? 77.209;

  useEffect(() => {
    jobService
      .getJobs(liveLat, liveLng)
      .then((r) => {
        setJobs(r.jobs);
        if (r.jobs.length > 0) setSelectedJob(r.jobs[0]);
      })
      .catch(() => {});
  }, [liveLat, liveLng]);

  useEffect(() => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        },
        800
      );
    }
  }, [coords?.lat, coords?.lng]);

  const onSiteJobs = jobs.filter((j) => !j.isRemote && j.location.lat !== 0);

  const centerOnUser = () => {
    refreshLocation();
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: liveLat,
          longitude: liveLng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        600
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Component */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: liveLat,
          longitude: liveLng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* User Live GPS Marker */}
        <Marker
          coordinate={{ latitude: liveLat, longitude: liveLng }}
          title="Your Live Location"
          description={locationName || 'Live GPS Location'}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: radii.full,
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: radii.full,
                  backgroundColor: '#2563EB',
                  borderWidth: 2.5,
                  borderColor: '#FFFFFF',
                }}
              />
            </View>
          </View>
        </Marker>

        {/* 5 km Radius Boundary */}
        <Circle
          center={{ latitude: liveLat, longitude: liveLng }}
          radius={5000}
          strokeColor="rgba(124, 58, 237, 0.5)"
          fillColor="rgba(124, 58, 237, 0.08)"
          strokeWidth={2}
        />

        {/* Job Pins */}
        {onSiteJobs.map((job) => {
          const isSelected = selectedJob?.id === job.id;
          const isShortTerm = job.type === 'SHORT_TERM';
          return (
            <Marker
              key={job.id}
              coordinate={{ latitude: job.location.lat, longitude: job.location.lng }}
              onPress={() => setSelectedJob(job)}
            >
              <View
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radii.full,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  ...shadow.sm,
                }}
              >
                <Ionicons
                  name={isShortTerm ? 'flash' : 'calendar-outline'}
                  size={12}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={{
                    ...typography.caption,
                    fontSize: 12,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                    color: isSelected ? '#FFFFFF' : colors.primary,
                  }}
                >
                  ₹{job.pay}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Floating Bar */}
      <View
        style={{
          position: 'absolute',
          top: 52,
          left: spacing.lg,
          right: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.full,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            ...shadow.sm,
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to list"
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: radii.full,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            ...shadow.sm,
          }}
        >
          <Ionicons name="location-sharp" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...typography.caption,
                color: colors.text,
                fontWeight: '700',
              }}
              numberOfLines={1}
            >
              {locationName || 'Live GPS'}
            </Text>
            <Text style={{ ...typography.caption, fontSize: 11, color: colors.textSecondary }}>
              5 km radius • {onSiteJobs.length} active gigs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={centerOnUser}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.full,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            ...shadow.sm,
          }}
          accessibilityRole="button"
          accessibilityLabel="Re-center location"
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Floating Gig Preview Card */}
      {selectedJob && (
        <View
          style={{
            position: 'absolute',
            bottom: 24,
            left: spacing.lg,
            right: spacing.lg,
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            gap: spacing.sm,
            ...shadow.md,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Chip
                size="sm"
                label={selectedJob.type === 'SHORT_TERM' ? 'Short-term' : 'Long-term'}
                variant={selectedJob.type === 'SHORT_TERM' ? 'warning' : 'info'}
                icon={
                  <Ionicons
                    name={selectedJob.type === 'SHORT_TERM' ? 'flash' : 'calendar-outline'}
                    size={11}
                    color={
                      selectedJob.type === 'SHORT_TERM'
                        ? colors.warningText
                        : colors.infoText
                    }
                  />
                }
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDistance(selectedJob.approximateDistance)}
              </Text>
            </View>
          </View>

          <Text
            style={{
              ...typography.heading,
              fontSize: 17,
              color: colors.text,
              fontWeight: '700',
            }}
            numberOfLines={1}
          >
            {selectedJob.title}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <View>
              <Text
                style={{
                  ...typography.title,
                  fontSize: 18,
                  lineHeight: 24,
                  color: colors.primary,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatPay(selectedJob.pay, selectedJob.payUnit)}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Direct payout upon completion
              </Text>
            </View>

            <Button
              label="View Gig"
              variant="primary"
              size="sm"
              onPress={() => router.push(`/(app)/job/${selectedJob.id}`)}
              rightIcon={<Ionicons name="arrow-forward" size={14} color="#FFFFFF" />}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
