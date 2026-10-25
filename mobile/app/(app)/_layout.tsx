import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { BlockedBanner } from '../../src/components/ui/BlockedBanner';
import { useJobStore } from '../../src/store/jobStore';
import { notificationService } from '../../src/services';

function TabIcon({
  name,
  focusedName,
  label,
  focused,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  badge?: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 54 }}>
      <View style={{ position: 'relative' }}>
        <Ionicons
          name={focused ? focusedName : name}
          size={22}
          color={focused ? colors.primary : colors.textMuted}
        />
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -10,
              backgroundColor: colors.error,
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          fontSize: 11,
          color: focused ? colors.primary : colors.textMuted,
          fontWeight: focused ? '700' : '500',
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { unreadCount, setUnreadCount } = useJobStore();
  const isSeeker = user?.activeMode === 'SEEKER';

  useEffect(() => {
    notificationService
      .getNotifications(1)
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {user?.isBlocked && <BlockedBanner blockedUntil={user.blockedUntil} />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 68,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="home-outline"
                focusedName="home"
                label="Home"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="chatbubbles-outline"
                focusedName="chatbubbles"
                label="Chat"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="my-jobs"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={isSeeker ? 'briefcase-outline' : 'layers-outline'}
                focusedName={isSeeker ? 'briefcase' : 'layers'}
                label={isSeeker ? 'My Gigs' : 'My Posts'}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="notifications-outline"
                focusedName="notifications"
                label="Alerts"
                focused={focused}
                badge={unreadCount}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="person-outline"
                focusedName="person"
                label="Profile"
                focused={focused}
              />
            ),
          }}
        />
        {/* Hidden sub-routes inside the app stack */}
        <Tabs.Screen
          name="map"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chat/[id]"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="job/[id]"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="post-job"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="saved-jobs"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </View>
  );
}
