import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SFIcon } from "../components/SFIcon";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { dismissAndPush } from "../utils/navigation";
import { useFollow } from "../context/FollowContext";
import { useLike } from "../context/LikeContext";
import { useMapPlaceSelection } from "../context/MapPlaceSelectionContext";
import { useQuery } from "../hooks/useQuery";
import { getPlaceById } from "../services/places";
import { getPostsByPlaceId } from "../services/posts";
import { getUpcomingEvents } from "../services/events";
import { getProfileById, getProfileByUsername } from "../services/users";
import { getTrailByPlaceId } from "../services/trails";
import { shareTrail } from "../utils/sharing";
import { fetchPlaceDetails } from "../services/googlePlaceDetails";
import { formatNumber } from "../utils/formatNumber";
import { sortPosts } from "../utils/postSorting";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { EventCard } from "../components/EventCard";
import { VolunteerShiftCard } from "../components/VolunteerShiftCard";
import { HapticPressable } from "../components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { HashtagText } from "../components/HashtagText";
import { useTheme } from "../theme/ThemeContext";
import { QueryErrorState } from "../components/QueryErrorState";
import { createStyles, CATEGORY_LABELS, DIFFICULTY_LABELS } from "./place-posts/placePostsStyles";
import type { Place, Post, TrailDifficulty } from "../types";

export function PlacePostsSheetScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { placeId: routePlaceId } = useLocalSearchParams<{ placeId: string }>();
  const { selectedPlaceId, sheetOpenRef } = useMapPlaceSelection();
  const placeId = selectedPlaceId ?? routePlaceId;
  const router = useRouter();
  const handlePressMention = useCallback(
    (username: string) => {
      getProfileByUsername(username).then((u) => {
        if (u) router.push(`/map/user/${u.id}` as any);
      });
    },
    [router]
  );
  const { followingIds } = useFollow();
  const { getLikeCount } = useLike();

  useEffect(() => {
    sheetOpenRef.current = true;
    return () => {
      sheetOpenRef.current = false;
    };
  }, [sheetOpenRef]);

  const fetchPlace = useCallback(() => getPlaceById(placeId!), [placeId]);
  const fetchPosts = useCallback(() => getPostsByPlaceId(placeId!), [placeId]);

  const {
    data: place,
    loading: placeLoading,
    error: placeError,
    refetch: refetchPlace,
  } = useQuery(fetchPlace, ["place", placeId]);
  const {
    data: posts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery(fetchPosts, ["posts", "place", placeId]);
  // Fetch trail data if this place is a trail
  const isTrail = place?.category === 'trail';
  const fetchTrail = useCallback(
    () => (isTrail && placeId ? getTrailByPlaceId(placeId) : Promise.resolve(null)),
    [isTrail, placeId]
  );
  const { data: trail } = useQuery(fetchTrail, ['trail', 'place', placeId]);

  const { data: allUpcomingEvents, refetch: refetchEvents } = useQuery(
    getUpcomingEvents,
    "upcoming-events"
  );

  const placeEvents = useMemo(() => {
    if (!allUpcomingEvents) return [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    const end = endDate.toISOString().split("T")[0];
    return allUpcomingEvents
      .filter(
        (e) => e.placeId === placeId && e.date >= today && e.date <= end
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
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

  // Fetch place details from Google Places API (skip for trails)
  useEffect(() => {
    if (place && place.category !== 'trail' && !place.rating) {
      fetchPlaceDetails(place.latitude, place.longitude, place.name, place.id).then(
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

  if ((placeError || postsError) && !place) {
    return (
      <View style={styles.container}>
        <QueryErrorState
          message={placeError || postsError}
          onRetry={() => {
            refetchPlace();
            refetchPosts();
          }}
        />
      </View>
    );
  }

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
              {trail ? (
                <TrailHeader
                  trail={trail}
                  place={place}
                  postCount={sortedPosts.length}
                  totalLikes={totalLikes}
                />
              ) : (
                <>
                  <HapticPressable
                    onPress={() => dismissAndPush(router, `/map/place/${place.id}` as any)}
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
                        <SFIcon
                          name="star.fill"
                          fallback="star"
                          size={14}
                          color="#FFA500"
                        />
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
                      <SFIcon
                        name="location.fill"
                        fallback="navigate"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.directionsText}>Directions</Text>
                    </HapticPressable>
                  </View>
                </>
              )}
            </View>
          </View>

          {placeEvents.length > 0 && (() => {
            const volunteerEvents = placeEvents.filter((e) => e.category === "volunteering");
            const regularEvents = placeEvents.filter((e) => e.category !== "volunteering");
            return (
              <>
                {volunteerEvents.length > 0 && (
                  <View style={styles.eventsSection}>
                    <View style={styles.eventsSectionHeader}>
                      <Text style={styles.eventsSectionTitle}>Volunteering</Text>
                    </View>
                    <VolunteerShiftCard
                      events={volunteerEvents}
                      onEventPress={(eventId) => {
                        router.push(`/map/event/${eventId}`);
                      }}
                    />
                  </View>
                )}
                {regularEvents.length > 0 && (
                  <View style={styles.eventsSection}>
                    <View style={styles.eventsSectionHeader}>
                      <Text style={styles.eventsSectionTitle}>Events This Week</Text>
                    </View>
                    {regularEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        place={place}
                        onPress={() => {
                          router.push(`/map/event/${event.id}`);
                        }}
                      />
                    ))}
                  </View>
                )}
              </>
            );
          })()}

          {sortedPosts.length > 0 ? (
            <View style={styles.postList}>
              {sortedPosts.map((post) => (
                <HapticPressable
                  key={post.id}
                  onPress={() => dismissAndPush(router, `/map/post/${post.id}` as any)}
                >
                  <PostRow
                    post={post}
                    isFollowed={followingIds.includes(post.userId)}
                    onPressMention={handlePressMention}
                  />
                </HapticPressable>
              ))}
              <LiquidGlassButton
                title="Create Post"
                icon="add-circle"
                size="large"
                fullWidth
                onPress={() => dismissAndPush(router, {
                    pathname: "/map/create-post",
                    params: { placeId: place.id },
                  } as any)}
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
                onPress={() => dismissAndPush(router, {
                    pathname: "/map/create-post",
                    params: { placeId: place.id },
                  } as any)}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function TrailHeader({
  trail,
  place,
  postCount,
  totalLikes,
}: {
  trail: { name: string; id: string; elevation: string; distance: string; duration: string; difficulty: TrailDifficulty; trailhead: { latitude: number; longitude: number; label: string } };
  place: Place;
  postCount: number;
  totalLikes: number;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const trailColor = colors.category.trail;
  const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
    easy: colors.success,
    moderate: "#F59E0B",
    hard: colors.error,
  };

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
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      });
    }
  };

  return (
    <>
      <View style={styles.trailTitleRow}>
        <View style={[styles.trailIconCircle, { backgroundColor: trailColor }]}>
          <SFIcon name="figure.hiking" fallback="walk" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{trail.name}</Text>
          <Text style={styles.trailhead}>{trail.trailhead.label}</Text>
        </View>
      </View>
      <View style={styles.trailStatsRow}>
        <View style={[styles.trailStatCard, { backgroundColor: trailColor + "10", borderColor: trailColor + "20" }]}>
          <SFIcon name="mountain.2" fallback="trending-up" size={14} color={trailColor} />
          <Text style={styles.trailStatValue}>{trail.elevation}</Text>
          <Text style={styles.trailStatLabel}>Elevation</Text>
        </View>
        <View style={[styles.trailStatCard, { backgroundColor: trailColor + "10", borderColor: trailColor + "20" }]}>
          <SFIcon name="point.topleft.down.to.point.bottomright.curvepath" fallback="trail-sign" size={14} color={trailColor} />
          <Text style={styles.trailStatValue}>{trail.distance}</Text>
          <Text style={styles.trailStatLabel}>Distance</Text>
        </View>
        <View style={[styles.trailStatCard, { backgroundColor: trailColor + "10", borderColor: trailColor + "20" }]}>
          <SFIcon name="clock" fallback="time-outline" size={14} color={trailColor} />
          <Text style={styles.trailStatValue}>{trail.duration}</Text>
          <Text style={styles.trailStatLabel}>Duration</Text>
        </View>
      </View>
      <View style={styles.trailDifficultyRow}>
        <View style={[styles.trailDifficultyBadge, { backgroundColor: DIFFICULTY_COLORS[trail.difficulty] }]}>
          <Text style={styles.categoryText}>{DIFFICULTY_LABELS[trail.difficulty]}</Text>
        </View>
        <View style={styles.stat}>
          <SFIcon name="bubble.left" fallback="chatbubble-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{postCount} posts</Text>
        </View>
        <View style={styles.stat}>
          <SFIcon name="heart" fallback="heart-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{totalLikes} likes</Text>
        </View>
      </View>
      <View style={styles.trailActionsRow}>
        <HapticPressable style={styles.directionsButton} onPress={handleOpenDirections}>
          <SFIcon name="location.fill" fallback="navigate" size={14} color={colors.primary} />
          <Text style={styles.directionsText}>Directions</Text>
        </HapticPressable>
        <HapticPressable style={styles.directionsButton} onPress={() => shareTrail(trail.id)}>
          <SFIcon name="square.and.arrow.up" fallback="share-outline" size={14} color={colors.primary} />
          <Text style={styles.directionsText}>Share</Text>
        </HapticPressable>
      </View>
    </>
  );
}

function PostRow({
  post,
  isFollowed,
  onPressMention,
}: {
  post: Post;
  isFollowed: boolean;
  onPressMention?: (username: string) => void;
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
    <View style={styles.postRow}>
      <Image
        source={{ uri: user?.avatarUrl }}
        style={styles.avatar}
        contentFit="cover"
        transition={200}
      />
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
        <HashtagText
          style={styles.postText}
          numberOfLines={2}
          onPressMention={onPressMention}
        >
          {post.content}
        </HashtagText>
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
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        ))}
    </View>
  );
}

