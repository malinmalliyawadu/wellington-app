import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, Platform, ActivityIndicator, Alert, ImageBackground, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
  });

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<'google' | 'apple' | string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const translateY = useSharedValue(600);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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

  const openDevModal = () => {
    setShowDevModal(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
  };

  const closeDevModal = () => {
    translateY.value = withSpring(600, { damping: 20, stiffness: 90 });
    setTimeout(() => setShowDevModal(false), 300);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(closeDevModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1489171084589-9b5031ebcf9b?w=1200&q=80' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)']}
          style={styles.gradient}
        >
          <ScrollView
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Welly</Text>
              <Text style={styles.tagline}>Discover what's happening in the{'\n'}coolest little capital!</Text>
            </View>

            <View style={styles.buttons}>
              <HapticPressable
                onPress={handleGoogleSignIn}
                disabled={loading !== null}
              >
                <BlurView intensity={80} style={[styles.button, styles.glassButton]}>
                  {loading === 'google' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={22} color="#fff" />
                      <Text style={styles.buttonText}>Continue with Google</Text>
                    </>
                  )}
                </BlurView>
              </HapticPressable>

              {Platform.OS === 'ios' && (
                <HapticPressable
                  onPress={handleAppleSignIn}
                  disabled={loading !== null}
                >
                  <BlurView intensity={80} style={[styles.button, styles.glassButton]}>
                    {loading === 'apple' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={22} color="#fff" />
                        <Text style={styles.buttonText}>Continue with Apple</Text>
                      </>
                    )}
                  </BlurView>
                </HapticPressable>
              )}
            </View>

            {/* Dev Login Trigger */}
            <HapticPressable
              style={styles.devTrigger}
              onPress={openDevModal}
            >
              <BlurView intensity={60} style={styles.devTriggerButton}>
                <Ionicons name="code-slash" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.devTriggerText}>Dev Login</Text>
              </BlurView>
            </HapticPressable>

          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      {/* Dev Login Modal */}
      <Modal
        visible={showDevModal}
        transparent
        animationType="fade"
        onRequestClose={closeDevModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDevModal}>
          <GestureDetector gesture={panGesture}>
            <Reanimated.View style={[styles.modalContent, animatedStyle]}>
              <BlurView intensity={100} style={styles.devModalBlur}>
                <View style={styles.dragHandle} />
                <Text style={styles.devTitle}>Dev Login</Text>
                <ScrollView contentContainerStyle={styles.seedGrid}>
                  {SEED_USERS.map((user) => (
                    <HapticPressable
                      key={user.email}
                      style={styles.seedUser}
                      onPress={() => {
                        handleSeedLogin(user.email);
                        closeDevModal();
                      }}
                      disabled={loading !== null}
                    >
                      <Image source={{ uri: user.avatar }} style={styles.seedAvatar} />
                      {loading === user.email ? (
                        <ActivityIndicator size="small" color="#fff" style={styles.seedSpinner} />
                      ) : (
                        <Text style={styles.seedName} numberOfLines={1}>{user.name}</Text>
                      )}
                    </HapticPressable>
                  ))}
                </ScrollView>
              </BlurView>
            </Reanimated.View>
          </GestureDetector>
        </Pressable>
      </Modal>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
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
    fontSize: 96,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  tagline: {
    fontSize: 19,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    maxWidth: 340,
  },
  buttons: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
    overflow: 'hidden',
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  devTrigger: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  devTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  devTriggerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  devModalBlur: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  devTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 20,
  },
  seedUser: {
    alignItems: 'center',
    width: 75,
  },
  seedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  seedName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  seedSpinner: {
    marginTop: 2,
  },
});
