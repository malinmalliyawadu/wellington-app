import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticPressable } from "./HapticPressable";
import { colors } from "../theme/colors";

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
      <BlurView intensity={10} tint="light" style={styles.blur}>
        <Ionicons name="add" size={28} color={colors.gray600} />
      </BlurView>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
