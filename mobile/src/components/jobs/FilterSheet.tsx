import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
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

  const typeOptions: { label: string; value: JobType; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
    {
      label: 'Short-term',
      value: 'SHORT_TERM',
      icon: 'flash-outline',
      desc: 'Quick tasks up to 5 hours',
    },
    {
      label: 'Long-term',
      value: 'LONG_TERM',
      icon: 'calendar-outline',
      desc: 'Ongoing work for 1–2 months',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          }}
        >
          <View>
            <Text style={{ ...typography.title, fontSize: 20, color: colors.text, fontWeight: '700' }}>
              Filter Gigs
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
              Refine listings near campus
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.full,
              backgroundColor: colors.bgTertiary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gig Type Selection */}
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
              Duration & Type
            </Text>
            <View style={{ gap: spacing.sm }}>
              {typeOptions.map((opt) => {
                const active = local.type === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setLocal((l) => ({ ...l, type: active ? undefined : opt.value }))}
                    activeOpacity={0.75}
                    style={{
                      padding: spacing.md,
                      borderRadius: radii.card,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? colors.primary : colors.borderSubtle,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: radii.full,
                          backgroundColor: active ? colors.primary : colors.bgTertiary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? '#FFFFFF' : colors.textSecondary}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            ...typography.body,
                            color: colors.text,
                            fontWeight: active ? '700' : '600',
                          }}
                        >
                          {opt.label}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 1 }}>
                          {opt.desc}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={active ? colors.primary : colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Pay Range Filter */}
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '600' }}>
              Compensation (₹)
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Minimum Pay"
                  placeholder="e.g. 500"
                  value={local.minPay !== undefined ? String(local.minPay) : ''}
                  onChangeText={(v) =>
                    setLocal((l) => ({ ...l, minPay: v ? Number(v.replace(/[^0-9]/g, '')) : undefined }))
                  }
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="cash-outline" size={16} color={colors.textMuted} />}
                />
              </View>

              <View style={{ flex: 1 }}>
                <TextField
                  label="Maximum Pay"
                  placeholder="e.g. 10000"
                  value={local.maxPay !== undefined ? String(local.maxPay) : ''}
                  onChangeText={(v) =>
                    setLocal((l) => ({ ...l, maxPay: v ? Number(v.replace(/[^0-9]/g, '')) : undefined }))
                  }
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="cash-outline" size={16} color={colors.textMuted} />}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View
          style={{
            padding: spacing.xl,
            gap: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            label="Apply Filters"
            onPress={() => onApply(local)}
            fullWidth
            size="lg"
          />
          <Button
            label="Reset Filters"
            onPress={() => {
              setLocal({});
              onApply({});
            }}
            variant="ghost"
            fullWidth
            size="md"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
