import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { useQuery } from "../hooks/useQuery";
import { getTrailById } from "../services/trails";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import type { TrailDifficulty } from "../types";

const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
  easy: colors.success,
  moderate: "#F59E0B",
  hard: colors.error,
};

const DIFFICULTY_LABELS: Record<TrailDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

export function TrailDetailSheetScreen() {
  const { trailId } = useLocalSearchParams<{ trailId: string }>();

  const fetchTrail = useCallback(
    () => getTrailById(trailId ?? ""),
    [trailId]
  );
  const { data: trail, loading } = useQuery(fetchTrail, ["trail", trailId]);

  if (loading || !trail) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const handleOpenDirections = () => {
    const { latitude, longitude, label } = trail.trailhead;
    const encodedLabel = encodeURIComponent(label);

    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodedLabel}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        );
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <SFIcon
                name="figure.hiking"
                fallback="walk"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.titleText}>
              <Text style={styles.name}>{trail.name}</Text>
              <Text style={styles.trailhead}>{trail.trailhead.label}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <SFIcon
                name="mountain.2"
                fallback="trending-up"
                size={16}
                color={colors.category.park}
              />
              <Text style={styles.statValue}>{trail.elevation}</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
            <View style={styles.statCard}>
              <SFIcon
                name="point.topleft.down.to.point.bottomright.curvepath"
                fallback="trail-sign"
                size={16}
                color={colors.category.park}
              />
              <Text style={styles.statValue}>{trail.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <SFIcon
                name="clock"
                fallback="time-outline"
                size={16}
                color={colors.category.park}
              />
              <Text style={styles.statValue}>{trail.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>

          {/* Difficulty badge */}
          <View style={styles.difficultyRow}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLORS[trail.difficulty] },
              ]}
            >
              <Text style={styles.difficultyText}>{DIFFICULTY_LABELS[trail.difficulty]}</Text>
            </View>
            <HapticPressable
              style={styles.directionsButton}
              onPress={handleOpenDirections}
            >
              <SFIcon
                name="location.fill"
                fallback="navigate"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.directionsText}>Directions to trailhead</Text>
            </HapticPressable>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this trail</Text>
          <Text style={styles.description}>{trail.description}</Text>
        </View>

        {/* Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          {trail.highlights.map((highlight, i) => (
            <View key={i} style={styles.highlightRow}>
              <SFIcon
                name="leaf.fill"
                fallback="leaf"
                size={14}
                color={colors.category.park}
              />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.category.park,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleText: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  trailhead: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.category.park + "10",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.category.park + "20",
  },
  statValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  directionsText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  highlightText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});
