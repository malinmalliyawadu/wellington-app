import React from "react";
import { StyleSheet, ViewStyle, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";

const glassEnabled = isLiquidGlassAvailable();

interface FloatingCreateButtonProps {
  style?: ViewStyle;
}

function AIIcon() {
  return (
    <Animated.View style={[aiStyles.iconWrap]}>
      <SFIcon
        name="sparkles"
        fallback="sparkles"
        size={32}
        color={colors.text}
      />
    </Animated.View>
  );
}

const aiStyles = StyleSheet.create({
  iconWrap: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },
});

function Buttons() {
  const router = useRouter();
  const pathname = usePathname();

  const tabPrefix = pathname.startsWith("/feed")
    ? "/feed"
    : pathname.startsWith("/events")
    ? "/events"
    : "/map";

  const handleCreate = () => {
    const defaultType = pathname.startsWith("/events") ? "event" : "post";
    router.push(`${tabPrefix}/create-post?defaultType=${defaultType}`);
  };

  const handleAI = () => {
    router.push(`${tabPrefix}/ai-chat`);
  };

  return (
    <>
      <HapticPressable
        style={[styles.button, styles.buttonTop]}
        onPress={handleAI}
      >
        <AIIcon />
      </HapticPressable>

      <View style={styles.divider} />

      <HapticPressable
        style={[styles.button, styles.buttonBottom]}
        onPress={handleCreate}
      >
        <SFIcon name="plus" fallback="add" size={26} color={colors.text} />
      </HapticPressable>
    </>
  );
}

export function FloatingCreateButton({ style }: FloatingCreateButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: insets.bottom + 60 }, style]}>
      {glassEnabled ? (
        <GlassView style={styles.glass}>
          <Buttons />
        </GlassView>
      ) : (
        <View style={styles.blurContainer}>
          <BlurView intensity={10} tint="light" style={styles.blurBg} />
          <View style={styles.blurInner}>
            <Buttons />
          </View>
        </View>
      )}
    </View>
  );
}

const BUTTON_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
  },
  glass: {
    width: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: "hidden",
  },
  blurContainer: {
    width: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  blurBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  blurInner: {
    width: "100%",
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTop: {
    borderTopLeftRadius: BUTTON_SIZE / 2,
    borderTopRightRadius: BUTTON_SIZE / 2,
  },
  buttonBottom: {
    borderBottomLeftRadius: BUTTON_SIZE / 2,
    borderBottomRightRadius: BUTTON_SIZE / 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
});
