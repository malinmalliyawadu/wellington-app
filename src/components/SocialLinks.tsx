import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "./HapticPressable";
import { useTheme } from "../theme/ThemeContext";

interface SocialLinksProps {
  instagramUsername?: string;
  tiktokUsername?: string;
  xUsername?: string;
}

const PLATFORMS = [
  {
    key: "instagram" as const,
    icon: "logo-instagram" as const,
    urlFor: (handle: string) => `https://instagram.com/${handle}`,
  },
  {
    key: "tiktok" as const,
    icon: "logo-tiktok" as const,
    urlFor: (handle: string) => `https://tiktok.com/@${handle}`,
  },
  {
    key: "x" as const,
    icon: "logo-twitter" as const,
    urlFor: (handle: string) => `https://x.com/${handle}`,
  },
] as const;

export function SocialLinks({ instagramUsername, tiktokUsername, xUsername }: SocialLinksProps) {
  const { colors } = useTheme();

  const handles: Record<string, string | undefined> = {
    instagram: instagramUsername,
    tiktok: tiktokUsername,
    x: xUsername,
  };

  const active = PLATFORMS.filter((p) => handles[p.key]);

  if (active.length === 0) return null;

  return (
    <View style={styles.row}>
      {active.map((platform) => (
        <HapticPressable
          key={platform.key}
          onPress={() => Linking.openURL(platform.urlFor(handles[platform.key]!))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.iconButton}
        >
          <Ionicons name={platform.icon} size={20} color={colors.textSecondary} />
        </HapticPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  iconButton: {
    padding: 4,
  },
});
