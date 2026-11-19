import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useJobStore } from '../../src/store/jobStore';
import { notificationService } from '../../src/services';
import { SkeletonJobCard } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import type { Notification, NotifType } from '../../src/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { setUnreadCount } = useJobStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getNotifMeta = (
    type: NotifType
  ): { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; badge: string; badgeVariant: 'primary' | 'success' | 'warning' | 'danger' | 'info' } => {
    switch (type) {
      case 'JOB_ACCEPTED':
        return {
          icon: 'checkmark-circle-outline',
          color: colors.successText,
          bg: colors.successBg,
          badge: 'Confirmed',
          badgeVariant: 'success',
        };
      case 'SEEKER_CANCELLED':
        return {
          icon: 'alert-circle-outline',
          color: colors.warningText,
          bg: colors.warningBg,
          badge: 'Cancelled',
          badgeVariant: 'warning',
        };
      case 'RECRUITER_CANCELLED':
        return {
          icon: 'close-circle-outline',
          color: colors.dangerText,
          bg: colors.dangerBg,
          badge: 'Withdrawn',
          badgeVariant: 'danger',
        };
      case 'BLOCKED':
        return {
          icon: 'lock-closed-outline',
          color: colors.dangerText,
          bg: colors.dangerBg,
          badge: 'Suspension',
          badgeVariant: 'danger',
        };
      case 'REMINDER':
        return {
          icon: 'time-outline',
          color: colors.primary,
          bg: colors.primaryBg,
          badge: 'Reminder',
          badgeVariant: 'primary',
        };
      case 'REPORT_RESOLVED':
        return {
          icon: 'shield-checkmark-outline',
          color: colors.infoText,
          bg: colors.infoBg,
          badge: 'Trust & Safety',
          badgeVariant: 'info',
        };
      default:
        return {
          icon: 'notifications-outline',
          color: colors.primary,
          bg: colors.primaryBg,
          badge: 'Notice',
          badgeVariant: 'primary',
        };
    }
  };

  const fetchNotifs = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const handlePressNotif = async (item: Notification) => {
    if (!item.isRead) {
      await notificationService.markRead(item.id);
      setNotifications((list) =>
        list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.relatedJobId) {
      router.push(`/(app)/job/${item.relatedJobId}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        }}
      >
        <View>
          <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
            Activity & Updates
          </Text>
          <Text
            style={{
              ...typography.title,
              fontSize: 24,
              color: colors.text,
              fontWeight: '700',
            }}
          >
            Notifications
          </Text>
        </View>

        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radii.full,
              backgroundColor: colors.primaryBg,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '700' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const meta = getNotifMeta(item.type);
            return (
              <TouchableOpacity
                onPress={() => handlePressNotif(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${item.body}`}
              >
                <Card
                  variant={item.isRead ? 'elevated' : 'outlined'}
                  style={{
                    backgroundColor: item.isRead ? colors.surface : colors.primaryBg,
                    borderColor: item.isRead ? colors.borderSubtle : colors.primary,
                    borderWidth: item.isRead ? 1 : 1.5,
                    padding: spacing.md,
                    flexDirection: 'row',
                    gap: spacing.md,
                    alignItems: 'flex-start',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radii.full,
                      backgroundColor: meta.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text
                        style={{
                          ...typography.heading,
                          fontSize: 15,
                          color: colors.text,
                          fontWeight: '700',
                          flex: 1,
                          paddingRight: 8,
                        }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Badge label={meta.badge} variant={meta.badgeVariant} size="sm" />
                    </View>

                    <Text
                      style={{
                        ...typography.body,
                        fontSize: 13,
                        color: colors.textSecondary,
                        lineHeight: 18,
                      }}
                    >
                      {item.body}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              iconName="notifications-outline"
              title="All caught up"
              description="You have no unread notifications. Schedule alerts, student acceptances, and coordination updates will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
