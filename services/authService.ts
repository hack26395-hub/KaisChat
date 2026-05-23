import { supabase } from './supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('SignIn error:', error.message, error.status);
    throw error;
  }
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  username: string
) {
  // Check username availability
  const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
    throw new Error('اسم المستخدم مستخدم بالفعل');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, username },
    },
  });
  if (error) {
    console.error('SignUp error:', error.message, error.status);
    throw error;
  }
  return data;
}

// OTP / Magic Link (passwordless)
export async function sendOtpEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error('OTP send error:', error.message);
    throw error;
  }
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) {
    console.error('OTP verify error:', error.message);
    throw error;
  }
  return data;
}

// Google OAuth
export async function signInWithGoogle() {
  const redirectUri = makeRedirectUri({ scheme: 'kaischat', path: 'auth/callback' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type === 'success') {
    const url = result.url;
    const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const { data: session, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return session;
    }
  }
  return null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateProfile(userId: string, updates: {
  full_name?: string;
  username?: string;
  about?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLastSeen(userId: string) {
  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId);
}
