import React, { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { colors, typography } = useTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44 }}>
      <View style={{ width: 28, height: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Ionicons
          name={focused ? focusedName : name}
          size={24}
          color={focused ? colors.primary : colors.textSecondary}
        />
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -9,
              backgroundColor: colors.danger,
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 10,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
                includeFontPadding: false,
              }}
            >
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          ...typography.caption,
          fontSize: 11,
          lineHeight: 14,
          color: focused ? colors.primary : colors.textSecondary,
          fontWeight: focused ? '700' : '500',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { unreadCount, setUnreadCount } = useJobStore();
  const insets = useSafeAreaInsets();
  const isSeeker = user?.activeMode === 'SEEKER';

  useEffect(() => {
    if (isAuthenticated) {
      notificationService
        .getNotifications(1)
        .then((r) => setUnreadCount(r.unreadCount))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {user?.isBlocked && <BlockedBanner blockedUntil={user.blockedUntil} />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSubtle,
            borderTopWidth: 1,
            height: 56 + bottomInset,
            paddingTop: 8,
            paddingBottom: bottomInset,
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
                name={isSeeker ? 'briefcase-outline' : 'document-text-outline'}
                focusedName={isSeeker ? 'briefcase' : 'document-text'}
                label={isSeeker ? 'My Gigs' : 'Posts'}
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
        <Tabs.Screen
          name="design-preview"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </View>
  );
}
