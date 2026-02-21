import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  GlassView,
  GlassContainer,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fonts } from "../theme/fonts";
import { signInWithGoogle, signInWithApple } from "../services/auth";
import { supabase } from "../lib/supabase";
import { useTheme } from "../theme/ThemeContext";
import { HapticPressable } from "src/components/HapticPressable";

const glassEnabled = isLiquidGlassAvailable();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const splashBg = require("../../assets/splash-bg.png");

const SEED_USERS = [
  {
    email: "you@test.com",
    name: "You",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  },
  {
    email: "sarah@test.com",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  },
  {
    email: "jordan@test.com",
    name: "Jordan Taylor",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  },
  {
    email: "mel@test.com",
    name: "Mel Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  },
  {
    email: "alex@test.com",
    name: "Alex Kim",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  },
  {
    email: "tane@test.com",
    name: "Tane Mahuta",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  },
  {
    email: "sam@test.com",
    name: "Sam O'Brien",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
  },
  {
    email: "maya@test.com",
    name: "Maya Patel",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
  },
  {
    email: "pete@test.com",
    name: "Pete Williams",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200",
  },
  {
    email: "kate@test.com",
    name: "Kate Nguyen",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  },
];

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<"google" | "apple" | string | null>(
    null
  );
  const [showDevModal, setShowDevModal] = useState(false);

  async function handleGoogleSignIn() {
    setLoading("google");
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert(
        "Sign In Error",
        error.message ?? "Could not sign in with Google"
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setLoading("apple");
    try {
      await signInWithApple();
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert(
        "Sign In Error",
        error.message ?? "Could not sign in with Apple"
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleSeedLogin(email: string) {
    setLoading(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "testpass123",
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Sign In Error", error.message ?? "Could not sign in");
    } finally {
      setLoading(null);
    }
  }

  const openDevModal = () => {
    setShowDevModal(true);
  };

  const closeDevModal = () => {
    setShowDevModal(false);
  };

  const renderButton = (
    onPress: () => void,
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    loadingKey: string,
    sfIcon?: SFSymbol
  ) => {
    const isLoading = loading === loadingKey;
    const content = (
      <>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {sfIcon ? (
              <SFIcon name={sfIcon} fallback={icon} size={22} color="#fff" />
            ) : (
              <Ionicons name={icon} size={22} color="#fff" />
            )}
            <Text style={styles.buttonText}>{label}</Text>
          </>
        )}
      </>
    );

    if (glassEnabled) {
      return (
        <HapticPressable onPress={onPress} disabled={loading !== null}>
          <GlassView
            isInteractive
            style={[styles.button, styles.glassButton]}
            colorScheme="light"
            glassEffectStyle="clear"
          >
            {content}
          </GlassView>
        </HapticPressable>
      );
    }

    return (
      <HapticPressable onPress={onPress} disabled={loading !== null}>
        <BlurView intensity={80} style={[styles.button, styles.fallbackButton]}>
          {content}
        </BlurView>
      </HapticPressable>
    );
  };

  const renderDevTrigger = () => {
    if (glassEnabled) {
      return (
        <HapticPressable testID="dev-login-trigger" style={styles.devTrigger} onPress={openDevModal}>
          <GlassView
            isInteractive
            style={styles.devTriggerGlass}
            glassEffectStyle="clear"
          >
            <Ionicons
              name="code-slash"
              size={14}
              color="rgba(255, 255, 255, 0.8)"
            />
            <Text style={styles.devTriggerText}>Dev Login</Text>
          </GlassView>
        </HapticPressable>
      );
    }

    return (
      <HapticPressable testID="dev-login-trigger" style={styles.devTrigger} onPress={openDevModal}>
        <BlurView intensity={60} style={styles.devTriggerFallback}>
          <Ionicons
            name="code-slash"
            size={14}
            color="rgba(255, 255, 255, 0.7)"
          />
          <Text style={styles.devTriggerText}>Dev Login</Text>
        </BlurView>
      </HapticPressable>
    );
  };

  const renderDevModalInner = () => (
    <View>
      <Text style={styles.devTitle}>Dev Login</Text>
      <ScrollView testID="dev-modal" contentContainerStyle={styles.seedGrid}>
        {SEED_USERS.map((user) => (
          <Pressable
            key={user.email}
            testID={`seed-user-${user.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
            style={styles.seedUser}
            onPress={() => {
              handleSeedLogin(user.email);
              closeDevModal();
            }}
            disabled={loading !== null}
          >
            <Image source={{ uri: user.avatar }} style={styles.seedAvatar} contentFit="cover" transition={200} />
            {loading === user.email ? (
              <ActivityIndicator size="small" color="#fff" style={styles.seedSpinner} />
            ) : (
              <Text style={styles.seedName} numberOfLines={1}>
                {user.name}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        testID="login-screen"
        source={splashBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0, 0, 0, 0.15)",
            "rgba(0, 0, 0, 0.55)",
            "rgba(0, 0, 0, 0.75)",
          ]}
          locations={[0, 0.3, 0.65, 1]}
          style={[styles.gradient, { zIndex: 2 }]}
        >
          <View
            style={[
              styles.container,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {/* Tagline anchored to top */}
            <Text style={styles.tagline}>
              Discover what&apos;s happening in the{"\n"}coolest little capital
            </Text>

            {/* Spacer pushes everything below to bottom */}
            <View style={{ flex: 1 }} />

            {/* Title anchored above buttons */}
            <Text testID="login-title" style={styles.title}>Welly</Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              {glassEnabled ? (
                <GlassContainer spacing={8} style={styles.buttonGroup}>
                  {renderButton(
                    handleGoogleSignIn,
                    "logo-google",
                    "Continue with Google",
                    "google"
                  )}
                  {Platform.OS === "ios" &&
                    renderButton(
                      handleAppleSignIn,
                      "logo-apple",
                      "Continue with Apple",
                      "apple",
                      "apple.logo"
                    )}
                </GlassContainer>
              ) : (
                <>
                  {renderButton(
                    handleGoogleSignIn,
                    "logo-google",
                    "Continue with Google",
                    "google"
                  )}
                  {Platform.OS === "ios" &&
                    renderButton(
                      handleAppleSignIn,
                      "logo-apple",
                      "Continue with Apple",
                      "apple",
                      "apple.logo"
                    )}
                </>
              )}
            </View>

            {/* Dev Login */}
            {renderDevTrigger()}
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Dev Login - full screen overlay */}
      {showDevModal && (
        <View style={styles.devOverlay}>
          {renderDevModalInner()}
        </View>
      )}
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: 0.2,
    alignSelf: "center",
    maxWidth: 300,
  },
  title: {
    fontSize: 110,
    fontFamily: fonts.pacifico,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  buttons: {
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 22,
    gap: 12,
    overflow: "hidden",
  },
  glassButton: {
    // GlassView handles the glass effect natively
  },
  fallbackButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.3,
  },
  devTrigger: {
    alignSelf: "center",
    marginTop: 8,
  },
  devTriggerGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  devTriggerFallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  devTriggerText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.3,
  },
  devOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "rgba(20, 20, 20, 0.97)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  devTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 2.5,
  },
  seedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 20,
  },
  seedUser: {
    alignItems: "center",
    width: 75,
  },
  seedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  seedName: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
  seedSpinner: {
    marginTop: 2,
  },
});
