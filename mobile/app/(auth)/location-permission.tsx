import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { userService } from '../../src/services';

const LOCATION_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'locate-outline', title: 'Hyperlocal Discovery', desc: 'Browse verified opportunities within your commute radius' },
  { icon: 'shield-checkmark-outline', title: 'Privacy Guaranteed', desc: 'Exact building addresses revealed only upon confirmed acceptance' },
  { icon: 'options-outline', title: 'Full User Control', desc: 'Modify or preset your campus hub anytime in settings' },
];

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const label = geo[0] ? `${geo[0].city || ''}, ${geo[0].region || ''}`.replace(/^, |, $/, '') : 'Current Campus Area';
        await userService.updateLocation(loc.coords.latitude, loc.coords.longitude, label);
        router.replace('/(app)');
      } else {
        router.push('/(auth)/location-picker');
      }
    } catch {
      Alert.alert('Location Notice', 'Could not access GPS. Please select your campus manually.');
      router.push('/(auth)/location-picker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.xl, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="location-sharp" size={44} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            Opportunities Near You
          </Text>
          <Text style={{ ...typography.bodyLg, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 320 }}>
            JobHunt uses your location to present verified student gigs within 5 km of your campus.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {LOCATION_BENEFITS.map((item, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              gap: spacing.md,
              backgroundColor: colors.bgSecondary,
              borderRadius: radii.lg,
              padding: spacing.md,
              alignItems: 'center',
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>{item.title}</Text>
                <Text style={{ ...typography.bodySm, color: colors.textSecondary, marginTop: 2 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Button label="Enable Real-Time Location" onPress={requestLocation} loading={loading} fullWidth size="lg" />
          <Button
            label="Select Campus Manually"
            onPress={() => router.push('/(auth)/location-picker')}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
