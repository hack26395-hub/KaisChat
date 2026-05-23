import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmail, sendOtpEmail, verifyOtp, signInWithGoogle } from '@/services/authService';
import { Button, Input } from '@/components/ui';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

type LoginMode = 'password' | 'otp';
type OtpStep = 'email' | 'verify';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<LoginMode>('otp');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');

  // Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP mode
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const getErrorMessage = (err: any) => {
    const msg: string = err?.message ?? err?.error_description ?? String(err) ?? '';
    console.log('Auth error detail:', msg);
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    if (msg.includes('Email not confirmed'))
      return 'يرجى تأكيد بريدك الإلكتروني أولاً — تفقد صندوق الوارد';
    if (msg.includes('User already registered'))
      return 'هذا البريد مسجل مسبقاً، جرب تسجيل الدخول';
    if (msg.includes('Email rate limit') || msg.includes('rate limit'))
      return 'تم إرسال رسائل كثيرة — انتظر قليلاً ثم أعد المحاولة';
    if (msg.includes('Token has expired') || msg.includes('expired'))
      return 'رمز التحقق انتهت صلاحيته — اطلب رمزاً جديداً';
    if (msg.includes('Invalid OTP') || msg.includes('otp_expired') || msg.includes('Token is incorrect'))
      return 'رمز التحقق غير صحيح أو منتهي الصلاحية';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network'))
      return 'تعذر الاتصال بالخادم — تحقق من الاتصال بالإنترنت';
    if (msg.includes('supabaseUrl is required') || msg.includes('placeholder'))
      return 'إعدادات الخادم غير مكتملة — تحقق من إعدادات Supabase';
    return `خطأ: ${msg || 'يرجى المحاولة مرة أخرى'}`;
  };

  // Password login
  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP — send code
  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtpEmail(otpEmail.trim().toLowerCase());
      setOtpSent(true);
      setOtpStep('verify');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP — verify code
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtp(otpEmail.trim().toLowerCase(), otpCode.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Google
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.session) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.hero}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
                transition={300}
              />
            </View>
            <Text style={styles.appName}>Kais Chat</Text>
            <Text style={styles.tagline}>تواصل بسرعة وأمان</Text>
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, mode === 'otp' && styles.modeTabActive]}
              onPress={() => { setMode('otp'); setOtpStep('email'); setError(''); }}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={mode === 'otp' ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'otp' && styles.modeTabTextActive]}>
                رمز التحقق
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'password' && styles.modeTabActive]}
              onPress={() => { setMode('password'); setError(''); }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={mode === 'password' ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'password' && styles.modeTabTextActive]}>
                كلمة المرور
              </Text>
            </Pressable>
          </View>

          {/* Form Card */}
          <View style={styles.card}>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ====== OTP MODE ====== */}
            {mode === 'otp' && (
              <>
                {otpStep === 'email' ? (
                  <>
                    <Text style={styles.formTitle}>أدخل بريدك الإلكتروني</Text>
                    <Text style={styles.formSubtitle}>
                      سنرسل لك رمز تحقق مكون من 6 أرقام
                    </Text>
                    <Input
                      label="البريد الإلكتروني"
                      placeholder="example@email.com"
                      value={otpEmail}
                      onChangeText={setOtpEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />}
                    />
                    <Button
                      title="إرسال رمز التحقق"
                      onPress={handleSendOtp}
                      loading={loading}
                      fullWidth
                      style={styles.actionBtn}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.otpHeader}>
                      <Pressable onPress={() => { setOtpStep('email'); setOtpCode(''); setError(''); }}>
                        <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
                      </Pressable>
                      <View style={styles.otpHeaderText}>
                        <Text style={styles.formTitle}>رمز التحقق</Text>
                        <Text style={styles.formSubtitle} numberOfLines={1}>
                          أُرسل إلى {otpEmail}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.otpInputWrapper}>
                      <TextInput
                        style={styles.otpInput}
                        value={otpCode}
                        onChangeText={(t) => setOtpCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        placeholderTextColor={Colors.placeholder}
                        textAlign="center"
                        autoFocus
                      />
                    </View>

                    <Button
                      title="تحقق ودخل"
                      onPress={handleVerifyOtp}
                      loading={loading}
                      fullWidth
                      style={styles.actionBtn}
                    />

                    <Pressable onPress={handleSendOtp} style={styles.resendRow} disabled={loading}>
                      <Text style={styles.resendText}>لم تستلم الرمز؟ </Text>
                      <Text style={styles.resendLink}>أعد الإرسال</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}

            {/* ====== PASSWORD MODE ====== */}
            {mode === 'password' && (
              <>
                <Text style={styles.formTitle}>تسجيل الدخول</Text>
                <Text style={styles.formSubtitle}>أدخل بيانات حسابك للمتابعة</Text>
                <Input
                  label="البريد الإلكتروني"
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />}
                />
                <Input
                  label="كلمة المرور"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  autoComplete="password"
                  textContentType="password"
                  onSubmitEditing={handlePasswordLogin}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />}
                />
                <Button
                  title="دخول"
                  onPress={handlePasswordLogin}
                  loading={loading}
                  fullWidth
                  style={styles.actionBtn}
                />
              </>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <Pressable
              style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.textPrimary} size="small" />
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>تسجيل الدخول بـ Google</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>ليس لديك حساب؟ </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.registerLink}>إنشاء حساب</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, flexGrow: 1 },

  hero: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoWrapper: {
    width: 90, height: 90, borderRadius: 24, overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  logo: { width: 90, height: 90 },
  appName: {
    fontSize: Typography.fontSizeXXL + 4,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary, letterSpacing: 0.5,
  },
  tagline: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, marginTop: Spacing.xs },

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm, borderRadius: Radii.md,
  },
  modeTabActive: { backgroundColor: Colors.bgElevated },
  modeTabText: { fontSize: Typography.fontSizeSM, color: Colors.textMuted, fontWeight: Typography.fontWeightMedium },
  modeTabTextActive: { color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },

  card: {
    backgroundColor: Colors.bgSurface, borderRadius: Radii.xl,
    padding: Spacing.xl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  formTitle: {
    fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary, marginBottom: Spacing.xs, textAlign: 'right',
  },
  formSubtitle: {
    fontSize: Typography.fontSizeSM, color: Colors.textSecondary,
    marginBottom: Spacing.xl, textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(241,92,109,0.1)', borderRadius: Radii.md,
    padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(241,92,109,0.3)',
  },
  errorText: { color: Colors.error, fontSize: Typography.fontSizeSM, flex: 1 },

  actionBtn: { marginTop: Spacing.sm },

  // OTP
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  otpHeaderText: { flex: 1 },
  otpInputWrapper: {
    backgroundColor: Colors.inputBg, borderRadius: Radii.lg,
    marginBottom: Spacing.lg, height: 70, justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  otpInput: {
    fontSize: 32, fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary, letterSpacing: 12, textAlign: 'center',
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  resendText: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  resendLink: { color: Colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { color: Colors.textMuted, fontSize: Typography.fontSizeSM },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgElevated, borderRadius: Radii.lg,
    paddingVertical: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, minHeight: 50,
  },
  googleBtnPressed: { opacity: 0.75 },
  googleIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleBtnText: {
    fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },

  // Register
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  registerLink: { color: Colors.primary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold },
});
