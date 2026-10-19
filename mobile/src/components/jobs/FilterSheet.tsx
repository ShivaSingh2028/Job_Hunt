import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { JobFilters, JobType } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: JobFilters;
  onApply: (f: JobFilters) => void;
}

export function FilterSheet({ visible, onClose, filters, onApply }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const [local, setLocal] = useState<JobFilters>(filters);

  const typeOptions: { label: string; value: JobType; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Short-term (Up to 5 hrs)', value: 'SHORT_TERM', icon: 'flash-outline' },
    { label: 'Long-term (1-2 months)', value: 'LONG_TERM', icon: 'calendar-outline' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ ...typography.headingLg, color: colors.text, fontWeight: '800' }}>Filter Gigs</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
          {/* Job type filter */}
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Duration / Gig Type</Text>
            <View style={{ gap: spacing.sm }}>
              {typeOptions.map((opt) => {
                const active = local.type === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setLocal((l) => ({ ...l, type: active ? undefined : opt.value }))}
                    style={{
                      padding: spacing.md,
                      borderRadius: radii.lg,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: active ? colors.primaryLight : colors.bgSecondary,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={{
                          ...typography.headingSm,
                          color: active ? colors.primary : colors.text,
                          fontWeight: '600',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Pay filter */}
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>Compensation (₹)</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Input
                placeholder="Min Pay (₹)"
                value={local.minPay !== undefined ? String(local.minPay) : ''}
                onChangeText={(v) => setLocal((l) => ({ ...l, minPay: v ? Number(v) : undefined }))}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
              <Input
                placeholder="Max Pay (₹)"
                value={local.maxPay !== undefined ? String(local.maxPay) : ''}
                onChangeText={(v) => setLocal((l) => ({ ...l, maxPay: v ? Number(v) : undefined }))}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            padding: spacing.lg,
            gap: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Button label="Apply Filters" onPress={() => onApply(local)} fullWidth size="lg" />
          <Button
            label="Reset Filters"
            onPress={() => {
              setLocal({});
              onApply({});
            }}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}
