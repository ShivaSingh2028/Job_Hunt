import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { Card } from '../ui/Card';
import { reportService } from '../../services';
import type { ReportReason } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: 'JOB' | 'USER';
  targetId: string;
  targetTitle?: string;
}

const REASONS: { label: string; value: ReportReason }[] = [
  { label: 'Spam or Misleading Information', value: 'SPAM' },
  { label: 'Inappropriate Content or Language', value: 'INAPPROPRIATE' },
  { label: 'Fraudulent Activity or Scam', value: 'FRAUD' },
  { label: 'Harassment or Unprofessional Behavior', value: 'HARASSMENT' },
  { label: 'Other Trust & Safety Violation', value: 'OTHER' },
];

export function ReportDialog({ visible, onClose, targetType, targetId, targetTitle }: Props) {
  const { colors, typography, spacing, radii, shadow } = useTheme();
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a brief description of the issue.');
      return;
    }
    setLoading(true);
    try {
      await reportService.submitReport({
        targetType,
        targetId,
        reason,
        description: description.trim(),
      });
      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Campus Trust & Safety will review this report promptly.',
        [{ text: 'OK', onPress: onClose }]
      );
      setDescription('');
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Could not submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Card
          variant="elevated"
          style={{
            padding: spacing.xl,
            gap: spacing.md,
            maxHeight: '85%',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.full,
                  backgroundColor: colors.dangerBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flag" size={18} color={colors.dangerText} />
              </View>
              <Text style={{ ...typography.heading, fontSize: 18, color: colors.text, fontWeight: '700' }}>
                Report {targetType === 'JOB' ? 'Gig Listing' : 'Student'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              accessibilityRole="button"
              accessibilityLabel="Close report dialog"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {targetTitle && (
            <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>
              Regarding: <Text style={{ color: colors.text, fontWeight: '600' }}>"{targetTitle}"</Text>
            </Text>
          )}

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>
              REASON FOR REPORT
            </Text>
            <View style={{ gap: 8, marginBottom: spacing.md }}>
              {REASONS.map((r) => {
                const isSelected = reason === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing.md,
                      borderRadius: radii.md,
                      backgroundColor: isSelected ? colors.primaryBg : colors.surfaceSecondary,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.borderSubtle,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.body,
                        fontSize: 14,
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {r.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextField
              label="Incident Description"
              placeholder="Provide specific details about what occurred..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              helperText="Reports are strictly confidential and reviewed by platform administrators."
            />
          </ScrollView>

          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <Button
              label="Submit Confidential Report"
              onPress={handleSubmit}
              loading={loading}
              variant="destructive"
              size="lg"
              fullWidth
            />
            <Button
              label="Cancel"
              onPress={onClose}
              variant="ghost"
              size="md"
              fullWidth
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
