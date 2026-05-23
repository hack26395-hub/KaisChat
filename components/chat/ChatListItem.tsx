import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '@/services/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/services/chatService';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ChatListItemProps = {
  conversation: Conversation;
  onPress: () => void;
  currentUserId: string;
};

export const ChatListItem = memo(({ conversation, onPress, currentUserId }: ChatListItemProps) => {
  const other = conversation.other_participant;
  const lastMsg = conversation.last_message;
  const isMe = lastMsg?.sender_id === currentUserId;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Avatar
        uri={other?.avatar_url}
        name={other?.full_name ?? other?.username}
        size={54}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {other?.full_name ?? other?.username ?? 'مجهول'}
          </Text>
          {lastMsg ? (
            <Text style={styles.time}>{formatTime(lastMsg.created_at)}</Text>
          ) : null}
        </View>
        <View style={styles.row}>
          <View style={styles.messageRow}>
            {isMe ? (
              <Ionicons
                name={
                  lastMsg?.status === 'read'
                    ? 'checkmark-done'
                    : lastMsg?.status === 'delivered'
                    ? 'checkmark-done'
                    : 'checkmark'
                }
                size={16}
                color={lastMsg?.status === 'read' ? Colors.delivered : Colors.textMuted}
                style={styles.tickIcon}
              />
            ) : null}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMsg?.content ?? 'ابدأ المحادثة...'}
            </Text>
          </View>
          {(conversation.unread_count ?? 0) > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unread_count}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  pressed: { backgroundColor: Colors.bgElevated },
  content: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  name: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
  },
  messageRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tickIcon: { marginRight: 3 },
  lastMessage: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
  },
});
