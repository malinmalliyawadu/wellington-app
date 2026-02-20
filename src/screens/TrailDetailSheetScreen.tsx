import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { EventCard } from "../components/EventCard";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { useQuery } from "../hooks/useQuery";
import { useFollow } from "../context/FollowContext";
import { useLike } from "../context/LikeContext";
import { getTrailById } from "../services/trails";
import { getPostsByPlaceId } from "../services/posts";
import { getUpcomingEvents } from "../services/events";
import { getPlaceById } from "../services/places";
import { getProfileById } from "../services/users";
import { sortPosts } from "../utils/postSorting";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import type { TrailDifficulty, Post } from "../types";

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
  const router = useRouter();
  const { followingIds } = useFollow();
  const { getLikeCount } = useLike();

  const fetchTrail = useCallback(() => getTrailById(trailId ?? ""), [trailId]);
  const { data: trail, loading } = useQuery(fetchTrail, ["trail", trailId]);

  // Fetch posts for the trail's shadow place
  const fetchPosts = useCallback(
    () =>
      trail?.placeId ? getPostsByPlaceId(trail.placeId) : Promise.resolve([]),
    [trail?.placeId]
  );
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts, [
    "posts",
    "trail",
    trail?.placeId,
  ]);

  // Fetch the shadow place record for EventCard
  const fetchPlace = useCallback(
    () =>
      trail?.placeId ? getPlaceById(trail.placeId) : Promise.resolve(null),
    [trail?.placeId]
  );
  const { data: trailPlace } = useQuery(fetchPlace, ["place", trail?.placeId]);

  // Fetch events
  const { data: allUpcomingEvents, refetch: refetchEvents } = useQuery(
    getUpcomingEvents,
    "upcoming-events"
  );

  const trailEvents = useMemo(() => {
    if (!allUpcomingEvents || !trail?.placeId) return [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    const end = endDate.toISOString().split("T")[0];
    return allUpcomingEvents.filter(
      (e) => e.placeId === trail.placeId && e.date >= today && e.date <= end
    );
  }, [allUpcomingEvents, trail?.placeId]);

  // Refetch on focus
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchEvents();
    }, [refetchPosts, refetchEvents])
  );

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return sortPosts(posts);
  }, [posts]);

  const totalLikes = useMemo(
    () => (posts ?? []).reduce((sum, p) => sum + getLikeCount(p.id), 0),
    [posts, getLikeCount]
  );

  if (loading || !trail) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const trailColor = colors.category.trail;

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
            <View style={[styles.iconCircle, { backgroundColor: trailColor }]}>
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
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: trailColor + "10",
                  borderColor: trailColor + "20",
                },
              ]}
            >
              <SFIcon
                name="mountain.2"
                fallback="trending-up"
                size={16}
                color={trailColor}
              />
              <Text style={styles.statValue}>{trail.elevation}</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: trailColor + "10",
                  borderColor: trailColor + "20",
                },
              ]}
            >
              <SFIcon
                name="point.topleft.down.to.point.bottomright.curvepath"
                fallback="trail-sign"
                size={16}
                color={trailColor}
              />
              <Text style={styles.statValue}>{trail.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: trailColor + "10",
                  borderColor: trailColor + "20",
                },
              ]}
            >
              <SFIcon
                name="clock"
                fallback="time-outline"
                size={16}
                color={trailColor}
              />
              <Text style={styles.statValue}>{trail.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>

          {/* Difficulty badge + directions */}
          <View style={styles.difficultyRow}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLORS[trail.difficulty] },
              ]}
            >
              <Text style={styles.difficultyText}>
                {DIFFICULTY_LABELS[trail.difficulty]}
              </Text>
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

          {/* Engagement stats */}
          <View style={styles.engagementRow}>
            <View style={styles.engagementStat}>
              <SFIcon
                name="bubble.left"
                fallback="chatbubble-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.engagementText}>
                {sortedPosts.length} posts
              </Text>
            </View>
            <View style={styles.engagementStat}>
              <SFIcon
                name="heart"
                fallback="heart-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.engagementText}>{totalLikes} likes</Text>
            </View>
          </View>
        </View>

        {/* Events section */}
        {trailEvents.length > 0 && trailPlace && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <SFIcon
                name="calendar"
                fallback="calendar"
                size={16}
                color={colors.category.venue}
              />
              <Text style={styles.eventsSectionTitle}>Events this week</Text>
            </View>
            {trailEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                place={trailPlace}
                compact
                hasBorder
                onPress={() => {
                  router.push(`/map/event/${event.id}`);
                }}
              />
            ))}
          </View>
        )}

        {/* Posts section */}
        {sortedPosts.length > 0 ? (
          <View style={styles.postsSection}>
            <Text style={{ ...styles.sectionTitle, paddingHorizontal: 16 }}>
              Posts
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.postsCarousel}
            >
              {sortedPosts.map((post) => (
                <HapticPressable
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => {
                    router.dismiss();
                    router.push(`/map/post/${post.id}`);
                  }}
                >
                  <PostCardContent
                    post={post}
                    isFollowed={followingIds.includes(post.userId)}
                  />
                </HapticPressable>
              ))}
            </ScrollView>
            <LiquidGlassButton
              title="Create Post"
              icon="add-circle"
              size="large"
              fullWidth
              onPress={() => {
                router.dismiss();
                router.push({
                  pathname: "/map/create-post",
                  params: { placeId: trail.placeId },
                });
              }}
              style={styles.createButton}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <SFIcon
              name="bubble.left"
              fallback="chatbubble-outline"
              size={48}
              color={colors.gray600}
            />
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to share your experience!
            </Text>
            <LiquidGlassButton
              title="Create Post"
              icon="add-circle"
              size="large"
              onPress={() => {
                router.dismiss();
                router.push({
                  pathname: "/map/create-post",
                  params: { placeId: trail.placeId },
                });
              }}
            />
          </View>
        )}

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
                color={trailColor}
              />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PostCardContent({
  post,
  isFollowed,
}: {
  post: Post;
  isFollowed: boolean;
}) {
  const fetchUser = useCallback(
    () => getProfileById(post.userId),
    [post.userId]
  );
  const { data: user } = useQuery(fetchUser, ["user", post.userId]);
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);

  return (
    <>
      {post.mediaUrl ? (
        post.type === "video" ? (
          <VideoThumbnail
            thumbnailUrl={post.thumbnailUrl}
            fallbackUrl={post.mediaUrl}
            style={styles.postCardImage}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={styles.postCardImage} contentFit="cover" transition={200} />
        )
      ) : (
        <View style={[styles.postCardImage, styles.postCardTextPlaceholder]}>
          <SFIcon
            name="doc.text.fill"
            fallback="document-text"
            size={24}
            color={colors.gray400}
          />
        </View>
      )}
      <View style={styles.postCardBody}>
        <View style={styles.postCardUserRow}>
          <Image
            source={{ uri: user?.avatarUrl }}
            style={styles.postCardAvatar}
            contentFit="cover"
            transition={200}
          />
          <Text style={styles.postCardUsername} numberOfLines={1}>
            {user?.displayName ?? "Unknown"}
          </Text>
        </View>
        <Text style={styles.postCardCaption} numberOfLines={2}>
          {post.content}
        </Text>
        <HapticPressable
          style={styles.postCardLikeRow}
          onPress={(e) => {
            e.stopPropagation();
            toggleLike(post.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SFIcon
            name={liked ? "heart.fill" : "heart"}
            fallback={liked ? "heart" : "heart-outline"}
            size={12}
            color={liked ? colors.liked : colors.textMuted}
          />
          <Text
            style={[styles.postCardLikeCount, liked && { color: colors.liked }]}
          >
            {getLikeCount(post.id)}
          </Text>
        </HapticPressable>
      </View>
    </>
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
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
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
    marginBottom: 12,
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
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  engagementStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  engagementText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Events section
  eventsSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  eventsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  eventsSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  // Posts section
  postsSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  postsCarousel: {
    paddingHorizontal: 16,
    gap: 10,
  },
  postCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  postCardImage: {
    width: 140,
    height: 100,
    backgroundColor: colors.gray200,
  },
  postCardTextPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  postCardBody: {
    padding: 8,
  },
  postCardUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  postCardAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    marginRight: 4,
  },
  postCardUsername: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  postCardCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginBottom: 4,
  },
  postCardLikeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  postCardLikeCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  createButton: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    margin: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  // Existing sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
