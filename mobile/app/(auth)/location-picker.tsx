import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { userService } from '../../src/services';

const CAMPUS_PRESETS = [
  { label: 'Delhi University, North Campus', subtitle: 'New Delhi, Delhi', lat: 28.689, lng: 77.2098 },
  { label: 'IIT Delhi, Hauz Khas', subtitle: 'New Delhi, Delhi', lat: 28.5454, lng: 77.1926 },
  { label: 'JNU, New Mehrauli Road', subtitle: 'New Delhi, Delhi', lat: 28.5405, lng: 77.1675 },
  { label: 'Jamia Millia Islamia, Okhla', subtitle: 'New Delhi, Delhi', lat: 28.5616, lng: 77.2802 },
  { label: 'Mumbai University, Kalina', subtitle: 'Mumbai, Maharashtra', lat: 18.9322, lng: 72.8264 },
  { label: 'IIT Bombay, Powai', subtitle: 'Mumbai, Maharashtra', lat: 19.1334, lng: 72.9133 },
  { label: 'Pune University (SPPU), Ganeshkhind', subtitle: 'Pune, Maharashtra', lat: 18.5526, lng: 73.8277 },
  { label: 'COEP Tech University, Shivajinagar', subtitle: 'Pune, Maharashtra', lat: 18.5308, lng: 73.8553 },
  { label: 'IISc Bangalore, Malleshwaram', subtitle: 'Bangalore, Karnataka', lat: 13.0219, lng: 77.5671 },
  { label: 'Bangalore University, Jnana Bharathi', subtitle: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
];

export default function LocationPickerScreen() {
  const router = useRouter();
  const { colors, isDark, typography, spacing, radii } = useTheme();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof CAMPUS_PRESETS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = CAMPUS_PRESETS.filter(
    (p) =>
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert('Select Campus', 'Please choose a campus hub to continue.');
      return;
    }
    setLoading(true);
    try {
      await userService.updateLocation(selected.lat, selected.lng, selected.label);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Location Error', e?.message || 'Could not update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        {/* Top Header */}
        <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              marginBottom: spacing.xs,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={{ ...typography.secondary, color: colors.text, fontWeight: '600' }}>
              Back
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              ...typography.title,
              fontSize: 26,
              lineHeight: 34,
              color: colors.text,
              fontWeight: '700',
            }}
          >
            Select campus hub
          </Text>
          <Text
            style={{
              ...typography.secondary,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            Choose your campus area so JobHunt can show gigs within 5 km of you.
          </Text>
        </View>

        {/* Search Input */}
        <View style={{ marginBottom: spacing.md }}>
          <TextField
            placeholder="Search campus or city..."
            value={search}
            onChangeText={setSearch}
            leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
          />
        </View>

        {/* Campus List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.label}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, gap: spacing.sm }}
          renderItem={({ item }) => {
            const isSelected = selected?.label === item.label;
            return (
              <TouchableOpacity
                onPress={() => setSelected(item)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={{
                  backgroundColor: isSelected ? colors.primaryBg : colors.surface,
                  borderRadius: radii.card,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : colors.borderSubtle,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.full,
                    backgroundColor: isSelected ? colors.primary : colors.bgTertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      ...typography.body,
                      fontWeight: isSelected ? '700' : '600',
                      color: colors.text,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.textSecondary,
                    }}
                  >
                    {item.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? colors.primary : colors.border}
                />
              </TouchableOpacity>
            );
          }}
        />

        {/* Sticky Confirm Button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.xl,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <Button
            label="Confirm Campus Location"
            onPress={handleConfirm}
            disabled={!selected || loading}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
