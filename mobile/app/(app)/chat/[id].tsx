import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAuthStore } from '../../../src/store/authStore';
import { chatService, getChatSocket } from '../../../src/services';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import type { ChatMessage } from '../../../src/types';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    jobTitle?: string;
    peerName?: string;
    peerRole?: string;
    isVerified?: string;
  }>();
  const conversationId = params.id;

  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [peerDetails, setPeerDetails] = useState({
    name: params.peerName || '',
    jobTitle: params.jobTitle || '',
    role: params.peerRole || '',
    isVerified: params.isVerified === '1' || params.isVerified === 'true',
  });

  const flatListRef = useRef<FlatList>(null);

  // Fetch initial message history and fallback details if needed
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const msgs = await chatService.getMessages(conversationId);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err) {
        console.warn('Failed to load chat messages', err);
      } finally {
        if (isMounted) setLoading(false);
      }

      if (!params.peerName) {
        try {
          const convs = await chatService.getConversations();
          const current = convs.find((c) => c.id === conversationId);
          if (current && isMounted) {
            setPeerDetails({
              name: current.peer.name,
              jobTitle: current.jobTitle,
              role: current.peer.role,
              isVerified: current.peer.isVerified,
            });
          }
        } catch {}
      }
    })();

    // Socket.io Real-time connection
    try {
      const socket = getChatSocket();
      socket.emit('join_conversation', conversationId);
      if (user?.id) {
        socket.emit('join_user', user.id);
      }

      const handleIncomingMessage = (newMsg: ChatMessage) => {
        if (newMsg.conversationId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      };

      socket.on('new_message', handleIncomingMessage);

      return () => {
        isMounted = false;
        socket.emit('leave_conversation', conversationId);
        socket.off('new_message', handleIncomingMessage);
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, [conversationId, user?.id]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      const newMsg = await chatService.sendMessage(conversationId, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err: any) {
      // Restore draft if failed
      setInputText(text);
      console.warn('Error sending message', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const displayName = peerDetails.name || params.peerName || 'Chat Partner';
  const displayTitle = peerDetails.jobTitle || params.jobTitle || '';
  const displayRole = peerDetails.role || params.peerRole || '';
  const isPeerVerified =
    peerDetails.isVerified || params.isVerified === '1' || params.isVerified === 'true';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to messages"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Peer Avatar */}
        <Avatar name={displayName} size="sm" isVerified={isPeerVerified} />

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, fontWeight: '700' }} numberOfLines={1}>
              {displayName}
            </Text>
            {displayRole ? (
              <Badge
                label={displayRole}
                variant={displayRole === 'RECRUITER' ? 'warning' : 'primary'}
                size="sm"
              />
            ) : null}
          </View>
          {displayTitle ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
              <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>
                {displayTitle}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Trust & Safety Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.primaryBg,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        <Text style={{ ...typography.caption, fontSize: 11, color: colors.primary, fontWeight: '600', flex: 1 }}>
          Verified student communication channel for campus task coordination.
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: spacing.md,
              gap: spacing.sm,
              flexGrow: 1,
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.id;

              return (
                <View
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    gap: 2,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isMe ? colors.primary : colors.surface,
                      borderRadius: radii.md,
                      borderTopRightRadius: isMe ? 4 : radii.md,
                      borderTopLeftRadius: !isMe ? 4 : radii.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 10,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    {!isMe && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: colors.primary,
                          marginBottom: 2,
                        }}
                      >
                        {item.senderName}
                      </Text>
                    )}
                    <Text
                      style={{
                        ...typography.body,
                        color: isMe ? '#FFFFFF' : colors.text,
                        lineHeight: 20,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontSize: 10,
                        color: colors.textSecondary,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                    {isMe && (
                      <Ionicons
                        name={item.isRead ? 'checkmark-done' : 'checkmark'}
                        size={12}
                        color={item.isRead ? colors.primary : colors.textSecondary}
                      />
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
                <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} />
                <Text style={{ ...typography.heading, fontSize: 16, color: colors.text, textAlign: 'center', fontWeight: '700' }}>
                  No messages yet
                </Text>
                <Text style={{ ...typography.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                  Say hello to coordinate arrival, location, and timing for this gig.
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              minHeight: 48,
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                maxHeight: 100,
                paddingVertical: 8,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={{
              width: 48,
              height: 48,
              borderRadius: radii.full,
              backgroundColor: inputText.trim() ? colors.primary : colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? '#FFFFFF' : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
