import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Chip } from './Chip';
import { Badge } from './Badge';
import type { Job } from '../../types';
import { formatPay, formatDistance, formatDate, formatTime } from '../../utils/businessRules';

export interface JobCardProps {
  job: Job;
  onPress: () => void;
  compact?: boolean;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  style?: ViewStyle;
}

export function JobCard({
  job,
  onPress,
  compact = false,
  onQuickAction,
  quickActionLabel,
  style,
}: JobCardProps) {
  const { colors, typography, spacing, radii, shadow, isDark } = useTheme();

  const isShortTerm = job.type === 'SHORT_TERM';
  const remainingSlots = Math.max(0, job.openings - job.filledCount);

  const getStatusChip = () => {
    switch (job.status) {
      case 'OPEN':
        return { label: 'Open', variant: 'success' as const };
      case 'FILLED':
        return { label: 'Filled', variant: 'warning' as const };
      case 'COMPLETED':
        return { label: 'Completed', variant: 'info' as const };
      case 'CANCELLED':
        return { label: 'Cancelled', variant: 'danger' as const };
      default:
        return { label: job.status, variant: 'neutral' as const };
    }
  };

  const statusConfig = getStatusChip();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${formatPay(job.pay, job.payUnit)}`}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.card,
          padding: spacing.cardPadding,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.borderSubtle,
          gap: spacing.sm,
          ...shadow.sm,
        },
        style,
      ]}
    >
      {/* Top row: Type chip, distance, bookmark */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
          <Chip
            size="sm"
            label={isShortTerm ? 'Short-term' : 'Long-term'}
            variant={isShortTerm ? 'warning' : 'info'}
            icon={
              <Ionicons
                name={isShortTerm ? 'flash-outline' : 'calendar-outline'}
                size={12}
                color={isShortTerm ? colors.warningText : colors.infoText}
              />
            }
          />
          <Chip
            size="sm"
            label={statusConfig.label}
            variant={statusConfig.variant}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name={job.isRemote ? 'globe-outline' : 'location-outline'}
            size={13}
            color={colors.textMuted}
          />
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {job.isRemote ? 'Remote' : formatDistance(job.approximateDistance)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={{
          ...typography.heading,
          color: colors.text,
          fontWeight: '600',
        }}
        numberOfLines={2}
      >
        {job.title}
      </Text>

      {/* Description if not compact */}
      {!compact && job.description ? (
        <Text
          style={{
            ...typography.secondary,
            color: colors.textSecondary,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {job.description}
        </Text>
      ) : null}

      {/* Pay and slots row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              ...typography.title,
              fontSize: 18,
              lineHeight: 24,
              color: colors.primary,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatPay(job.pay, job.payUnit)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name="people-outline"
            size={14}
            color={remainingSlots <= 1 ? colors.dangerText : colors.textSecondary}
          />
          <Text
            style={{
              ...typography.caption,
              color: remainingSlots <= 1 ? colors.dangerText : colors.textSecondary,
              fontWeight: remainingSlots <= 1 ? '600' : '400',
              fontVariant: ['tabular-nums'],
            }}
          >
            {remainingSlots === 1 ? '1 slot left' : `${remainingSlots} slots left`}
          </Text>
        </View>
      </View>

      {/* Timing if short-term */}
      {isShortTerm && job.startTime && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatTime(job.startTime)} – {formatTime(job.endTime)}
          </Text>
        </View>
      )}

      {/* Footer: Posted by + Date + Quick Action */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          marginTop: 4,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.textMuted }}>
          By {job.postedBy?.name || 'Recruiter'}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatDate(job.startDate)}
          </Text>

          {quickActionLabel && onQuickAction ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onQuickAction();
              }}
              style={{
                backgroundColor: colors.primaryBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radii.chip,
                borderWidth: 1,
                borderColor: colors.primaryLight,
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: colors.primary,
                  fontWeight: '600',
                }}
              >
                {quickActionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
