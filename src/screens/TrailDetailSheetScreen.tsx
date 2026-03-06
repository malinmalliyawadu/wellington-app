import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, usePathname, useRouter, useFocusEffect } from "expo-router";
import { dismissAndPush } from "../utils/navigation";
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
import { shareTrail } from "../utils/sharing";
import { useTheme } from "../theme/ThemeContext";
import { QueryErrorState } from "../components/QueryErrorState";
import { createStyles, DIFFICULTY_LABELS } from "./trail-detail/trailDetailStyles";
import type { TrailDifficulty, Post } from "../types";

export function TrailDetailSheetScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
    easy: colors.success,
    moderate: "#F59E0B",
    hard: colors.error,
  };
  const { trailId } = useLocalSearchParams<{ trailId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const { followingIds } = useFollow();
  const { getLikeCount } = useLike();

  const fetchTrail = useCallback(() => getTrailById(trailId ?? ""), [trailId]);
  const {
    data: trail,
    loading,
    error: trailError,
    refetch: refetchTrail,
  } = useQuery(fetchTrail, ["trail", trailId]);

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

  if (loading && !trail) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (trailError && !trail) {
    return (
      <View style={styles.container}>
        <QueryErrorState message={trailError} onRetry={refetchTrail} />
      </View>
    );
  }

  if (!trail) return null;

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
            <View style={styles.trailActions}>
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
                <Text style={styles.directionsText}>Directions</Text>
              </HapticPressable>
              <HapticPressable
                style={styles.directionsButton}
                onPress={() => shareTrail(trail.id)}
              >
                <SFIcon
                  name="square.and.arrow.up"
                  fallback="share-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.directionsText}>Share</Text>
              </HapticPressable>
            </View>
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
              <Text style={styles.eventsSectionTitle}>Events This Week</Text>
            </View>
            {trailEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                place={trailPlace}
                compact
                onPress={() => {
                  router.push(`${tabBase}/event/${event.id}`);
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
                  onPress={() => dismissAndPush(router, `${tabBase}/post/${post.id}` as any)}
                >
                  <PostCardContent
                    post={post}
                    isFollowed={followingIds.includes(post.userId)}
                  />
                </HapticPressable>
              ))}
            </ScrollView>
            <View style={styles.createButtonContainer}>
              <LiquidGlassButton
                title="Create Post"
                icon="add-circle"
                size="large"
                fullWidth
                onPress={() => dismissAndPush(router, {
                    pathname: `${tabBase}/create-post`,
                    params: { placeId: trail.placeId },
                  } as any)}
              />
            </View>
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
              onPress={() => dismissAndPush(router, {
                    pathname: `${tabBase}/create-post`,
                    params: { placeId: trail.placeId },
                  } as any)}
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.postCardImage}
            contentFit="cover"
            transition={200}
          />
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

