import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { useQuery } from "../hooks/useQuery";
import { getProfileById } from "../services/users";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import type { Guide } from "../types";

interface GuideCardProps {
  guide: Guide;
  onPress?: () => void;
  compact?: boolean;
}

export function GuideCard({ guide, onPress, compact }: GuideCardProps) {
  const fetchCreator = useCallback(
    () => getProfileById(guide.userId),
    [guide.userId]
  );
  const { data: creator } = useQuery(fetchCreator, ["user", guide.userId]);

  return (
    <HapticPressable
      style={[styles.container, compact && styles.containerCompact]}
      onPress={onPress}
    >
      {guide.coverImageUrl ? (
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image
            source={{ uri: guide.coverImageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradient}
          />
          <Text style={styles.titleOverlay} numberOfLines={2}>
            {guide.title}
          </Text>
        </View>
      ) : (
        <View style={[styles.placeholderHeader, compact && styles.placeholderHeaderCompact]}>
          <SFIcon
            name="book.fill"
            fallback="book"
            size={compact ? 20 : 24}
            color="#FFFFFF"
          />
          <Text
            style={[styles.titlePlaceholder, compact && styles.titlePlaceholderCompact]}
            numberOfLines={2}
          >
            {guide.title}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.creatorRow}>
          {creator?.avatarUrl ? (
            <Image
              source={{ uri: creator.avatarUrl }}
              style={styles.creatorAvatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.creatorAvatar, styles.creatorAvatarFallback]}>
              <SFIcon name="person.fill" fallback="person" size={10} color={colors.textMuted} />
            </View>
          )}
          <Text style={styles.creatorName} numberOfLines={1}>
            {creator?.displayName ?? ""}
          </Text>
        </View>
        <View style={styles.placeCount}>
          <SFIcon
            name="mappin.and.ellipse"
            fallback="location"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.placeCountText}>
            {guide.placeCount} {guide.placeCount === 1 ? "place" : "places"}
          </Text>
        </View>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompact: {
    width: 200,
  },
  imageContainer: {
    height: 140,
    position: "relative",
  },
  imageContainerCompact: {
    height: 110,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  titleOverlay: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  placeholderHeader: {
    height: 140,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  placeholderHeaderCompact: {
    height: 110,
  },
  titlePlaceholder: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  titlePlaceholderCompact: {
    fontSize: 14,
  },
  footer: {
    padding: 12,
    gap: 6,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray200,
  },
  creatorAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  creatorName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
  placeCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeCountText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
});
