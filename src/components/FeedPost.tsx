import React, { useCallback, useState } from "react";
import { View, Text, Image, StyleSheet, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Post, User, Place, PlaceCategory } from "../types";
import { useLike } from "../context/LikeContext";
import { useQuery } from "../hooks/useQuery";
import { getCommentsByPostId } from "../services/comments";
import { VideoPlayer } from "./VideoPlayer";
import { colors } from "../theme/colors";
import { HapticPressable } from "./HapticPressable";

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  attraction: "compass",
  park: "leaf",
  venue: "musical-notes",
};

interface FeedPostProps {
  post: Post;
  user: User;
  place: Place;
  onPressUser?: (userId: string) => void;
  onPressPlace?: (placeId: string) => void;
  onPressPost?: (postId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  return "Just now";
}

export function FeedPost({
  post,
  user,
  place,
  onPressUser,
  onPressPlace,
  onPressPost,
}: FeedPostProps) {
  const categoryColor = colors.category[place.category];
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);
  const fetchComments = useCallback(
    () => getCommentsByPostId(post.id),
    [post.id]
  );
  const { data: comments } = useQuery(fetchComments);
  const commentCount = comments?.length ?? 0;
  const [aspectRatio, setAspectRatio] = useState<number>(
    post.type === "video" ? 16 / 9 : 1
  );

  const likeScale = useSharedValue(1);
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
    toggleLike(post.id);
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    if (width && height) {
      setAspectRatio(width / height);
    }
  };

  const handleVideoLoad = (event: { width: number; height: number }) => {
    const { width, height } = event;
    if (width && height) {
      setAspectRatio(width / height);
    }
  };

  const hasMedia = !!post.mediaUrl;

  return (
    <View style={styles.container}>
      {/* Header: overlaid on media, or standard row for text-only posts */}
      {!hasMedia && (
        <View style={styles.header}>
          <HapticPressable
            style={styles.headerUser}
            onPress={() => onPressUser?.(user.id)}
            disabled={!onPressUser}
          >
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <View style={styles.headerText}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.username}>@{user.username}</Text>
            </View>
          </HapticPressable>
          <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
      )}

      {/* Media with overlaid header */}
      {hasMedia && (
        <HapticPressable
          onPress={() => onPressPost?.(post.id)}
          disabled={!onPressPost}
        >
          <View>
            {post.type === "video" ? (
              <VideoPlayer
                uri={post.mediaUrl!}
                style={[styles.media, { aspectRatio }]}
                shouldPlay
                isMuted
                isLooping
                onLoad={handleVideoLoad}
              />
            ) : (
              <Image
                source={{ uri: post.mediaUrl }}
                style={[styles.media, { aspectRatio }]}
                onLoad={handleImageLoad}
              />
            )}
            {/* Gradient scrim + overlaid header */}
            <LinearGradient
              colors={["rgba(0,0,0,0.55)", "transparent"]}
              style={styles.headerOverlay}
            >
              <HapticPressable
                style={styles.overlaidHeaderUser}
                onPress={() => onPressUser?.(user.id)}
                disabled={!onPressUser}
              >
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.overlaidAvatar}
                />
                <View style={styles.headerText}>
                  <Text style={styles.overlaidDisplayName}>
                    {user.displayName}
                  </Text>
                  <Text style={styles.overlaidUsername}>@{user.username}</Text>
                </View>
              </HapticPressable>
              <Text style={styles.overlaidTimeAgo}>
                {formatTimeAgo(post.createdAt)}
              </Text>
            </LinearGradient>
          </View>
        </HapticPressable>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.caption}>{post.content}</Text>
      </View>

      {/* Location row */}
      <HapticPressable
        style={styles.locationRow}
        onPress={() => onPressPlace?.(place.id)}
        disabled={!onPressPlace}
      >
        <Ionicons name="location" size={16} color={categoryColor} />
        <Text style={styles.locationName}>{place.name}</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.textMuted}
        />
      </HapticPressable>

      {/* Action bar */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <HapticPressable
            style={styles.actionButton}
            onPress={handleLike}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={likeAnimatedStyle}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? colors.liked : colors.text}
              />
            </Animated.View>
            <Text
              style={[styles.actionCount, liked && { color: colors.liked }]}
            >
              {getLikeCount(post.id)}
            </Text>
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={() => onPressPost?.(post.id)}
            disabled={!onPressPost}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={colors.text}
            />
            <Text style={styles.actionCount}>{commentCount}</Text>
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={() =>
              Share.share({
                message: `Check out ${place.name}: ${post.content}`,
              })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="paper-plane-outline"
              size={22}
              color={colors.text}
            />
          </HapticPressable>
        </View>
        <Ionicons name="bookmark-outline" size={22} color={colors.text} />
      </View>

      {/* Bottom divider */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
  },
  // Standard header (text-only posts)
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  headerUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timeAgo: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Overlaid header (on media)
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  overlaidHeaderUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  overlaidAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: colors.gray200,
  },
  overlaidDisplayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlaidUsername: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlaidTimeAgo: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  media: {
    width: "100%",
    backgroundColor: colors.gray200,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  caption: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  // Location row
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  // Action bar
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
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
  },
});
