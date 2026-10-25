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
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAuthStore } from '../../../src/store/authStore';
import { chatService, getChatSocket } from '../../../src/services';
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

  const { colors, typography, spacing, radii, shadow } = useTheme();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Fetch initial message history
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
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      };

      socket.on('new_message', handleIncomingMessage);

      return () => {
        isMounted = false;
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
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
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

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isPeerVerified = params.isVerified === '1' || params.isVerified === 'true';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style="auto" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: radii.md,
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Peer Avatar */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>
              {getInitials(params.peerName)}
            </Text>
          </View>
          {isPeerVerified && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: colors.success,
                width: 14,
                height: 14,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.card,
              }}
            >
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ ...typography.headingSm, color: colors.text, fontWeight: '700' }} numberOfLines={1}>
              {params.peerName || 'Chat Partner'}
            </Text>
            {params.peerRole && (
              <View
                style={{
                  backgroundColor: `${colors.primary}15`,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: radii.sm,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>
                  {params.peerRole}
                </Text>
              </View>
            )}
          </View>
          {params.jobTitle && (
            <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>
              💼 {params.jobTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Trust & Safety Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: `${colors.primary}10`,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.primary}20`,
        }}
      >
        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600', flex: 1 }}>
          End-to-end verified student channel for campus coordination.
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
            keyExtractor={item => item.id}
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
                      backgroundColor: isMe ? colors.primary : colors.card,
                      borderRadius: radii.lg,
                      borderTopRightRadius: isMe ? 4 : radii.lg,
                      borderTopLeftRadius: !isMe ? 4 : radii.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 10,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: colors.border,
                      ...shadow.sm,
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
                        ...typography.bodyMd,
                        color: isMe ? '#ffffff' : colors.text,
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
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      {formatTime(item.createdAt)}
                    </Text>
                    {isMe && (
                      <Ionicons
                        name={item.isRead ? 'checkmark-done' : 'checkmark'}
                        size={12}
                        color={item.isRead ? colors.primary : colors.textMuted}
                      />
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={{ ...typography.headingSm, color: colors.text, textAlign: 'center' }}>
                  No messages yet
                </Text>
                <Text style={{ ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' }}>
                  Say hello to coordinate location, timing, and details for this gig.
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
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bgSecondary,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 44,
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
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
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() ? colors.primary : colors.bgTertiary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? '#fff' : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
