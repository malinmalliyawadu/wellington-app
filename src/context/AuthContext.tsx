import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { updateProfile as updateProfileService } from '../services/users';
import type { User } from '../types';
import { posthog } from '../config/posthog';

interface AuthContextType {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  updateProfile: (updates: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    profileVisibility?: string;
    instagramUsername?: string;
    tiktokUsername?: string;
    xUsername?: string;
  }) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        posthog.reset();
        setProfile(null);
        queryClient.clear();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setProfile({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio ?? undefined,
        onboardingCompleted: data.onboarding_completed ?? false,
        profileVisibility: (data as any).profile_visibility ?? 'public',
        instagramUsername: (data as any).instagram_username ?? undefined,
        tiktokUsername: (data as any).tiktok_username ?? undefined,
        xUsername: (data as any).x_username ?? undefined,
      });
      posthog.identify(data.id, {
        $set: {
          username: data.username,
          display_name: data.display_name,
          onboarding_completed: data.onboarding_completed ?? false,
        },
        $set_once: {
          first_seen_at: new Date().toISOString(),
        },
      });
    } else if (error?.code === 'PGRST116') {
      // No profile row found (e.g. trigger didn't fire or DB was reset)
      // Create a default profile so the user can proceed to onboarding
      const { data: authUser } = await supabase.auth.getUser();
      const meta = authUser?.user?.user_metadata;
      const defaultUsername = 'user_' + userId.substring(0, 8);
      const defaultDisplayName = meta?.full_name || meta?.display_name || 'New User';
      const defaultAvatar = meta?.avatar_url || '';

      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        username: defaultUsername,
        display_name: defaultDisplayName,
        avatar_url: defaultAvatar,
        onboarding_completed: false,
      });

      if (insertError) {
        // Can't create profile — sign out as last resort
        setProfile(null);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setProfile({
        id: userId,
        username: defaultUsername,
        displayName: defaultDisplayName,
        avatarUrl: defaultAvatar,
        onboardingCompleted: false,
      });
    }
    setLoading(false);
  }

  async function updateProfile(updates: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    profileVisibility?: string;
    instagramUsername?: string;
    tiktokUsername?: string;
    xUsername?: string;
  }) {
    if (!profile) {
      throw new Error('No profile to update');
    }

    await updateProfileService(profile.id, updates);

    // Refetch profile to get updated data
    await fetchProfile(profile.id);
  }

  async function completeOnboarding() {
    if (!profile) {
      throw new Error('No profile to complete onboarding for');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', profile.id);

    if (error) throw error;

    setProfile((prev) =>
      prev ? { ...prev, onboardingCompleted: true } : prev
    );
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, updateProfile, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
