import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble } from '@/components/chat';
import { Avatar } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';
import { Message } from '@/services/supabase';

export default function ChatScreen() {
  const { id, name, userId } = useLocalSearchParams<{ id: string; name: string; userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { messages, loading, send, retryFailed } = useMessages(id ?? '');
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    send(trimmed);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isMe={item.sender_id === user?.id}
      onRetry={retryFailed}
    />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Chat Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.headerInfo}>
          <Avatar uri={null} name={name} size={38} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{name ?? 'محادثة'}</Text>
            <Text style={styles.headerStatus}>متصل الآن</Text>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerActionBtn} hitSlop={8}>
            <Ionicons name="videocam-outline" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerActionBtn} hitSlop={8}>
            <Ionicons name="call-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerActionBtn} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyChatText}>ابدأ المحادثة الآن</Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <Pressable style={styles.attachBtn} hitSlop={8}>
            <Ionicons name="attach" size={24} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="اكتب رسالة..."
              placeholderTextColor={Colors.placeholder}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              textAlign="right"
              onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
            />
            <Pressable style={styles.emojiBtn} hitSlop={8}>
              <Ionicons name="happy-outline" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          {text.trim() ? (
            <Pressable onPress={handleSend} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color={Colors.white} />
            </Pressable>
          ) : (
            <Pressable style={styles.sendBtn}>
              <Ionicons name="mic" size={22} color={Colors.white} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.bgSurface,
    gap: Spacing.xs,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerText: { flex: 1 },
  headerName: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary },
  headerStatus: { fontSize: Typography.fontSizeXS, color: Colors.online },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerActionBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyChatText: { fontSize: Typography.fontSizeMD, color: Colors.textMuted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.sm,
  },
  attachBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'android' ? Spacing.sm : 0,
  },
  emojiBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
