import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
      Alert.alert('Report Submitted', 'Thank you for reporting. Our Trust & Safety team will review the issue promptly.', [
        { text: 'OK', onPress: onClose },
      ]);
      setDescription('');
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Could not submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.lg }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.xl,
          gap: spacing.md,
          maxHeight: '85%',
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow.lg,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flag-outline" size={20} color={colors.error} />
              <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }}>
                Report {targetType === 'JOB' ? 'Listing' : 'Account'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {targetTitle && (
            <Text style={{ ...typography.bodySm, color: colors.textSecondary }} numberOfLines={1}>
              Regarding: <Text style={{ color: colors.text, fontWeight: '600' }}>"{targetTitle}"</Text>
            </Text>
          )}

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.3 }}>
              REASON FOR REPORTING
            </Text>
            <View style={{ gap: 8, marginBottom: spacing.md }}>
              {REASONS.map(r => {
                const isSelected = reason === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing.md,
                      borderRadius: radii.md,
                      backgroundColor: isSelected ? colors.primaryLight : colors.bgSecondary,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    }}
                  >
                    <Text style={{
                      ...typography.bodyMd,
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    }}>
                      {r.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Incident Description *"
              placeholder="Describe what occurred with specific details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />
          </ScrollView>

          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <Button
              label="Submit Report"
              onPress={handleSubmit}
              loading={loading}
              variant="danger"
              fullWidth
            />
            <Button
              label="Cancel"
              onPress={onClose}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
