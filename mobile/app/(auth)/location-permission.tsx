import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { userService } from '../../src/services';

const LOCATION_BENEFITS = [
  {
    icon: 'locate-outline' as const,
    title: 'Hyperlocal discovery',
    desc: 'Browse verified opportunities within your 5 km campus radius.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Privacy guaranteed',
    desc: 'Exact task addresses are revealed only upon confirmed gig acceptance.',
  },
  {
    icon: 'options-outline' as const,
    title: 'Full user control',
    desc: 'Modify or preset your campus area anytime in profile preferences.',
  },
];

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { colors, isDark, typography, spacing, radii } = useTheme();
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        const label = geo[0]
          ? `${geo[0].city || ''}, ${geo[0].region || ''}`.replace(/^, |, $/, '')
          : 'Current Campus Area';
        await userService.updateLocation(loc.coords.latitude, loc.coords.longitude, label);
        router.replace('/(app)');
      } else {
        router.push('/(auth)/location-picker');
      }
    } catch {
      Alert.alert('Location Notice', 'Could not access GPS. Please choose your campus manually.');
      router.push('/(auth)/location-picker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          padding: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.xxl, paddingTop: spacing.md }}>
          {/* Header Graphic */}
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: radii.full,
                backgroundColor: colors.primaryBg,
                borderWidth: 1,
                borderColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xs,
              }}
            >
              <Ionicons name="location-outline" size={38} color={colors.primary} />
            </View>
            <Text
              style={{
                ...typography.title,
                fontSize: 26,
                lineHeight: 34,
                color: colors.text,
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              Opportunities near you
            </Text>
            <Text
              style={{
                ...typography.body,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 320,
              }}
            >
              JobHunt uses your location to present verified student gigs within 5 km of your campus.
            </Text>
          </View>

          {/* Benefits Cards */}
          <View style={{ gap: spacing.sm }}>
            {LOCATION_BENEFITS.map((item, i) => (
              <Card
                key={i}
                variant="outlined"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radii.md,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      ...typography.body,
                      fontWeight: '600',
                      color: colors.text,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      ...typography.secondary,
                      color: colors.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    {item.desc}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: spacing.sm, paddingTop: spacing.xl }}>
          <Button
            label="Enable Real-Time Location"
            onPress={requestLocation}
            loading={loading}
            fullWidth
            size="lg"
          />
          <Button
            label="Select Campus Manually"
            onPress={() => router.push('/(auth)/location-picker')}
            variant="ghost"
            fullWidth
            size="md"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
