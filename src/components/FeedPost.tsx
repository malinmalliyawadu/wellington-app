import React, { useCallback, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { TapGestureHandler, State } from "react-native-gesture-handler";
import { Post, User, Place, PlaceCategory } from "../types";
import { useQuery } from "../hooks/useQuery";
import { useDoubleTapLike } from "../hooks/useDoubleTapLike";
import { getCommentsByPostId } from "../services/comments";
import { VideoPlayer } from "./VideoPlayer";
import { SFIcon } from "./SFIcon";
import { colors } from "../theme/colors";
import { sharePost } from "../utils/sharing";
import { HapticPressable } from "./HapticPressable";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";

const CATEGORY_ICONS: Record<PlaceCategory, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "safari", fallback: "compass" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note.list", fallback: "musical-notes" },
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
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const categoryColor = colors.category[place.category];
  const {
    liked,
    likeCount,
    doubleTapRef,
    likeAnimatedStyle,
    heartOverlayStyle,
    handleLike,
    handleDoubleTap,
  } = useDoubleTapLike(post.id);
  const fetchComments = useCallback(
    () => getCommentsByPostId(post.id),
    [post.id]
  );
  const { data: comments } = useQuery(fetchComments);
  const commentCount = comments?.length ?? 0;
  const storedAspectRatio =
    post.mediaWidth && post.mediaHeight
      ? post.mediaWidth / post.mediaHeight
      : null;
  const [aspectRatio, setAspectRatio] = useState<number>(
    storedAspectRatio ?? (post.type === "video" ? 16 / 9 : 1)
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

      {/* Media with overlaid header + double-tap to like */}
      {hasMedia && (
        <TapGestureHandler
          ref={doubleTapRef}
          numberOfTaps={2}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.ACTIVE) {
              handleDoubleTap();
            }
          }}
        >
          <TapGestureHandler
            waitFor={doubleTapRef}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE && onPressPost) {
                onPressPost(post.id);
              }
            }}
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
                colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.05)", "transparent"]}
                locations={[0, 0.6, 0.7]}
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
                    <Text style={styles.overlaidUsername}>
                      @{user.username}
                    </Text>
                  </View>
                </HapticPressable>
                <Text style={styles.overlaidTimeAgo}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
              </LinearGradient>
              {/* Double-tap heart overlay */}
              <Animated.View
                style={[styles.heartOverlay, heartOverlayStyle]}
                pointerEvents="none"
              >
                <SFIcon name="heart.fill" fallback="heart" size={80} color="#FFFFFF" />
              </Animated.View>
            </View>
          </TapGestureHandler>
        </TapGestureHandler>
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
        <SFIcon
          name={CATEGORY_ICONS[place.category].sf}
          fallback={CATEGORY_ICONS[place.category].fallback}
          size={16}
          color={categoryColor}
        />
        <Text style={styles.locationName}>{place.name}</Text>
        <SFIcon name="chevron.right" fallback="chevron-forward" size={14} color={colors.textMuted} />
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
              <SFIcon
                name={liked ? "heart.fill" : "heart"}
                fallback={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? colors.liked : colors.text}
              />
            </Animated.View>
            <Text
              style={[styles.actionCount, liked && { color: colors.liked }]}
            >
              {likeCount}
            </Text>
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={() => onPressPost?.(post.id)}
            disabled={!onPressPost}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SFIcon name="bubble.left" fallback="chatbubble-outline" size={22} color={colors.text} />
            <Text style={styles.actionCount}>{commentCount}</Text>
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={() => sharePost(post.id, place.name, post.content)}
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
        <SFIcon name="bookmark" fallback="bookmark-outline" size={22} color={colors.text} />
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    paddingBottom: 60,
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
    fontFamily: "PlusJakartaSans_700Bold",
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
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    height: 5,
    backgroundColor: colors.gray100,
  },
});
