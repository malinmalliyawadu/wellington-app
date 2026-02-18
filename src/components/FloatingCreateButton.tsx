import React from "react";
import { StyleSheet, ViewStyle, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";

const glassEnabled = isLiquidGlassAvailable();

interface FloatingCreateButtonProps {
  style?: ViewStyle;
}

export function FloatingCreateButton({ style }: FloatingCreateButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    // Determine current tab from pathname and navigate to create-post sheet with appropriate default
    if (pathname.startsWith("/feed")) {
      router.push("/feed/create-post?defaultType=post");
    } else if (pathname.startsWith("/events")) {
      router.push("/events/create-post?defaultType=event");
    } else {
      // Default to map tab (post)
      router.push("/map/create-post?defaultType=post");
    }
  };

  return (
    <HapticPressable
      style={[
        styles.container,
        { bottom: insets.bottom + 60 }, // Position above tab bar
        style,
      ]}
      onPress={handlePress}
    >
      {glassEnabled ? (
        <GlassView isInteractive style={styles.glassOuter}>
          <SFIcon name="plus" fallback="add" size={28} />
        </GlassView>
      ) : (
        <BlurView intensity={10} tint="light" style={styles.blur}>
          <SFIcon name="plus" fallback="add" size={28} color={colors.gray600} />
        </BlurView>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
  },
  glassOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
