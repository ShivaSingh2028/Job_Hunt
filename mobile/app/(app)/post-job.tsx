import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { jobService } from '../../src/services';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import type { JobType, PayUnit } from '../../src/types';
import { validateShortTermHours } from '../../src/utils/businessRules';

export default function PostJobScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const { user } = useAuthStore();

  const [type, setType] = useState<JobType>('SHORT_TERM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pay, setPay] = useState('');
  const [payUnit, setPayUnit] = useState<PayUnit>('FIXED');
  const [openings, setOpenings] = useState('1');
  const [isRemote, setIsRemote] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Campus Student Center, Room 204');
  const [startDate, setStartDate] = useState('2026-10-25');
  const [endDate, setEndDate] = useState('2026-10-25');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!pay || isNaN(Number(pay)) || Number(pay) <= 0) e.pay = 'Enter a valid pay amount';
    if (!openings || isNaN(Number(openings)) || Number(openings) < 1) e.openings = 'Min 1 opening';

    if (type === 'SHORT_TERM') {
      if (!startTime || !endTime) e.time = 'Start and end time required';
      else if (!validateShortTermHours(startTime, endTime)) {
        e.time = 'Short-term gigs cannot exceed 5 hours in duration.';
      }
    } else {
      if (!startDate || !endDate) e.date = 'Start and end date required';
      else if (new Date(startDate) >= new Date(endDate)) {
        e.date = 'End date must be after start date.';
      }
    }

    if (!isRemote && !locationLabel.trim()) {
      e.location = 'On-site jobs require an exact location/address';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePost = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await jobService.createJob({
        type,
        title: title.trim(),
        description: description.trim(),
        pay: Number(pay),
        payUnit,
        openings: Number(openings),
        isRemote: type === 'SHORT_TERM' ? false : isRemote,
        location: isRemote ? undefined : {
          lat: user?.location?.lat ?? 28.6145,
          lng: user?.location?.lng ?? 77.2085,
          label: locationLabel.trim(),
        },
        startDate,
        endDate: type === 'SHORT_TERM' ? startDate : endDate,
        startTime: type === 'SHORT_TERM' ? startTime : undefined,
        endTime: type === 'SHORT_TERM' ? endTime : undefined,
      });

      Alert.alert(
        'Listing Published',
        'Your gig is now live and visible to students within campus radius.',
        [{ text: 'View My Posts', onPress: () => router.replace('/(app)/my-jobs') }]
      );
    } catch (e: any) {
      Alert.alert('Post Failed', e?.message || 'Could not post gig.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>Publish a Gig</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        {/* Job Type Selector */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.label, color: colors.textSecondary }}>GIG TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => {
                setType('SHORT_TERM');
                setIsRemote(false);
                setPayUnit('FIXED');
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: type === 'SHORT_TERM' ? colors.primaryLight : colors.bgSecondary,
                borderWidth: 1.5,
                borderColor: type === 'SHORT_TERM' ? colors.primary : colors.border,
                gap: 6,
              }}
            >
              <Ionicons
                name="flash"
                size={20}
                color={type === 'SHORT_TERM' ? colors.primary : colors.textSecondary}
              />
              <Text style={{ ...typography.headingSm, color: type === 'SHORT_TERM' ? colors.primary : colors.text, fontWeight: '700' }}>
                Short-Term
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                On-site · Up to 5 hrs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setType('LONG_TERM');
                setPayUnit('PER_MONTH');
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: type === 'LONG_TERM' ? colors.primaryLight : colors.bgSecondary,
                borderWidth: 1.5,
                borderColor: type === 'LONG_TERM' ? colors.primary : colors.border,
                gap: 6,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={type === 'LONG_TERM' ? colors.primary : colors.textSecondary}
              />
              <Text style={{ ...typography.headingSm, color: type === 'LONG_TERM' ? colors.primary : colors.text, fontWeight: '700' }}>
                Long-Term
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                1-2 months · Remote / On-site
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Inputs */}
        <Input
          label="Gig Title *"
          placeholder="e.g. Science Lab Assistant, Event Coordinator"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Input
          label="Description *"
          placeholder="Detailed tasks, responsibilities, prerequisites..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 70, textAlignVertical: 'top' }}
          error={errors.description}
        />

        {/* Pay & Unit */}
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.label, color: colors.textSecondary }}>COMPENSATION *</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Input
              placeholder="Amount (₹)"
              value={pay}
              onChangeText={setPay}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              error={errors.pay}
            />
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {(type === 'SHORT_TERM' ? (['FIXED', 'PER_HOUR'] as PayUnit[]) : (['PER_MONTH', 'PER_HOUR', 'FIXED'] as PayUnit[])).map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setPayUnit(u)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    backgroundColor: payUnit === u ? colors.primary : colors.bgSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: payUnit === u ? '#fff' : colors.text,
                  }}>
                    {u === 'FIXED' ? 'Fixed' : u === 'PER_HOUR' ? '/hr' : '/mo'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Openings */}
        <Input
          label="Number of Openings (Default: 1)"
          placeholder="1"
          value={openings}
          onChangeText={setOpenings}
          keyboardType="numeric"
          error={errors.openings}
        />

        {/* Remote toggle (Long-term only) */}
        {type === 'LONG_TERM' && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.bgSecondary,
            padding: spacing.md,
            borderRadius: radii.lg,
          }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="globe-outline" size={16} color={colors.text} />
                <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Remote Opportunity</Text>
              </View>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                Remote gigs are visible to students everywhere.
              </Text>
            </View>
            <Switch
              value={isRemote}
              onValueChange={setIsRemote}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        )}

        {/* Exact Location (On-site only) */}
        {!isRemote && (
          <Input
            label="Reporting Location / Building & Room *"
            placeholder="e.g. North Campus, Block C, Room 201"
            value={locationLabel}
            onChangeText={setLocationLabel}
            error={errors.location}
          />
        )}

        {/* Time / Dates */}
        {type === 'SHORT_TERM' ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.textSecondary }}>DATE & HOURS (MAX 5 HOURS) *</Text>
            <Input
              label="Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input
                label="Start Time (HH:MM)"
                value={startTime}
                onChangeText={setStartTime}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="End Time (HH:MM)"
                value={endTime}
                onChangeText={setEndTime}
                containerStyle={{ flex: 1 }}
              />
            </View>
            {errors.time && (
              <Text style={{ ...typography.bodySm, color: colors.error }}>{errors.time}</Text>
            )}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.textSecondary }}>DURATION (1-2 MONTHS) *</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input
                label="Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="End Date (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
                containerStyle={{ flex: 1 }}
              />
            </View>
            {errors.date && (
              <Text style={{ ...typography.bodySm, color: colors.error }}>{errors.date}</Text>
            )}
          </View>
        )}

        {/* Submit */}
        <Button
          label="Publish Gig"
          onPress={handlePost}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
