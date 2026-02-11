import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithGoogle, signInWithApple } from '../services/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { HapticPressable } from 'src/components/HapticPressable';

const SEED_USERS = [
  { email: 'you@test.com', name: 'You', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' },
  { email: 'sarah@test.com', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { email: 'jordan@test.com', name: 'Jordan Taylor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { email: 'mel@test.com', name: 'Mel Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' },
  { email: 'alex@test.com', name: 'Alex Kim', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { email: 'tane@test.com', name: 'Tane Mahuta', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  { email: 'sam@test.com', name: "Sam O'Brien", avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
  { email: 'maya@test.com', name: 'Maya Patel', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
  { email: 'pete@test.com', name: 'Pete Williams', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200' },
  { email: 'kate@test.com', name: 'Kate Nguyen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
];

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<'google' | 'apple' | string | null>(null);

  async function handleGoogleSignIn() {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message ?? 'Could not sign in with Google');
    } finally {
      setLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign In Error', error.message ?? 'Could not sign in with Apple');
    } finally {
      setLoading(null);
    }
  }

  async function handleSeedLogin(email: string) {
    setLoading(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'testpass123',
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message ?? 'Could not sign in');
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <Ionicons name="map" size={64} color={colors.primary} />
        <Text style={styles.title}>Wellington</Text>
        <Text style={styles.subtitle}>Discover what's happening in your city</Text>
      </View>

      <View style={styles.buttons}>
        <HapticPressable
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
        >
          {loading === 'google' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </HapticPressable>

        {Platform.OS === 'ios' && (
          <HapticPressable
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.buttonText}>Continue with Apple</Text>
              </>
            )}
          </HapticPressable>
        )}
      </View>


      <View style={styles.devSection}>
        <Text style={styles.devTitle}>Dev Login</Text>
        <View style={styles.seedGrid}>
          {SEED_USERS.map((user) => (
            <HapticPressable
              key={user.email}
              style={styles.seedUser}
              onPress={() => handleSeedLogin(user.email)}
              disabled={loading !== null}
            >
              <Image source={{ uri: user.avatar }} style={styles.seedAvatar} />
              {loading === user.email ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.seedSpinner} />
              ) : (
                <Text style={styles.seedName} numberOfLines={1}>{user.name}</Text>
              )}
            </HapticPressable>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devSection: {
    marginTop: 48,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 20,
  },
  devTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  seedUser: {
    alignItems: 'center',
    width: 64,
  },
  seedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray200,
    marginBottom: 4,
  },
  seedName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  seedSpinner: {
    marginTop: 2,
  },
});
