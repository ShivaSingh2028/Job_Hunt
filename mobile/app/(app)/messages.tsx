import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { chatService } from '../../src/services';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import type { Conversation } from '../../src/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii, shadow } = useTheme();
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

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.jobTitle.toLowerCase().includes(q) ||
      c.peer.name.toLowerCase().includes(q) ||
      (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

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
      <StatusBar style="auto" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ ...typography.bodySm, color: colors.textSecondary, fontWeight: '600' }}>
              Direct Chat
            </Text>
            <Text style={{ ...typography.headingLg, color: colors.text, fontWeight: '800' }}>
              Messages
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            style={{
              width: 38,
              height: 38,
              borderRadius: radii.md,
              backgroundColor: colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="reload-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.bgSecondary,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            height: 42,
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: colors.text, fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading chats..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchConversations()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            padding: spacing.md,
            gap: spacing.sm,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="💬"
              title={search ? 'No results found' : 'No Messages Yet'}
              description={
                search
                  ? 'Try searching with another keyword.'
                  : 'Direct chat connects you with your gig partner once an application is confirmed.'
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
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: hasUnread ? colors.primary : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  ...shadow.sm,
                }}
              >
                {/* Avatar with verified check badge */}
                <View style={{ position: 'relative' }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                      {getInitials(item.peer.name)}
                    </Text>
                  </View>
                  {item.peer.isVerified && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        backgroundColor: colors.success,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: colors.card,
                      }}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text
                        style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        {item.peer.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: `${colors.primary}15`,
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: radii.sm,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                          {item.peer.role}
                        </Text>
                      </View>
                    </View>

                    {item.lastMessage && (
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>
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
                      ...typography.bodySm,
                      color: hasUnread ? colors.text : colors.textSecondary,
                      fontWeight: hasUnread ? '700' : '400',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.lastMessage ? item.lastMessage.text : 'Start chatting now...'}
                  </Text>
                </View>

                {/* Right unread indicator */}
                {hasUnread ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
