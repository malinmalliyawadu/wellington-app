import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { SFIcon } from "./SFIcon";
import { HapticPressable } from "./HapticPressable";
import { useQuery } from "../hooks/useQuery";
import {
  getGuidePlacePreviews,
  type GuidePlacePreview,
} from "../services/guides";
import { getGuideComments } from "../services/guideComments";
import { shareGuide } from "../utils/sharing";
import { useSave } from "../context/SaveContext";
import { useDoubleTapGuideLike } from "../hooks/useDoubleTapGuideLike";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import type { Guide, User, PlaceCategory } from "../types";
import type { SFSymbol } from "expo-symbols";

const IMAGE_HEIGHT = 240;
const glassEnabled = isLiquidGlassAvailable();

const CATEGORY_ICONS: Record<PlaceCategory, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
};

interface FeedGuideCardProps {
  guide: Guide;
  user: User;
  onPress?: () => void;
  onPressUser?: (userId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

export const FeedGuideCard = React.memo(function FeedGuideCard({
  guide,
  user,
  onPress,
  onPressUser,
}: FeedGuideCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width: screenWidth } = useWindowDimensions();
  const { isSaved, toggleSave } = useSave();
  const saved = isSaved("guide", guide.id);
  const [avatarError, setAvatarError] = useState(!user.avatarUrl);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    liked,
    likeCount,
    likeAnimatedStyle,
    handleLike,
  } = useDoubleTapGuideLike(guide.id);

  const fetchPreviews = useCallback(
    () => getGuidePlacePreviews(guide.id),
    [guide.id]
  );
  const { data: placePreviews } = useQuery(fetchPreviews, [
    "guidePlacePreviews",
    guide.id,
  ]);

  const fetchComments = useCallback(
    () => getGuideComments(guide.id),
    [guide.id]
  );
  const { data: comments } = useQuery(fetchComments, ['guideComments', guide.id], { staleTime: 30_000 });
  const commentCount = comments?.length ?? 0;

  const hasPlaces = placePreviews && placePreviews.length > 0;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const renderCarouselItem = useCallback(
    ({ item }: { item: GuidePlacePreview }) => (
      <HapticPressable
        onPress={onPress}
        style={{ width: screenWidth }}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.carouselImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.carouselImage, styles.placeholderBg]}>
            <SFIcon
              name="mappin"
              fallback="location"
              size={32}
              color="rgba(255,255,255,0.5)"
            />
          </View>
        )}
      </HapticPressable>
    ),
    [styles, screenWidth, onPress]
  );

  // Fallback cover when place previews haven't loaded yet
  const coverUri = guide.coverImageUrl ?? guide.firstPlaceImageUrl;

  return (
    <View style={styles.container}>
      {/* Image carousel / fallback cover */}
      <HapticPressable onPress={onPress} disabled={!!hasPlaces}>
        <View style={styles.imageContainer}>
          {hasPlaces ? (
            <FlatList
              data={placePreviews}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.placeId}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              scrollEventThrottle={16}
            />
          ) : coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.carouselImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.carouselImage, styles.placeholderBg]}>
              <SFIcon
                name="book.fill"
                fallback="book"
                size={40}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          )}

          {/* GUIDE badge */}
          {glassEnabled ? (
            <GlassView style={styles.badge} glassEffectStyle="regular">
              <SFIcon name="book.fill" fallback="book" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>GUIDE</Text>
            </GlassView>
          ) : (
            <View style={[styles.badge, styles.badgeFallback]}>
              <SFIcon name="book.fill" fallback="book" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>GUIDE</Text>
            </View>
          )}

          {/* Place name label (top-right) */}
          {hasPlaces && placePreviews[activeIndex] && (() => {
            const cat = placePreviews[activeIndex].category as PlaceCategory;
            const icon = CATEGORY_ICONS[cat];
            const content = (
              <>
                {icon && (
                  <SFIcon
                    name={icon.sf}
                    fallback={icon.fallback}
                    size={12}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.placeLabelText} numberOfLines={1}>
                  {placePreviews[activeIndex].name}
                </Text>
              </>
            );
            return glassEnabled ? (
              <GlassView style={styles.placeLabel} glassEffectStyle="regular">
                {content}
              </GlassView>
            ) : (
              <View style={[styles.placeLabel, styles.placeLabelFallback]}>
                {content}
              </View>
            );
          })()}

          {/* Bottom gradient + title overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
            pointerEvents="none"
          >
            <Text style={styles.title} numberOfLines={2}>
              {guide.title}
            </Text>
            <View style={styles.placeCountRow}>
              <SFIcon
                name="mappin.and.ellipse"
                fallback="location"
                size={13}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.placeCountText}>
                {guide.placeCount}{" "}
                {guide.placeCount === 1 ? "place" : "places"}
              </Text>
            </View>
          </LinearGradient>

          {/* Pagination dots (overlaid on image) */}
          {hasPlaces && placePreviews.length > 1 && (
            <View style={styles.dotsContainer} pointerEvents="none">
              {placePreviews.map((p, i) => (
                <View
                  key={p.placeId}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </HapticPressable>

      {/* Creator row */}
      <View style={styles.creatorRow}>
        <HapticPressable
          style={styles.creatorInfo}
          onPress={() => onPressUser?.(user.id)}
          disabled={!onPressUser}
        >
          {avatarError ? (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={16} color={colors.textMuted} />
            </View>
          ) : (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
              contentFit="cover"
              transition={200}
            />
          )}
          <Text style={styles.creatorName} numberOfLines={1}>
            {user.displayName}
          </Text>
        </HapticPressable>
        <Text style={styles.timeAgo}>{formatTimeAgo(guide.createdAt)}</Text>
      </View>

      {/* Description */}
      {guide.description ? (
        <HapticPressable style={styles.descriptionRow} onPress={onPress}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {guide.description}
          </Text>
        </HapticPressable>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <View style={styles.actionButton}>
            <HapticPressable
              onPress={handleLike}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={likeAnimatedStyle}>
                <SFIcon
                  name={liked ? "heart.fill" : "heart"}
                  fallback={liked ? "heart" : "heart-outline"}
                  size={24}
                  color={liked ? colors.liked : colors.text}
                />
              </Animated.View>
            </HapticPressable>
            <Text
              style={[styles.actionCount, liked && { color: colors.liked }]}
            >
              {likeCount}
            </Text>
          </View>
          <HapticPressable
            style={styles.actionButton}
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SFIcon name="bubble.left" fallback="chatbubble-outline" size={22} color={colors.text} />
            <Text style={styles.actionCount}>{commentCount}</Text>
          </HapticPressable>
          <HapticPressable
            onPress={() => shareGuide(guide.id, guide.title)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SFIcon
              name="paperplane"
              fallback="paper-plane-outline"
              size={22}
              color={colors.text}
            />
          </HapticPressable>
        </View>
        <HapticPressable
          onPress={() => toggleSave("guide", guide.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SFIcon
            name={saved ? "bookmark.fill" : "bookmark"}
            fallback={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={saved ? colors.saved : colors.text}
          />
        </HapticPressable>
      </View>

      {/* Bottom divider */}
      <View style={styles.divider} />
    </View>
  );
});

const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
    },
    imageContainer: {
      height: IMAGE_HEIGHT,
      position: "relative",
    },
    carouselImage: {
      width: "100%",
      height: IMAGE_HEIGHT,
      backgroundColor: colors.gray200,
    },
    placeholderBg: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    badge: {
      position: "absolute",
      top: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    badgeFallback: {
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    badgeText: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
      letterSpacing: 0.5,
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    placeLabel: {
      position: "absolute",
      top: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      maxWidth: "60%",
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    placeLabelFallback: {
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    dotsContainer: {
      position: "absolute",
      bottom: 10,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.4)",
    },
    dotActive: {
      backgroundColor: "#FFFFFF",
      width: 18,
    },
    placeLabelText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
      flexShrink: 1,
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    gradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 40,
      paddingBottom: 14,
      paddingHorizontal: 12,
    },
    title: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    placeCountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    placeCountText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: "rgba(255,255,255,0.85)",
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    creatorRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 4,
    },
    creatorInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray200,
    },
    avatarFallback: {
      justifyContent: "center",
      alignItems: "center",
    },
    creatorName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    timeAgo: {
      fontSize: 13,
      color: colors.textMuted,
    },
    descriptionRow: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 4,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    actionsLeft: {
      flexDirection: "row",
      gap: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    actionCount: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      fontFamily: fonts.medium,
    },
    divider: {
      height: 5,
      backgroundColor: colors.gray100,
    },
  } as const);
