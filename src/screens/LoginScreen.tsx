import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from "react-native";
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
import { HapticPressable } from "src/components/HapticPressable";
import { usePostHog } from "posthog-react-native";

const glassEnabled = isLiquidGlassAvailable();

const splashBg = require("../../assets/splash-bg.png");

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const posthog = usePostHog();

  async function handleGoogleSignIn() {
    setLoading("google");
    try {
      await signInWithGoogle();
      posthog.capture("user_signed_in", { method: "google" });
    } catch (error: any) {
      posthog.capture("sign_in_error", {
        method: "google",
        error_message: error.message ?? "Could not sign in with Google",
      });
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
      posthog.capture("user_signed_in", { method: "apple" });
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") return;
      posthog.capture("sign_in_error", {
        method: "apple",
        error_message: error.message ?? "Could not sign in with Apple",
      });
      Alert.alert(
        "Sign In Error",
        error.message ?? "Could not sign in with Apple"
      );
    } finally {
      setLoading(null);
    }
  }

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
            <Text testID="login-title" style={styles.title}>
              Welly
            </Text>

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
          </View>
        </LinearGradient>
      </ImageBackground>
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
});
