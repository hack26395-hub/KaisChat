import { supabase, Conversation, Message, Profile } from './supabase';
import { MESSAGE_RETRY_ATTEMPTS, MESSAGE_RETRY_DELAY } from '@/constants/config';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq('id', currentUserId)
    .limit(20);
  if (error) return [];
  return data ?? [];
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: participations, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (error || !participations?.length) return [];

  const conversationIds = participations.map((p) => p.conversation_id);

  const conversations: Conversation[] = [];

  for (const convId of conversationIds) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single();

    if (!conv) continue;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', convId)
      .neq('user_id', userId);

    const otherUserId = participants?.[0]?.user_id;
    const otherProfile = otherUserId ? await getProfile(otherUserId) : null;

    const { data: lastMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(1);

    conversations.push({
      ...conv,
      other_participant: otherProfile ?? undefined,
      last_message: lastMessages?.[0] ?? null,
      unread_count: 0,
    });
  }

  return conversations.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string
): Promise<string> {
  // Check if conversation already exists
  const { data: myConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (myConvs?.length) {
    const myConvIds = myConvs.map((c) => c.conversation_id);

    const { data: shared } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);

    if (shared?.length) {
      return shared[0].conversation_id;
    }
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (error || !newConv) throw new Error('فشل إنشاء المحادثة');

  await supabase.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: userId },
    { conversation_id: newConv.id, user_id: otherUserId },
  ]);

  return newConv.id;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data ?? [];
}

async function sendMessageAttempt(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      status: 'sent',
    })
    .select('*, sender:profiles!sender_id(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MESSAGE_RETRY_ATTEMPTS; attempt++) {
    try {
      const msg = await sendMessageAttempt(conversationId, senderId, content);
      return msg;
    } catch (err) {
      lastError = err as Error;
      if (attempt < MESSAGE_RETRY_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, MESSAGE_RETRY_DELAY * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('فشل إرسال الرسالة');
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const newMsg = payload.new as Message;
        const sender = await getProfile(newMsg.sender_id);
        onMessage({ ...newMsg, sender: sender ?? undefined });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToConversations(
  userId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'أمس';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ar', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('ar', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
