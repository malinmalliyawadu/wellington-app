import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createURL } from 'expo-linking';
import { Platform } from 'react-native';

export async function signInWithGoogle() {
  // Create the deep link URL that will handle the OAuth callback
  const redirectTo = createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');

  // Open the OAuth URL in the browser and wait for redirect
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo,
    { preferEphemeralSession: true }
  );

  if (result.type === 'success') {
    // Extract tokens from the redirect URL
    const url = new URL(result.url);

    // Try both hash and query params (Supabase can use either)
    let params = new URLSearchParams(url.hash.substring(1));
    if (!params.get('access_token')) {
      params = new URLSearchParams(url.search);
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      throw new Error('No tokens returned from OAuth provider');
    }
  } else if (result.type === 'cancel') {
    throw new Error('Sign in was cancelled');
  }
}

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only available on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('No identity token from Apple');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;

  // Update profile with Apple name if available
  if (credential.fullName?.givenName) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const displayName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
