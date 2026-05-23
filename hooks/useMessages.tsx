import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/services/supabase';
import { getMessages, sendMessage, subscribeToMessages } from '@/services/chatService';
import { useAuth } from './useAuth';

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const optimisticIds = useRef<Set<string>>(new Set());

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        // Remove optimistic version if exists
        const filtered = prev.filter((m) => {
          if (m.isOptimistic && m.content === newMsg.content && m.sender_id === newMsg.sender_id) {
            optimisticIds.current.delete(m.id);
            return false;
          }
          return true;
        });
        // Avoid duplicates
        if (filtered.some((m) => m.id === newMsg.id)) return filtered;
        return [...filtered, newMsg];
      });
    });
    return unsubscribe;
  }, [conversationId]);

  const send = useCallback(
    async (content: string) => {
      if (!user || !content.trim() || sending) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        status: 'sending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true,
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMsg]);
      optimisticIds.current.add(optimisticId);
      setSending(false);

      try {
        await sendMessage(conversationId, user.id, content);
        // Remove optimistic on confirmed delivery
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, status: 'sent', isOptimistic: false } : m
          )
        );
      } catch (err) {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [user, conversationId, sending]
  );

  const retryFailed = useCallback(
    async (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, status: 'sending' } : m))
      );
      try {
        await sendMessage(conversationId, user!.id, message.content);
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [conversationId, user]
  );

  return { messages, loading, sending, send, retryFailed };
}
