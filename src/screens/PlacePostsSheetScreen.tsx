import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SFIcon } from "../components/SFIcon";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useFollow } from "../context/FollowContext";
import { useLike } from "../context/LikeContext";
import { useQuery } from "../hooks/useQuery";
import { getPlaceById } from "../services/places";
import { getPostsByPlaceId } from "../services/posts";
import { getUpcomingEvents } from "../services/events";
import { getProfileById } from "../services/users";
import { fetchPlaceDetails } from "../services/googlePlaceDetails";
import { formatNumber } from "../utils/formatNumber";
import { sortPosts } from "../utils/postSorting";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { EventCard } from "../components/EventCard";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { fonts } from "../theme/fonts";
import { BlurView } from "expo-blur";
import { colors } from "../theme/colors";
import type { Place, PlaceCategory, Post } from "../types";

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  bar: "Bar",
  attraction: "Attraction",
  park: "Park",
  venue: "Venue",
  trail: "Trail",
};

export function PlacePostsSheetScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { getLikeCount } = useLike();

  const fetchPlace = useCallback(() => getPlaceById(placeId!), [placeId]);
  const fetchPosts = useCallback(() => getPostsByPlaceId(placeId!), [placeId]);

  const {
    data: place,
    loading: placeLoading,
    refetch: refetchPlace,
  } = useQuery(fetchPlace, ['place', placeId]);
  const {
    data: posts,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useQuery(fetchPosts, ['posts', 'place', placeId]);
  const {
    data: allUpcomingEvents,
    refetch: refetchEvents,
  } = useQuery(getUpcomingEvents, "upcoming-events");

  const placeEvents = useMemo(() => {
    if (!allUpcomingEvents) return [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    const end = endDate.toISOString().split("T")[0];
    return allUpcomingEvents.filter(
      (e) => e.placeId === placeId && e.date >= today && e.date <= end
    );
  }, [allUpcomingEvents, placeId]);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchEvents();
    }, [refetchPosts, refetchEvents])
  );

  const [placeDetails, setPlaceDetails] = useState<{
    rating?: number;
    userRatingsTotal?: number;
  }>({});

  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  }, []);

  // Fetch place details from Google Places API
  useEffect(() => {
    if (place && !place.rating) {
      fetchPlaceDetails(place.latitude, place.longitude, place.name).then(
        (details) => {
          if (details.rating) {
            setPlaceDetails(details);
          }
        }
      );
    } else if (place?.rating) {
      setPlaceDetails({
        rating: place.rating,
        userRatingsTotal: place.userRatingsTotal,
      });
    }
  }, [place]);

  // Use centralized sorting - sorts by most recent first
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return sortPosts(posts);
  }, [posts]);

  const totalLikes = useMemo(
    () => (posts ?? []).reduce((sum, p) => sum + getLikeCount(p.id), 0),
    [posts, getLikeCount]
  );

  const handleOpenDirections = useCallback(() => {
    if (!place) return;

    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);

    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open maps:", err);
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        );
      });
    }
  }, [place]);

  if (placeLoading || postsLoading || !place) {
    return (
      <View style={styles.container}>
        <View style={styles.blurContainer}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  const categoryColor = colors.category[place.category];

  return (
    <View style={styles.container}>
      <View style={styles.blurContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          bounces={true}
          onScroll={handleScroll}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.headerContent,
                isScrolled && styles.headerContentScrolled,
              ]}
            >
              <HapticPressable
                onPress={() => {
                  router.dismiss();
                  router.push(`/map/place/${place.id}`);
                }}
                style={styles.nameButton}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {place.name}
                </Text>
                <SFIcon
                  name="chevron.right"
                  fallback="chevron-forward"
                  size={18}
                  color={colors.text}
                />
              </HapticPressable>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryText}>
                    {CATEGORY_LABELS[place.category]}
                  </Text>
                </View>
                {placeDetails.rating && (
                  <View style={styles.ratingContainer}>
                    <SFIcon name="star.fill" fallback="star" size={14} color="#FFA500" />
                    <Text style={styles.ratingText}>
                      {placeDetails.rating.toFixed(1)}
                    </Text>
                    {placeDetails.userRatingsTotal && (
                      <Text style={styles.reviewCountText}>
                        ({formatNumber(placeDetails.userRatingsTotal)})
                      </Text>
                    )}
                  </View>
                )}
                <Text style={styles.address} numberOfLines={1}>
                  {place.address}
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <SFIcon
                    name="bubble.left"
                    fallback="chatbubble-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statText}>
                    {sortedPosts.length} posts
                  </Text>
                </View>
                <View style={styles.stat}>
                  <SFIcon
                    name="heart"
                    fallback="heart-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statText}>{totalLikes} likes</Text>
                </View>
                <HapticPressable
                  style={styles.directionsButton}
                  onPress={handleOpenDirections}
                >
                  <SFIcon name="location.fill" fallback="navigate" size={14} color={colors.primary} />
                  <Text style={styles.directionsText}>Directions</Text>
                </HapticPressable>
              </View>
            </View>
          </View>

          {placeEvents.length > 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.eventsSectionHeader}>
                <SFIcon name="calendar" fallback="calendar" size={16} color={colors.category.venue} />
                <Text style={styles.eventsSectionTitle}>
                  Events this week
                </Text>
              </View>
              {placeEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  place={place}
                  compact
                  hasBorder
                  onPress={() => {
                    router.push(`/map/event/${event.id}`);
                  }}
                />
              ))}
            </View>
          )}

          {sortedPosts.length > 0 ? (
            <View style={styles.postList}>
              {sortedPosts.map((post) => (
                <HapticPressable
                  key={post.id}
                  onPress={() => {
                    router.dismiss();
                    router.push(`/map/post/${post.id}`);
                  }}
                >
                  <PostRow
                    post={post}
                    isFollowed={followingIds.includes(post.userId)}
                  />
                </HapticPressable>
              ))}
              <LiquidGlassButton
                title="Create Post"
                icon="add-circle"
                size="large"
                fullWidth
                onPress={() => {
                  router.dismiss();
                  router.push({
                    pathname: "/map/create-post",
                    params: { placeId: place.id },
                  });
                }}
                style={styles.listCreateButton}
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
                    params: { placeId: place.id },
                  });
                }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function PostRow({ post, isFollowed }: { post: Post; isFollowed: boolean }) {
  const fetchUser = useCallback(
    () => getProfileById(post.userId),
    [post.userId]
  );
  const { data: user } = useQuery(fetchUser, ['user', post.userId]);
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);

  return (
    <View style={styles.postRow}>
      <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user?.displayName ?? "Unknown"}
          </Text>
          {isFollowed && (
            <View style={styles.followBadge}>
              <Text style={styles.followBadgeText}>Following</Text>
            </View>
          )}
        </View>
        <Text style={styles.postText} numberOfLines={2}>
          {post.content}
        </Text>
        <HapticPressable
          style={styles.postMeta}
          onPress={(e) => {
            e.stopPropagation();
            toggleLike(post.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SFIcon
            name={liked ? "heart.fill" : "heart"}
            fallback={liked ? "heart" : "heart-outline"}
            size={14}
            color={liked ? colors.liked : colors.textMuted}
          />
          <Text style={[styles.likesText, liked && { color: colors.liked }]}>
            {getLikeCount(post.id)}
          </Text>
        </HapticPressable>
      </View>
      {post.mediaUrl &&
        (post.type === "video" ? (
          <VideoThumbnail
            thumbnailUrl={post.thumbnailUrl}
            fallbackUrl={post.mediaUrl}
            style={styles.thumbnail}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={styles.thumbnail} contentFit="cover" transition={200} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  blurContainer: {
    flex: 1,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingTop: 100,
  },
  header: {
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  headerContentScrolled: {
    backgroundColor: "#FFFFFF",
  },
  nameButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  reviewCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  address: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
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
  postList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  postRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  postContent: {
    flex: 1,
    marginRight: 8,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 6,
  },
  followBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary + "40",
  },
  followBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  postText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  likesText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
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
  listCreateButton: {
    marginTop: 12,
    marginBottom: 16,
  },
});
