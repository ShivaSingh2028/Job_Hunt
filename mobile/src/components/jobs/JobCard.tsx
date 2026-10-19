import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../ui/Badge';
import type { Job } from '../../types';
import { formatPay, formatDistance, formatDate, formatTime } from '../../utils/businessRules';

interface Props {
  job: Job;
  onPress: () => void;
  compact?: boolean;
}

export function JobCard({ job, onPress, compact }: Props) {
  const { colors, typography, spacing, radii, shadow } = useTheme();

  const statusVariant = {
    OPEN: 'success',
    FILLED: 'warning',
    COMPLETED: 'info',
    CANCELLED: 'error',
  }[job.status] as any;

  const remainingSlots = Math.max(0, job.openings - job.filledCount);
  const isShortTerm = job.type === 'SHORT_TERM';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: colors.card,
        borderRadius: radii.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
        ...shadow.sm,
      }}
    >
      {/* Top row: type badge + distance + bookmark */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: isShortTerm ? `${colors.warning}18` : `${colors.info}18`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radii.full,
            }}
          >
            <Ionicons
              name={isShortTerm ? 'flash' : 'calendar-outline'}
              size={12}
              color={isShortTerm ? colors.warning : colors.info}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: isShortTerm ? colors.warning : colors.info,
              }}
            >
              {isShortTerm ? 'Short-term' : 'Long-term'}
            </Text>
          </View>

          {job.isSaved && (
            <Ionicons name="bookmark" size={14} color={colors.primary} />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name={job.isRemote ? 'globe-outline' : 'location-outline'}
            size={13}
            color={colors.textMuted}
          />
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            {job.isRemote ? 'Remote' : formatDistance(job.approximateDistance)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={{ ...typography.headingMd, color: colors.text, fontWeight: '700' }} numberOfLines={2}>
        {job.title}
      </Text>

      {!compact && (
        <Text style={{ ...typography.bodyMd, color: colors.textSecondary }} numberOfLines={2}>
          {job.description}
        </Text>
      )}

      {/* Meta row */}
      <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginTop: 2, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="cash-outline" size={15} color={colors.primary} />
          <Text style={{ ...typography.headingSm, color: colors.primary, fontWeight: '800' }}>
            {formatPay(job.pay, job.payUnit)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name="people-outline"
            size={14}
            color={remainingSlots === 1 ? colors.error : colors.textSecondary}
          />
          <Text
            style={{
              ...typography.bodySm,
              color: remainingSlots === 1 ? colors.error : colors.textSecondary,
              fontWeight: remainingSlots === 1 ? '700' : '500',
            }}
          >
            {remainingSlots} {remainingSlots === 1 ? 'slot remaining' : 'slots left'}
          </Text>
        </View>

        {isShortTerm && job.startTime && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
              {formatTime(job.startTime)} – {formatTime(job.endTime)}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          marginTop: 4,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.textMuted }}>
          By {job.postedBy.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            {formatDate(job.startDate)}
          </Text>
          <Badge label={job.status} variant={statusVariant} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
