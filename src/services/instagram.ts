import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import type { InstagramConnection } from '../types/Instagram';

const INSTAGRAM_APP_ID = process.env.EXPO_PUBLIC_INSTAGRAM_APP_ID!;
const REDIRECT_URI = 'https://wellyapp.nz/auth/instagram/callback';
const APP_REDIRECT_URI = 'wellington://instagram-callback';
const SECURE_STORE_KEY = 'instagram_access_token';

export async function connectInstagram(): Promise<InstagramConnection> {
  const authUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${INSTAGRAM_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights` +
    `&force_reauth=true`;

  console.log('[Instagram] Auth URL:', authUrl);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_REDIRECT_URI, {
    preferEphemeralSession: true,
  });

  if (result.type !== 'success') {
    throw new Error('Instagram sign in was cancelled');
  }

  console.log('[Instagram] Result URL:', result.url);
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  console.log('[Instagram] Code:', code ? `${code.substring(0, 20)}...` : 'null');
  if (!code) {
    throw new Error('No authorization code returned from Instagram');
  }

  // Exchange code for tokens via server-side Edge Function
  console.log('[Instagram] Exchanging code for token via Edge Function...');
  const { data: fnData, error: fnError } = await supabase.functions.invoke('instagram-token', {
    body: { code },
  });

  if (fnError) {
    console.error('[Instagram] Edge Function error:', fnError.message);
    throw new Error('Failed to exchange Instagram authorization code');
  }

  if (fnData.error) {
    console.error('[Instagram] Server error:', fnData.error);
    throw new Error(fnData.error);
  }

  // Cache token in secure store for fast access
  await SecureStore.setItemAsync(SECURE_STORE_KEY, fnData.accessToken);

  return {
    id: '',
    userId: '',
    instagramUserId: fnData.instagramUserId,
    instagramUsername: fnData.instagramUsername,
    accessToken: fnData.accessToken,
    tokenExpiresAt: fnData.tokenExpiresAt,
    connectedAt: fnData.connectedAt,
  };
}

export async function disconnectInstagram(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('instagram_connections')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;

  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
}

export async function getInstagramConnection(): Promise<InstagramConnection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('instagram_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapConnection(data);
}

export async function getAccessToken(): Promise<string | null> {
  // Try secure store first for speed
  const cached = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (cached) return cached;

  // Fall back to database
  const connection = await getInstagramConnection();
  if (!connection) return null;

  await SecureStore.setItemAsync(SECURE_STORE_KEY, connection.accessToken);
  return connection.accessToken;
}

export async function refreshTokenIfNeeded(): Promise<boolean> {
  const connection = await getInstagramConnection();
  if (!connection) return false;

  const expiresAt = new Date(connection.tokenExpiresAt).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Only refresh if expiring within 7 days
  if (expiresAt - Date.now() > sevenDaysMs) return true;

  // Token expired — can't refresh
  if (expiresAt < Date.now()) return false;

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token` +
        `?grant_type=ig_refresh_token` +
        `&access_token=${connection.accessToken}`
    );

    if (!res.ok) return false;

    const data = await res.json();
    const newToken: string = data.access_token;
    const expiresIn: number = data.expires_in;
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await supabase
      .from('instagram_connections')
      .update({
        access_token: newToken,
        token_expires_at: newExpiresAt,
      })
      .eq('user_id', user.id);

    await SecureStore.setItemAsync(SECURE_STORE_KEY, newToken);
    return true;
  } catch {
    return false;
  }
}

function mapConnection(row: any): InstagramConnection {
  return {
    id: row.id,
    userId: row.user_id,
    instagramUserId: row.instagram_user_id,
    instagramUsername: row.instagram_username,
    accessToken: row.access_token,
    tokenExpiresAt: row.token_expires_at,
    connectedAt: row.connected_at,
  };
}
