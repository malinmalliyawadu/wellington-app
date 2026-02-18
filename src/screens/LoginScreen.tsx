import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Sacramento_400Regular } from "@expo-google-fonts/sacramento";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { signInWithGoogle, signInWithApple } from "../services/auth";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";

const glassEnabled = isLiquidGlassAvailable();

const BG_PHOTOS = [
  "https://images.unsplash.com/photo-1489171084589-9b5031ebcf9b?w=1400&q=80", // Wellington harbour
  "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1400&q=80", // Wellington cable car
  "https://images.unsplash.com/photo-1562620948-7ef06527f430?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Wellington waterfront
  "https://images.unsplash.com/photo-1707566289229-17ae45d885e8?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Wellington night
  "https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Wellington hills
];

const PHOTO_DURATION = 6000; // ms per photo
const CROSSFADE_DURATION = 1500; // ms for crossfade
const PARALLAX_SHIFT = 30; // px of slow pan per photo

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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
    Sacramento_400Regular,
    Pacifico_400Regular,
  });

  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState<"google" | "apple" | string | null>(
    null
  );
  const [showDevModal, setShowDevModal] = useState(false);
  const translateY = useSharedValue(600);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Carousel — two stable layers (A/B) that flip-flop roles.
  // The visible layer never changes source; only the hidden one gets a new URI.
  const [layerA, setLayerA] = useState(BG_PHOTOS[0]);
  const [layerB, setLayerB] = useState(BG_PHOTOS[1]);
  const [aIsTop, setAIsTop] = useState(true);
  const nextIdxRef = React.useRef(1);
  const topOpacity = useSharedValue(1);
  const parallaxAnim = useSharedValue(0);

  useEffect(() => {
    parallaxAnim.value = 0;
    parallaxAnim.value = withTiming(1, {
      duration: PHOTO_DURATION + CROSSFADE_DURATION,
      easing: Easing.linear,
    });

    topOpacity.value = 1;
    topOpacity.value = withSequence(
      withTiming(1, { duration: PHOTO_DURATION - CROSSFADE_DURATION }),
      withTiming(0, {
        duration: CROSSFADE_DURATION,
        easing: Easing.inOut(Easing.ease),
      })
    );

    const timer = setTimeout(() => {
      // The top layer just faded out. Now:
      // 1. Load the next photo into the (now hidden) top layer
      // 2. Flip which layer is on top
      const upcoming =
        BG_PHOTOS[(nextIdxRef.current + 1) % BG_PHOTOS.length];
      if (aIsTop) {
        setLayerA(upcoming);
      } else {
        setLayerB(upcoming);
      }
      nextIdxRef.current = (nextIdxRef.current + 1) % BG_PHOTOS.length;
      setAIsTop((prev) => !prev);
    }, PHOTO_DURATION);

    return () => clearTimeout(timer);
  }, [aIsTop]);

  const topLayerStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
    transform: [
      {
        translateX: interpolate(
          parallaxAnim.value,
          [0, 1],
          [0, -PARALLAX_SHIFT]
        ),
      },
      { scale: 1.1 },
    ],
    zIndex: 1,
  }));

  const bottomLayerStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      {
        translateX: interpolate(
          parallaxAnim.value,
          [0, 1],
          [PARALLAX_SHIFT, 0]
        ),
      },
      { scale: 1.1 },
    ],
    zIndex: 0,
  }));

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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
        <HapticPressable style={styles.devTrigger} onPress={openDevModal}>
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
      <HapticPressable style={styles.devTrigger} onPress={openDevModal}>
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

  const renderDevModalInner = () => {
    const inner = (
      <>
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
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.seedSpinner}
                />
              ) : (
                <Text style={styles.seedName} numberOfLines={1}>
                  {user.name}
                </Text>
              )}
            </HapticPressable>
          ))}
        </ScrollView>
      </>
    );

    if (glassEnabled) {
      return <GlassView style={styles.devModalGlass}>{inner}</GlassView>;
    }

    return (
      <BlurView intensity={100} style={styles.devModalBlur}>
        {inner}
      </BlurView>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.backgroundImage}>
        {/* Layer A */}
        <Reanimated.Image
          source={{ uri: layerA }}
          style={[
            styles.carouselImage,
            { width: screenWidth + PARALLAX_SHIFT * 2, height: screenHeight },
            aIsTop ? topLayerStyle : bottomLayerStyle,
          ]}
          resizeMode="cover"
        />
        {/* Layer B */}
        <Reanimated.Image
          source={{ uri: layerB }}
          style={[
            styles.carouselImage,
            { width: screenWidth + PARALLAX_SHIFT * 2, height: screenHeight },
            aIsTop ? bottomLayerStyle : topLayerStyle,
          ]}
          resizeMode="cover"
        />
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
              Discover what's happening in the{"\n"}coolest little capital
            </Text>

            {/* Spacer pushes everything below to bottom */}
            <View style={{ flex: 1 }} />

            {/* Title anchored above buttons */}
            <Text style={styles.title}>Welly</Text>

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
      </View>

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
              {renderDevModalInner()}
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
    backgroundColor: "#000",
    overflow: "hidden",
  },
  carouselImage: {
    position: "absolute",
    top: 0,
    left: 0,
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
    fontFamily: "Pacifico_400Regular",
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
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    maxHeight: "70%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  devModalGlass: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  devModalBlur: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignSelf: "center",
    marginBottom: 24,
  },
  devTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  seedSpinner: {
    marginTop: 2,
  },
});
