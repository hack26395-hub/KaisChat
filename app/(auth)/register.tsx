import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUpWithEmail } from '@/services/authService';
import { Button, Input } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return 'يرجى إدخال الاسم الكامل';
    if (!username.trim()) return 'يرجى إدخال اسم المستخدم';
    if (username.trim().length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'اسم المستخدم يحتوي على أحرف غير مسموحة';
    if (!email.trim()) return 'يرجى إدخال البريد الإلكتروني';
    if (!email.includes('@')) return 'البريد الإلكتروني غير صحيح';
    if (!password) return 'يرجى إدخال كلمة المرور';
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email.trim().toLowerCase(), password, fullName.trim(), username.trim().toLowerCase());
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('البريد الإلكتروني مسجل مسبقاً');
      } else if (msg.includes('اسم المستخدم')) {
        setError(msg);
      } else {
        setError('حدث خطأ. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.root, styles.successContainer]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
        </View>
        <Text style={styles.successTitle}>تم إنشاء الحساب!</Text>
        <Text style={styles.successText}>
          تفقد بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول
        </Text>
        <Button
          title="العودة لتسجيل الدخول"
          onPress={() => router.replace('/(auth)/login')}
          fullWidth
          style={styles.successBtn}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + Spacing.sm }]}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>إنشاء حساب جديد</Text>
            <Text style={styles.subtitle}>انضم إلى Kais Chat الآن</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="الاسم الكامل"
              placeholder="محمد أحمد"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="اسم المستخدم"
              placeholder="username123"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
              leftIcon={<Ionicons name="at-outline" size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="البريد الإلكتروني"
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="كلمة المرور"
              placeholder="6 أحرف على الأقل"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="تأكيد كلمة المرور"
              placeholder="أعد إدخال كلمة المرور"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />}
            />

            <Button
              title="إنشاء الحساب"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerBtn}
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>تسجيل الدخول</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, flexGrow: 1, paddingTop: 80 },
  backBtn: { position: 'absolute', left: Spacing.lg, zIndex: 10, padding: Spacing.sm },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.fontWeightBold, color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'right' },
  card: { backgroundColor: Colors.bgSurface, borderRadius: Radii.xl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(241,92,109,0.1)', borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: 'rgba(241,92,109,0.3)' },
  errorText: { color: Colors.error, fontSize: Typography.fontSizeSM, flex: 1 },
  registerBtn: { marginTop: Spacing.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  loginLink: { color: Colors.primary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold },
  successContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  successIcon: { marginBottom: Spacing.xl },
  successTitle: { fontSize: Typography.fontSizeXXL, fontWeight: Typography.fontWeightBold, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  successText: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xxxl },
  successBtn: { width: '100%' },
});
