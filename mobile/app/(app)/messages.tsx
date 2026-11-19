import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { chatService, getChatSocket } from '../../src/services';
import { SkeletonJobCard } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import type { Conversation } from '../../src/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
    }, [fetchConversations])
  );

  useEffect(() => {
    try {
      const socket = getChatSocket();
      if (user?.id) {
        socket.emit('join_user', user.id);
      }

      const handleLiveMessage = () => {
        fetchConversations(true);
      };

      socket.on('new_message', handleLiveMessage);
      socket.on('message_notification', handleLiveMessage);

      return () => {
        socket.off('new_message', handleLiveMessage);
        socket.off('message_notification', handleLiveMessage);
      };
    } catch {
      return () => {};
    }
  }, [user?.id, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.jobTitle.toLowerCase().includes(q) ||
      c.peer.name.toLowerCase().includes(q) ||
      (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
              Direct Campus Coordination
            </Text>
            <Text style={{ ...typography.title, fontSize: 24, color: colors.text, fontWeight: '700' }}>
              Messages
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.full,
              backgroundColor: colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
            accessibilityRole="button"
            accessibilityLabel="Refresh messages"
          >
            <Ionicons name="reload-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            height: 48,
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search conversations or gigs..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: colors.text, fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchConversations()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.sm,
            flexGrow: 1,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="chatbubbles-outline"
              title={search ? 'No conversations found' : 'No Messages Yet'}
              description={
                search
                  ? 'No messages match your search keyword.'
                  : 'Direct chat connects you with your gig partner once an application or post is confirmed.'
              }
              actionLabel={search ? 'Clear Search' : undefined}
              onAction={search ? () => setSearch('') : undefined}
            />
          }
          renderItem={({ item }) => {
            const hasUnread =
              item.lastMessage &&
              !item.lastMessage.isRead &&
              item.lastMessage.senderId !== user?.id;

            return (
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/(app)/chat/[id]',
                    params: {
                      id: item.id,
                      jobTitle: item.jobTitle,
                      peerName: item.peer.name,
                      peerRole: item.peer.role,
                      isVerified: item.peer.isVerified ? '1' : '0',
                    },
                  } as any);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${item.peer.name} about ${item.jobTitle}`}
              >
                <Card
                  variant={hasUnread ? 'outlined' : 'elevated'}
                  style={{
                    backgroundColor: hasUnread ? colors.primaryBg : colors.surface,
                    borderColor: hasUnread ? colors.primary : colors.borderSubtle,
                    padding: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                  }}
                >
                  <Avatar
                    name={item.peer.name}
                    size="md"
                    isVerified={item.peer.isVerified}
                  />

                  {/* Details */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Text
                          style={{
                            ...typography.heading,
                            fontSize: 15,
                            color: colors.text,
                            fontWeight: '700',
                          }}
                          numberOfLines={1}
                        >
                          {item.peer.name}
                        </Text>
                        <Badge
                          label={item.peer.role}
                          variant={item.peer.role === 'RECRUITER' ? 'warning' : 'primary'}
                          size="sm"
                        />
                      </View>

                      {item.lastMessage && (
                        <Text
                          style={{
                            ...typography.caption,
                            color: colors.textSecondary,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {formatMessageTime(item.lastMessage.createdAt)}
                        </Text>
                      )}
                    </View>

                    {/* Gig Title Badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
                      <Text
                        style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}
                        numberOfLines={1}
                      >
                        {item.jobTitle}
                      </Text>
                    </View>

                    {/* Last Message */}
                    <Text
                      style={{
                        ...typography.body,
                        fontSize: 13,
                        color: hasUnread ? colors.text : colors.textSecondary,
                        fontWeight: hasUnread ? '700' : '400',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.lastMessage ? item.lastMessage.text : 'Start chatting now...'}
                    </Text>
                  </View>

                  {hasUnread && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
