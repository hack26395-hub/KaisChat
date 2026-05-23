import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { ChatListItem } from '@/components/chat';
import { Avatar } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';
import { Conversation } from '@/services/supabase';

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { conversations, loading, refreshing, refresh } = useChats();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const name = conv.other_participant?.full_name ?? conv.other_participant?.username ?? '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openChat = (conv: Conversation) => {
    if (!conv.other_participant) return;
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: conv.id,
        name: conv.other_participant.full_name ?? conv.other_participant.username ?? '',
        userId: conv.other_participant.id,
      },
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? profile?.username} size={36} />
          <Text style={styles.headerTitle}>Kais Chat</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/search-users')}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث..."
          placeholderTextColor={Colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              conversation={item}
              onPress={() => openChat(item)}
              currentUserId={user?.id ?? ''}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={72} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
              <Text style={styles.emptySubtitle}>
                ابدأ محادثة جديدة بالضغط على أيقونة الكتابة أعلاه
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContent : undefined}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/search-users')}
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.full,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    textAlign: 'right',
  },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 82 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContent: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl, paddingTop: 80 },
  emptyTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary, marginTop: Spacing.lg, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
