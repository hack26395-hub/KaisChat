import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/services/supabase';
import { getConversations, subscribeToConversations } from '@/services/chatService';
import { useAuth } from './useAuth';

export function useChats() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(user.id, () => {
      loadConversations();
    });
    return unsubscribe;
  }, [user, loadConversations]);

  return { conversations, loading, refreshing, refresh };
}
