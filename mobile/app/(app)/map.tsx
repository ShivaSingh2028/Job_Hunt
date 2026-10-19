import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
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

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow } = useTheme();
  const { user } = useAuthStore();
  const { jobs, setJobs } = useJobStore();
  const { coords, locationName, isLocating, refreshLocation } = useLiveLocation();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const mapRef = useRef<MapView>(null);

  const liveLat = coords?.lat ?? user?.location?.lat ?? 28.6139;
  const liveLng = coords?.lng ?? user?.location?.lng ?? 77.2090;

  useEffect(() => {
    jobService.getJobs(liveLat, liveLng).then(r => {
      setJobs(r.jobs);
      if (r.jobs.length > 0) setSelectedJob(r.jobs[0]);
    }).catch(() => {});
  }, [liveLat, liveLng]);

  useEffect(() => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }, 800);
    }
  }, [coords?.lat, coords?.lng]);

  const onSiteJobs = jobs.filter(j => !j.isRemote && j.location.lat !== 0);

  const centerOnUser = () => {
    refreshLocation();
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: liveLat,
        longitude: liveLng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
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
        {/* OpenStreetMap free tile overlay */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* User Real-Time Live Location Marker */}
        <Marker
          coordinate={{ latitude: liveLat, longitude: liveLng }}
          title="Your Live Location"
          description={locationName || 'Live GPS Location'}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(14, 165, 233, 0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: '#0ea5e9',
                borderWidth: 2,
                borderColor: '#ffffff',
              }} />
            </View>
          </View>
        </Marker>

        {/* 5 km radius circle around live location */}
        <Circle
          center={{ latitude: liveLat, longitude: liveLng }}
          radius={5000} // 5 km = 5000 meters
          strokeColor="rgba(124, 58, 237, 0.6)"
          fillColor="rgba(124, 58, 237, 0.08)"
          strokeWidth={2}
        />

        {/* Job Pins */}
        {onSiteJobs.map(job => {
          const isSelected = selectedJob?.id === job.id;
          const isShortTerm = job.type === 'SHORT_TERM';
          return (
            <Marker
              key={job.id}
              coordinate={{ latitude: job.location.lat, longitude: job.location.lng }}
              onPress={() => setSelectedJob(job)}
            >
              <View style={{
                backgroundColor: isSelected ? colors.primary : '#fff',
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: radii.full,
                borderWidth: 2,
                borderColor: colors.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Ionicons
                  name={isShortTerm ? 'flash' : 'calendar-outline'}
                  size={12}
                  color={isSelected ? '#fff' : colors.primary}
                />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isSelected ? '#fff' : colors.primary,
                }}>
                  ₹{job.pay}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Overlay Header */}
      <View style={{
        position: 'absolute',
        top: 50,
        left: spacing.lg,
        right: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{
          backgroundColor: colors.card,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: radii.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow.md,
        }}>
          <Ionicons name="location-sharp" size={16} color={colors.primary} />
          <View>
            <Text style={{ ...typography.caption, color: colors.text, fontWeight: '700' }}>
              {locationName || 'Live GPS'}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              5 km Campus Radius • {onSiteJobs.length} gigs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={centerOnUser}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...shadow.md,
          }}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Selected Job Card */}
      {selectedJob && (
        <View style={{
          position: 'absolute',
          bottom: 24,
          left: spacing.lg,
          right: spacing.lg,
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
          ...shadow.lg,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: selectedJob.type === 'SHORT_TERM' ? `${colors.warning}18` : `${colors.info}18`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radii.full,
            }}>
              <Ionicons
                name={selectedJob.type === 'SHORT_TERM' ? 'flash' : 'calendar-outline'}
                size={12}
                color={selectedJob.type === 'SHORT_TERM' ? colors.warning : colors.info}
              />
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                color: selectedJob.type === 'SHORT_TERM' ? colors.warning : colors.info,
              }}>
                {selectedJob.type === 'SHORT_TERM' ? 'Short-term' : 'Long-term'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                {formatDistance(selectedJob.approximateDistance)}
              </Text>
            </View>
          </View>

          <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }} numberOfLines={1}>
            {selectedJob.title}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ ...typography.headingSm, color: colors.primary, fontWeight: '800' }}>
                {formatPay(selectedJob.pay, selectedJob.payUnit)}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Direct payout upon completion
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/(app)/job/${selectedJob.id}`)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>View Gig</Text>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </TouchableOpacity>
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
