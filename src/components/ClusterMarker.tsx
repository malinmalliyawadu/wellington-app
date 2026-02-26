import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { CATEGORY_ICONS } from "./PopularityMarker";
import { SFIcon } from "./SFIcon";
import { PlaceCategory } from "../types";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

const glassEnabled = isLiquidGlassAvailable();

const CLUSTER_SIZE = 44;
const ICON_SIZE = 20;
const BADGE_SIZE = 18;

interface ClusterMarkerProps {
  category: PlaceCategory;
  count: number;
}

function ClusterMarkerInner({ category, count }: ClusterMarkerProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const color = colors.category[category];
  const icon = CATEGORY_ICONS[category];

  const renderCircle = () => {
    if (glassEnabled) {
      return (
        <GlassView
          style={[styles.circle, { backgroundColor: color + "55" }]}
          glassEffectStyle="clear"
        >
          <SFIcon
            name={icon.sf}
            fallback={icon.fallback}
            size={ICON_SIZE}
            color={isDark ? "#E8E8E8" : color}
          />
        </GlassView>
      );
    }

    return (
      <BlurView
        intensity={40}
        tint={isDark ? "dark" : "light"}
        style={styles.circle}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(30, 30, 30, 0.6)"
                : "rgba(255, 255, 255, 0.4)",
              borderRadius: CLUSTER_SIZE / 2,
              borderWidth: 2.5,
              borderColor: color,
            },
          ]}
        />
        <SFIcon
          name={icon.sf}
          fallback={icon.fallback}
          size={ICON_SIZE}
          color={isDark ? "#E8E8E8" : color}
        />
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      {renderCircle()}
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
      </View>
    </View>
  );
}

export const ClusterMarker = React.memo(ClusterMarkerInner);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      width: CLUSTER_SIZE + BADGE_SIZE / 2,
      height: CLUSTER_SIZE + BADGE_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    circle: {
      width: CLUSTER_SIZE,
      height: CLUSTER_SIZE,
      borderRadius: CLUSTER_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    badge: {
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: BADGE_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontFamily: fonts.bold,
      fontWeight: "700",
    },
  });
