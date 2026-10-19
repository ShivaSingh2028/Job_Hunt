import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { userService } from '../../src/services';

const CAMPUS_PRESETS = [
  { label: 'Delhi University, North Campus', subtitle: 'New Delhi, Delhi', lat: 28.6890, lng: 77.2098 },
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
  const { colors, typography, spacing, radii } = useTheme();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof CAMPUS_PRESETS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = CAMPUS_PRESETS.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert('Select Location', 'Please choose a campus or location to continue.');
      return;
    }
    setLoading(true);
    try {
      await userService.updateLocation(selected.lat, selected.lng, selected.label);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ gap: spacing.xs }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>
            Select Campus Hub
          </Text>
          <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>
            Choose your campus area so JobHunt can show gigs within 5 km of you.
          </Text>
        </View>

        {/* Search */}
        <Input
          placeholder="Search campus or city..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
        />

        {/* List of campuses */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.label}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const isSelected = selected?.label === item.label;
            return (
              <TouchableOpacity
                onPress={() => setSelected(item)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? colors.primaryLight : colors.bgSecondary,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: isSelected ? colors.primary : colors.bgTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color={isSelected ? '#fff' : colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    ...typography.headingSm,
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '700' : '600',
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{ ...typography.bodySm, color: colors.textSecondary, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                </View>
                {isSelected ? (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>No campus found</Text>
              <Text style={{ ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' }}>
                We are expanding to more campuses soon! Select the nearest city option above.
              </Text>
            </View>
          }
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={{ gap: spacing.xs }}>
          <Button
            label={selected ? `Set Location to ${selected.label.split(',')[0].trim()}` : 'Confirm Location'}
            onPress={handleConfirm}
            loading={loading}
            disabled={!selected}
            fullWidth
            size="lg"
          />
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            You can change your location anytime from your Profile settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
