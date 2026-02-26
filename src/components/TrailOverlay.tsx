import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { SFIcon } from "./SFIcon";
import { Trail } from "../types";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import * as Haptics from "expo-haptics";

interface TrailOverlayProps {
  trails: Trail[];
  activeTrailId: string | null;
  onTrailPress: (trailId: string) => void;
  clusteredTrailIds?: Set<string>;
}

export function TrailOverlay({
  trails,
  activeTrailId,
  onTrailPress,
  clusteredTrailIds,
}: TrailOverlayProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <>
      {trails.map((trail) => {
        const isDimmed = activeTrailId !== null && activeTrailId !== trail.id;
        const isClustered = clusteredTrailIds?.has(trail.id) ?? false;
        return (
          <React.Fragment key={trail.id}>
            <Polyline
              coordinates={trail.coordinates}
              strokeColor={
                isDimmed ? "rgba(45, 106, 79, 0.08)" : "rgba(45, 106, 79, 0.3)"
              }
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              tappable={false}
            />
            <Polyline
              coordinates={trail.coordinates}
              strokeColor={
                isDimmed ? "rgba(45, 106, 79, 0.15)" : colors.category.park
              }
              strokeWidth={2}
              lineDashPattern={[6, 4]}
              lineCap="round"
              lineJoin="round"
              tappable={false}
            />
            {!isClustered && (
              <Marker
                coordinate={trail.coordinates[0]}
                anchor={{ x: 0.5, y: 0 }}
                opacity={isDimmed ? 0.1 : 1}
                zIndex={activeTrailId === trail.id ? 999 : 1}
                tracksViewChanges={false}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onTrailPress(trail.id);
                }}
              >
                <View style={styles.trailMarker}>
                  <View style={styles.trailMarkerPin}>
                    <SFIcon
                      name="figure.hiking"
                      fallback="walk"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.trailMarkerLabel}>
                    <Text style={styles.trailMarkerName}>{trail.name}</Text>
                    <Text style={styles.trailMarkerInfo}>
                      {trail.elevation} · {trail.distance}
                    </Text>
                  </View>
                </View>
              </Marker>
            )}
            {!isClustered && (
              <Marker
                coordinate={trail.coordinates[trail.coordinates.length - 1]}
                anchor={{ x: 0.5, y: 0.5 }}
                opacity={isDimmed ? 0.1 : 1}
                zIndex={activeTrailId === trail.id ? 998 : 1}
                tracksViewChanges={false}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onTrailPress(trail.id);
                }}
              >
                <View style={styles.trailheadDot}>
                  <View style={styles.trailheadDotInner} />
                </View>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    trailMarker: {
      alignItems: "center",
      paddingBottom: 8,
    },
    trailMarkerPin: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.category.park,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
      marginBottom: 4,
    },
    trailMarkerLabel: {
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    trailMarkerName: {
      fontSize: 12,
      fontWeight: "700",
      fontFamily: fonts.bold,
      color: colors.category.park,
    },
    trailMarkerInfo: {
      fontSize: 10,
      fontWeight: "500",
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    trailheadDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    trailheadDotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.category.park,
    },
  });
