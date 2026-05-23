import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { searchUsers, getOrCreateConversation } from '@/services/chatService';
import { Profile } from '@/services/supabase';
import { Avatar, Input } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

export default function SearchUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingChat, setOpeningChat] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (!text.trim() || text.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await searchUsers(text, user?.id ?? '');
        setResults(data);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const openChat = async (profile: Profile) => {
    if (!user) return;
    setOpeningChat(profile.id);
    try {
      const convId = await getOrCreateConversation(user.id, profile.id);
      router.replace({
        pathname: '/chat/[id]',
        params: {
          id: convId,
          name: profile.full_name ?? profile.username,
          userId: profile.id,
        },
      });
    } catch {
      setOpeningChat(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>محادثة جديدة</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Input
          placeholder="ابحث عن مستخدم بالاسم أو اسم المستخدم..."
          value={query}
          onChangeText={handleSearch}
          autoFocus
          leftIcon={<Ionicons name="search" size={20} color={Colors.textSecondary} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.userItem, pressed && styles.userItemPressed]}
              onPress={() => openChat(item)}
              disabled={openingChat === item.id}
            >
              <Avatar uri={item.avatar_url} name={item.full_name ?? item.username} size={50} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name ?? item.username}</Text>
                <Text style={styles.userHandle}>@{item.username}</Text>
                {item.about ? <Text style={styles.userAbout} numberOfLines={1}>{item.about}</Text> : null}
              </View>
              {openingChat === item.id ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Ionicons name="chatbubble-outline" size={22} color={Colors.textMuted} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={56} color={Colors.textMuted} />
                <Text style={styles.emptyText}>لم يُعثر على أي مستخدم</Text>
                <Text style={styles.emptySubtext}>جرّب بحثاً مختلفاً</Text>
              </View>
            ) : query.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={56} color={Colors.textMuted} />
                <Text style={styles.emptyText}>ابحث عن أصدقائك</Text>
                <Text style={styles.emptySubtext}>اكتب اسم المستخدم أو الاسم الكامل</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={results.length === 0 ? styles.emptyContent : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: Spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary },
  searchSection: { padding: Spacing.lg },
  searchInput: { marginBottom: 0 },
  centered: { paddingTop: 40, alignItems: 'center' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  userItemPressed: { backgroundColor: Colors.bgElevated },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary },
  userHandle: { fontSize: Typography.fontSizeSM, color: Colors.primary, marginTop: 2 },
  userAbout: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 82 },
  emptyContent: { flexGrow: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyText: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary },
  emptySubtext: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
});
