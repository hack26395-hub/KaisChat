import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/services/supabase';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type MessageBubbleProps = {
  message: Message;
  isMe: boolean;
  onRetry?: (message: Message) => void;
};

export const MessageBubble = memo(({ message, isMe, onRetry }: MessageBubbleProps) => {
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending' || message.isOptimistic;

  const formattedTime = new Date(message.created_at).toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
          isFailed && styles.bubbleFailed,
        ]}
      >
        <Text style={styles.content}>{message.content}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{formattedTime}</Text>
          {isMe ? (
            isFailed ? (
              <Pressable onPress={() => onRetry?.(message)} hitSlop={8}>
                <Ionicons name="refresh-circle" size={16} color={Colors.error} style={styles.statusIcon} />
              </Pressable>
            ) : isSending ? (
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" style={styles.statusIcon} />
            ) : message.status === 'read' ? (
              <Ionicons name="checkmark-done" size={14} color={Colors.delivered} style={styles.statusIcon} />
            ) : (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.6)" style={styles.statusIcon} />
            )
          ) : null}
        </View>
      </View>
      {isFailed ? (
        <Text style={styles.failedText}>فشل الإرسال • اضغط للإعادة</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, paddingHorizontal: Spacing.md, maxWidth: '80%' },
  wrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 80,
  },
  bubbleMe: {
    backgroundColor: Colors.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.bubbleReceived,
    borderBottomLeftRadius: 4,
  },
  bubbleFailed: { opacity: 0.7 },
  content: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
  time: {
    fontSize: Typography.fontSizeXS,
    color: 'rgba(255,255,255,0.55)',
  },
  statusIcon: {},
  failedText: {
    fontSize: Typography.fontSizeXS,
    color: Colors.error,
    marginTop: 2,
  },
});
