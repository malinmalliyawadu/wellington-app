import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Place, Post, PlaceCategory } from "../types";
import { PlacePopularity } from "../utils/placePopularity";
import { formatNumber } from "../utils/formatNumber";
import { useLike } from "../context/LikeContext";
import { useQuery } from "../hooks/useQuery";
import { getProfileById } from "../services/users";
import { fetchPlaceDetails } from "../services/googlePlaceDetails";
import { VideoThumbnail } from "./VideoThumbnail";
import { colors } from "../theme/colors";
import { HapticPressable } from "./HapticPressable";

interface PlacePostsSheetProps {
  place: Place;
  posts: Post[];
  popularity: PlacePopularity | undefined;
  followingIds: string[];
  onClose: () => void;
  onPressPlaceName?: (placeId: string) => void;
  onPressPost?: (postId: string) => void;
}

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  bar: "Bar",
  attraction: "Attraction",
  park: "Park",
  venue: "Venue",
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.6;

export function PlacePostsSheet({
  place,
  posts,
  popularity,
  followingIds,
  onClose,
  onPressPlaceName,
  onPressPost,
}: PlacePostsSheetProps) {
  const categoryColor = colors.category[place.category];
  const [placeDetails, setPlaceDetails] = useState<{
    rating?: number;
    userRatingsTotal?: number;
  }>({
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
  });

  // Fetch place details if not already present
  useEffect(() => {
    if (!place.rating) {
      fetchPlaceDetails(place.latitude, place.longitude, place.name).then(
        (details) => {
          if (details.rating) {
            setPlaceDetails(details);
          }
        }
      );
    }
  }, [place.id, place.latitude, place.longitude, place.name, place.rating]);

  const sortedPosts = [...posts].sort((a, b) => {
    const aFollowed = followingIds.includes(a.userId);
    const bFollowed = followingIds.includes(b.userId);
    if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
    return b.likes - a.likes;
  });

  const totalLikes = popularity?.totalLikes ?? 0;

  const handleOpenDirections = useCallback(() => {
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

  const hasPosts = sortedPosts.length > 0;
  console.log(
    "PlacePostsSheet:",
    place.name,
    "hasPosts:",
    hasPosts,
    "postsCount:",
    posts.length
  );

  return (
    <View style={[styles.container, hasPosts && { maxHeight: MAX_HEIGHT }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HapticPressable
            onPress={() => onPressPlaceName?.(place.id)}
            disabled={!onPressPlaceName}
            style={styles.nameButton}
          >
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>
            {onPressPlaceName && (
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            )}
          </HapticPressable>
          <HapticPressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.gray400} />
          </HapticPressable>
        </View>
        <View style={styles.metaRow}>
          <View
            style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
          >
            <Text style={styles.categoryText}>
              {CATEGORY_LABELS[place.category]}
            </Text>
          </View>
          {placeDetails.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFA500" />
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
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{posts.length} posts</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons
              name="heart-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{totalLikes} likes</Text>
          </View>
          <HapticPressable
            style={styles.directionsButton}
            onPress={handleOpenDirections}
          >
            <Ionicons name="navigate" size={14} color={colors.primary} />
            <Text style={styles.directionsText}>Directions</Text>
          </HapticPressable>
        </View>
      </View>

      {hasPosts ? (
        <ScrollView
          style={styles.postList}
          showsVerticalScrollIndicator={false}
        >
          {sortedPosts.map((post) => (
            <HapticPressable
              key={post.id}
              onPress={() => onPressPost?.(post.id)}
              disabled={!onPressPost}
            >
              <PostRow
                post={post}
                isFollowed={followingIds.includes(post.userId)}
              />
            </HapticPressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubble-outline"
            size={48}
            color={colors.gray300}
          />
          <Text style={styles.emptyStateText}>No posts yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Be the first to share your experience!
          </Text>
        </View>
      )}
    </View>
  );
}

function PostRow({ post, isFollowed }: { post: Post; isFollowed: boolean }) {
  const fetchUser = useCallback(
    () => getProfileById(post.userId),
    [post.userId]
  );
  const { data: user } = useQuery(fetchUser);
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);

  return (
    <View style={styles.postRow}>
      <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
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
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
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
            style={styles.thumbnail}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={styles.thumbnail} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nameButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  closeButton: {
    padding: 4,
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
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
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
    color: colors.primary,
  },
  postList: {
    paddingHorizontal: 16,
  },
  postRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    marginRight: 10,
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
    fontWeight: "600",
    color: colors.text,
    marginRight: 6,
  },
  followBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  followBadgeText: {
    fontSize: 10,
    fontWeight: "600",
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
    borderRadius: 6,
    backgroundColor: colors.gray200,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
