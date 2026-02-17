import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { PlaceCategory } from "../types";
import { colors } from "../theme/colors";

const glassEnabled = isLiquidGlassAvailable();

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  attraction: "compass",
  park: "leaf",
  venue: "musical-notes",
};

interface PopularityMarkerProps {
  size: number;
  category: PlaceCategory;
  postCount: number;
  isFollowed: boolean;
  placeName?: string;
  posterAvatars?: string[];
  showLabel?: boolean;
}

export function PopularityMarker({
  size,
  category,
  isFollowed,
  placeName,
  posterAvatars = [],
  showLabel = false,
}: PopularityMarkerProps) {
  const color = colors.category[category];
  const iconSize = Math.round(size * 0.45);
  const iconName = CATEGORY_ICONS[category];

  const renderMarker = () => {
    if (glassEnabled) {
      // Followed — solid vibrant color (glass washes it out)
      if (isFollowed) {
        return (
          <GlassView
            style={[
              styles.followedGlassMarker,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
            glassEffectStyle="clear"
          >
            <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
          </GlassView>
        );
      }

      // Unfollowed — muted glass with category color
      return (
        <GlassView
          style={[
            styles.glassMarker,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color + "44",
            },
          ]}
          glassEffectStyle="clear"
        >
          <Ionicons name={iconName} size={iconSize} color={color} />
        </GlassView>
      );
    }

    // --- Fallback path (no liquid glass) ---
    if (isFollowed) {
      return (
        <View
          style={[
            styles.markerContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <BlurView
            intensity={30}
            tint="light"
            style={[
              styles.marker,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: color,
                  opacity: 0.85,
                  borderRadius: size / 2,
                },
              ]}
            />
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.4)",
                "rgba(255, 255, 255, 0)",
                "rgba(0, 0, 0, 0.15)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.7 }}
              style={[
                styles.highlight,
                {
                  width: size * 0.6,
                  height: size * 0.6,
                  borderRadius: (size * 0.6) / 2,
                },
              ]}
            />
            <Ionicons
              name={iconName}
              size={iconSize}
              color="#FFFFFF"
              style={{ zIndex: 10 }}
            />
          </BlurView>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.markerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <BlurView
          intensity={40}
          tint="light"
          style={[
            styles.blurMarker,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                borderRadius: size / 2,
                borderWidth: 2.5,
                borderColor: color,
              },
            ]}
          />
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 0)",
              "rgba(0, 0, 0, 0.1)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.7)", "rgba(255, 255, 255, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={[
              styles.highlight,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: (size * 0.5) / 2,
              },
            ]}
          />
          <Ionicons
            name={iconName}
            size={iconSize}
            color={color}
            style={{ zIndex: 10 }}
          />
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMarker()}
      {showLabel && placeName && (
        <View style={styles.labelWrapper}>
          {glassEnabled ? (
            <GlassView style={styles.glassLabelContainer}>
              <Text style={styles.labelName} numberOfLines={1}>
                {placeName}
              </Text>
              {posterAvatars.length > 1 && (
                <View style={styles.avatarRow}>
                  <View style={styles.avatarStack}>
                    {posterAvatars.slice(0, 8).map((avatarUrl, i) => (
                      <Image
                        key={`${avatarUrl}-${i}`}
                        source={{ uri: avatarUrl }}
                        style={[styles.avatar, { left: i * 10 }]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </GlassView>
          ) : (
            <BlurView intensity={15} tint="light" style={styles.labelContainer}>
              <Text style={styles.labelName} numberOfLines={1}>
                {placeName}
              </Text>
              {posterAvatars.length > 1 && (
                <View style={styles.avatarRow}>
                  <View style={styles.avatarStack}>
                    {posterAvatars.slice(0, 8).map((avatarUrl, i) => (
                      <Image
                        key={`${avatarUrl}-${i}`}
                        source={{ uri: avatarUrl }}
                        style={[styles.avatar, { left: i * 10 }]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </BlurView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  followedGlassMarker: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  glassMarker: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  glassLabelContainer: {
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  marker: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  markerContainer: {
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  blurMarker: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: "10%",
    left: "10%",
  },
  labelWrapper: {
    marginTop: 2,
    borderRadius: 8,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  labelContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  labelName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    gap: 4,
  },
  avatarStack: {
    flexDirection: "row",
    height: 14,
    width: 34, // 14 + 2*10 overlap
  },
  avatar: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
});
