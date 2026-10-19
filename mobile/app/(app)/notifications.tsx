import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useJobStore } from '../../src/store/jobStore';
import { notificationService } from '../../src/services';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import type { Notification, NotifType } from '../../src/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow } = useTheme();
  const { setUnreadCount } = useJobStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getNotifMeta = (type: NotifType): { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
    switch (type) {
      case 'JOB_ACCEPTED':
        return { icon: 'checkmark-circle-outline', color: colors.success, bg: `${colors.success}18` };
      case 'SEEKER_CANCELLED':
        return { icon: 'alert-circle-outline', color: colors.warning, bg: `${colors.warning}18` };
      case 'RECRUITER_CANCELLED':
        return { icon: 'close-circle-outline', color: colors.error, bg: `${colors.error}18` };
      case 'BLOCKED':
        return { icon: 'lock-closed-outline', color: colors.error, bg: `${colors.error}18` };
      case 'REMINDER':
        return { icon: 'time-outline', color: colors.primary, bg: `${colors.primary}18` };
      case 'REPORT_RESOLVED':
        return { icon: 'shield-checkmark-outline', color: colors.info, bg: `${colors.info}18` };
      default:
        return { icon: 'notifications-outline', color: colors.primary, bg: `${colors.primary}18` };
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
    setNotifications(n => n.map(item => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const handlePressNotif = async (item: Notification) => {
    if (!item.isRead) {
      await notificationService.markRead(item.id);
      setNotifications(list => list.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    }
    if (item.relatedJobId) {
      router.push(`/(app)/job/${item.relatedJobId}`);
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
        <View>
          <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>Activity & Real-Time Alerts</Text>
          <Text style={{ ...typography.displayMd, color: colors.text, fontWeight: '800' }}>Notifications</Text>
        </View>

        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ ...typography.label, color: colors.primary, fontWeight: '700' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <LoadingSpinner message="Checking notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const meta = getNotifMeta(item.type);
            return (
              <TouchableOpacity
                onPress={() => handlePressNotif(item)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: item.isRead ? colors.card : colors.primaryLight,
                  borderRadius: radii.xl,
                  padding: spacing.md,
                  flexDirection: 'row',
                  gap: spacing.md,
                  alignItems: 'flex-start',
                  borderWidth: 1,
                  borderColor: item.isRead ? colors.border : colors.primary,
                  ...shadow.sm,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: meta.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}>
                      {item.title}
                    </Text>
                    {!item.isRead && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                    )}
                  </View>
                  <Text style={{ ...typography.bodyMd, color: colors.textSecondary, lineHeight: 20 }}>
                    {item.body}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              iconName="notifications-outline"
              title="All caught up"
              description="You have no notifications at this time. Upcoming gigs and schedule alerts will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
