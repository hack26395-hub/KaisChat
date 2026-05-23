import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { signOut, updateProfile } from '@/services/authService';
import { Avatar, Button, Input } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; onOk?: () => void }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'موافق', onPress: onOk }] : undefined);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, { full_name: fullName.trim(), about: about.trim() });
      await refreshProfile();
      setEditModal(false);
    } catch {
      showAlert('خطأ', 'فشل حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      showAlert('تسجيل الخروج', 'هل أنت متأكد أنك تريد تسجيل الخروج؟', async () => {
        setLoggingOut(true);
        try { await signOut(); router.replace('/(auth)/login'); } catch { setLoggingOut(false); }
      });
    } else {
      Alert.alert('تسجيل الخروج', 'هل أنت متأكد أنك تريد تسجيل الخروج؟', [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج', style: 'destructive', onPress: async () => {
            setLoggingOut(true);
            try { await signOut(); router.replace('/(auth)/login'); } catch { setLoggingOut(false); }
          },
        },
      ]);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <Pressable onPress={() => { setFullName(profile?.full_name ?? ''); setAbout(profile?.about ?? ''); setEditModal(true); }} style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? profile?.username} size={90} />
            <Pressable style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </Pressable>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? profile?.username ?? 'المستخدم'}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الحساب</Text>

          <View style={styles.infoCard}>
            <InfoRow icon="mail-outline" label="البريد الإلكتروني" value={profile?.email ?? '-'} />
            <View style={styles.divider} />
            <InfoRow icon="information-circle-outline" label="نبذة عني" value={profile?.about ?? 'مرحباً! أنا أستخدم Kais Chat'} />
            <View style={styles.divider} />
            <InfoRow icon="calendar-outline" label="انضم في" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar') : '-'} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.actionCard}>
            <Pressable style={styles.actionRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={styles.actionTextDanger}>تسجيل الخروج</Text>
              {loggingOut ? null : <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditModal(false)}>
              <Text style={styles.modalCancel}>إلغاء</Text>
            </Pressable>
            <Text style={styles.modalTitle}>تعديل الملف</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>حفظ</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalAvatarRow}>
              <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? profile?.username} size={72} />
            </View>
            <Input label="الاسم الكامل" value={fullName} onChangeText={setFullName} placeholder="أدخل اسمك" leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textSecondary} />} />
            <Input label="نبذة عني" value={about} onChangeText={setAbout} placeholder="اكتب شيئاً عن نفسك..." multiline numberOfLines={3} leftIcon={<Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />} />
          </ScrollView>
        </View>
      </Modal>

      {/* Web Alert Modal */}
      {Platform.OS === 'web' ? (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.webAlertOverlay}>
            <View style={styles.webAlertBox}>
              <Text style={styles.webAlertTitle}>{alertConfig.title}</Text>
              <Text style={styles.webAlertMsg}>{alertConfig.message}</Text>
              <Pressable
                style={styles.webAlertBtn}
                onPress={() => { alertConfig.onOk?.(); setAlertConfig((p) => ({ ...p, visible: false })); }}
              >
                <Text style={styles.webAlertBtnText}>موافق</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <View style={infoStyles.textWrapper}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.md },
  textWrapper: { flex: 1 },
  label: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginBottom: 2 },
  value: { fontSize: Typography.fontSizeMD, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  headerTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.textPrimary },
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, backgroundColor: Colors.bgSurface },
  profileCard: { alignItems: 'center', paddingVertical: Spacing.xxxl, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.bg },
  name: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.fontWeightBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  username: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  sectionTitle: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, marginBottom: Spacing.sm, fontWeight: Typography.fontWeightMedium, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: { backgroundColor: Colors.bgSurface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 52 },
  actionCard: { backgroundColor: Colors.bgSurface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.xxxl },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  actionTextDanger: { flex: 1, fontSize: Typography.fontSizeMD, color: Colors.error, fontWeight: Typography.fontWeightMedium },
  // Modal
  modalRoot: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  modalTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.textPrimary },
  modalCancel: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary },
  modalSave: { fontSize: Typography.fontSizeMD, color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },
  modalSaveDisabled: { opacity: 0.5 },
  modalContent: { padding: Spacing.xl },
  modalAvatarRow: { alignItems: 'center', marginBottom: Spacing.xl },
  // Web Alert
  webAlertOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  webAlertBox: { backgroundColor: Colors.bgSurface, borderRadius: Radii.lg, padding: Spacing.xl, minWidth: 280, maxWidth: 400, borderWidth: 1, borderColor: Colors.border },
  webAlertTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  webAlertMsg: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, marginBottom: Spacing.xl, textAlign: 'right' },
  webAlertBtn: { backgroundColor: Colors.primary, borderRadius: Radii.md, padding: Spacing.md, alignItems: 'center' },
  webAlertBtnText: { color: Colors.white, fontWeight: Typography.fontWeightSemiBold },
});
