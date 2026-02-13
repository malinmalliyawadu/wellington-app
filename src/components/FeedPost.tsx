import React, { useCallback, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

  return (
    <View style={styles.container}>
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

      <HapticPressable
        onPress={() => onPressPost?.(post.id)}
        disabled={!onPressPost}
      >
        {post.mediaUrl &&
          (post.type === "video" ? (
            <VideoPlayer
              uri={post.mediaUrl}
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
          ))}
      </HapticPressable>

      <View style={styles.content}>
        <Text style={styles.caption}>{post.content}</Text>
        <HapticPressable
          style={[styles.placeBadge, { backgroundColor: categoryColor + "15" }]}
          onPress={() => onPressPlace?.(place.id)}
          disabled={!onPressPlace}
        >
          <Ionicons
            name={CATEGORY_ICONS[place.category]}
            size={13}
            color={categoryColor}
            style={styles.placeIcon}
          />
          <Text style={[styles.placeName, { color: categoryColor }]}>
            {place.name}
          </Text>
        </HapticPressable>
      </View>

      <View style={styles.actions}>
        <HapticPressable
          style={styles.actionButton}
          onPress={() => toggleLike(post.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={22}
            color={liked ? colors.liked : colors.textMuted}
          />
          <Text style={[styles.actionCount, liked && { color: colors.liked }]}>
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
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.actionCount}>{commentCount}</Text>
        </HapticPressable>
        <HapticPressable
          style={styles.actionButton}
          onPress={() =>
            Share.share({ message: `Check out ${place.name}: ${post.content}` })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={20} color={colors.textMuted} />
        </HapticPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
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
  media: {
    width: "100%",
    backgroundColor: colors.gray200,
  },
  content: {
    padding: 12,
  },
  caption: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  placeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  placeIcon: {
    marginRight: 5,
  },
  placeName: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
});
