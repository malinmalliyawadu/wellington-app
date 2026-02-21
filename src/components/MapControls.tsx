import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";

const glassEnabled = isLiquidGlassAvailable();

interface MapControlsProps {
  activeFilterCount: number;
  showNeighborhoods: boolean;
  showExplorationOverlay: boolean;
  hasUserLocation: boolean;
  onOpenFilters: () => void;
  onToggleNeighborhoods: () => void;
  onToggleExploration: () => void;
  onCenterOnUser: () => void;
}

function ControlButtons({
  activeFilterCount,
  showNeighborhoods,
  showExplorationOverlay,
  hasUserLocation,
  onOpenFilters,
  onToggleNeighborhoods,
  onToggleExploration,
  onCenterOnUser,
}: MapControlsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <>
      <HapticPressable
        style={[
          styles.controlButton,
          styles.controlButtonTop,
          activeFilterCount > 0 && styles.controlButtonActive,
        ]}
        onPress={onOpenFilters}
      >
        <SFIcon
          name="slider.horizontal.3"
          fallback="options"
          size={22}
          color={activeFilterCount > 0 ? "#FFFFFF" : colors.text}
        />
      </HapticPressable>

      <View style={styles.controlDivider} />

      <HapticPressable
        style={[styles.controlButton]}
        onPress={onToggleNeighborhoods}
      >
        <SFIcon
          name={showNeighborhoods ? "map.fill" : "map"}
          fallback={showNeighborhoods ? "map" : "map-outline"}
          size={22}
          color={showNeighborhoods ? colors.primary : colors.text}
        />
      </HapticPressable>

      <View style={styles.controlDivider} />

      <HapticPressable
        style={[styles.controlButton]}
        onPress={onToggleExploration}
      >
        <SFIcon
          name={showExplorationOverlay ? "eye.fill" : "eye"}
          fallback={showExplorationOverlay ? "eye" : "eye-outline"}
          size={22}
          color={showExplorationOverlay ? colors.primary : colors.text}
        />
      </HapticPressable>

      <View style={styles.controlDivider} />

      <HapticPressable
        style={[styles.controlButton, styles.controlButtonBottom]}
        onPress={onCenterOnUser}
      >
        <SFIcon
          name={hasUserLocation ? "location.fill" : "location"}
          fallback={hasUserLocation ? "navigate" : "navigate-outline"}
          size={22}
          color={hasUserLocation ? colors.primary : colors.text}
        />
      </HapticPressable>
    </>
  );
}

export function MapControls(props: MapControlsProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { activeFilterCount } = props;

  return (
    <>
      {glassEnabled ? (
        <GlassView
          glassEffectStyle={isDark ? "clear" : "regular"}
          style={styles.controlsGlass}
        >
          <ControlButtons {...props} />
        </GlassView>
      ) : (
        <View style={styles.controlsContainer}>
          <BlurView
            intensity={10}
            tint={isDark ? "dark" : "light"}
            style={styles.controlsBlurBg}
          />
          <View style={styles.controlsInner}>
            <ControlButtons {...props} />
          </View>
        </View>
      )}
      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    controlsContainer: {
      width: 44,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    controlsGlass: {
      width: 44,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    controlsBlurBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.4)",
    },
    controlsInner: {
      width: "100%",
    },
    controlButton: {
      width: "100%",
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    controlButtonTop: {
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },
    controlButtonBottom: {
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
    },
    controlButtonActive: {
      backgroundColor: colors.primary,
    },
    controlDivider: {
      height: 1,
      backgroundColor: "rgba(0, 0, 0, 0.08)",
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.cardBackground,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.primary,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
