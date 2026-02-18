import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { SFIcon } from "../components/SFIcon";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { TapGestureHandler, State } from "react-native-gesture-handler";
import { getPostById as getPostByIdAsync } from "../services/posts";
import { getProfileById, getProfilesByIds } from "../services/users";
import { getPlaceById as getPlaceByIdAsync } from "../services/places";
import {
  getCommentsByPostId as getCommentsAsync,
  createComment,
  updateComment,
  deleteComment,
} from "../services/comments";
import { useQuery } from "../hooks/useQuery";
import { useDoubleTapLike } from "../hooks/useDoubleTapLike";
import { useAuth } from "../context/AuthContext";
import { getPostMediaItems } from "../utils/postMedia";
import { VideoPlayer } from "../components/VideoPlayer";
import { MediaCarousel } from "../components/MediaCarousel";
import { colors } from "../theme/colors";
import { PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { sharePost } from "../utils/sharing";
import { HapticPressable } from "src/components/HapticPressable";

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

export function PostDetailScreen() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const fetchPost = useCallback(() => getPostByIdAsync(postId), [postId]);
  const { data: post, loading } = useQuery(fetchPost);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Use stored dimensions when available to avoid layout shift
  useEffect(() => {
    if (post?.mediaWidth && post?.mediaHeight) {
      setAspectRatio(post.mediaWidth / post.mediaHeight);
    }
  }, [post?.mediaWidth, post?.mediaHeight]);

  const {
    liked,
    likeCount,
    doubleTapRef,
    likeAnimatedStyle,
    heartOverlayStyle,
    handleLike,
    handleDoubleTap,
  } = useDoubleTapLike(postId);

  const fetchUser = useCallback(
    () => (post ? getProfileById(post.userId) : Promise.resolve(null)),
    [post?.userId]
  );
  const { data: user } = useQuery(fetchUser, post?.userId);

  const fetchPlace = useCallback(
    () => (post ? getPlaceByIdAsync(post.placeId) : Promise.resolve(null)),
    [post?.placeId]
  );
  const { data: place } = useQuery(fetchPlace, post?.placeId);

  const fetchComments = useCallback(
    () => (post ? getCommentsAsync(post.id) : Promise.resolve([])),
    [post?.id]
  );
  const { data: comments, refetch: refetchComments } = useQuery(
    fetchComments,
    post?.id
  );

  const commentUserIds = useMemo(
    () => [...new Set((comments ?? []).map((c) => c.userId))],
    [comments]
  );
  const fetchCommentUsers = useCallback(
    () => getProfilesByIds(commentUserIds),
    [commentUserIds]
  );
  const { data: commentUsers } = useQuery(fetchCommentUsers, commentUserIds);
  const commentUserMap = useMemo(
    () => new Map((commentUsers ?? []).map((u) => [u.id, u])),
    [commentUsers]
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) return null;

  const allComments = comments ?? [];
  const categoryColor = place
    ? colors.category[place.category]
    : colors.gray400;
  const mediaItems = getPostMediaItems(post);
  const hasMedia = mediaItems.length > 0;
  const isMultiMedia = mediaItems.length > 1;

  const currentTab = pathname.startsWith("/feed")
    ? "/feed"
    : pathname.startsWith("/profile")
    ? "/profile"
    : "/map";

  const handlePressUser = (userId: string) => {
    router.push(`${currentTab}/user/${userId}` as any);
  };

  const handlePressPlace = (placeId: string) => {
    router.push(`${currentTab}/place/${placeId}` as any);
  };

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !profile) return;
    try {
      if (editingCommentId) {
        await updateComment(editingCommentId, trimmed);
      } else {
        await createComment({
          postId: post.id,
          userId: profile.id,
          text: trimmed,
        });
      }
      setEditingCommentId(null);
      setCommentText("");
      Keyboard.dismiss();
      setTimeout(() => refetchComments(), 0);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to save comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText("");
    Keyboard.dismiss();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Text-only: standard header */}
        {!hasMedia && (
          <HapticPressable
            style={styles.header}
            onPress={() => handlePressUser(post.userId)}
          >
            <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
            <View style={styles.headerText}>
              <Text style={styles.displayName}>
                {user?.displayName ?? "Unknown"}
              </Text>
              <Text style={styles.username}>
                @{user?.username ?? "unknown"}
              </Text>
            </View>
            <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
          </HapticPressable>
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
            <View>
              {isMultiMedia ? (
                <MediaCarousel
                  mediaItems={mediaItems}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  videoMuted={false}
                  videoControls
                />
              ) : post.type === "video" ? (
                <VideoPlayer
                  uri={mediaItems[0].mediaUrl}
                  style={[styles.media, { aspectRatio }]}
                  shouldPlay
                  useNativeControls
                  onLoad={handleVideoLoad}
                />
              ) : (
                <Image
                  source={{ uri: mediaItems[0].mediaUrl }}
                  style={[styles.media, { aspectRatio }]}
                  onLoad={handleImageLoad}
                />
              )}
              <LinearGradient
                colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.05)", "transparent"]}
                locations={[0, 0.6, 0.7]}
                style={styles.headerOverlay}
              >
                <HapticPressable
                  style={styles.overlaidHeaderUser}
                  onPress={() => handlePressUser(post.userId)}
                >
                  <Image
                    source={{ uri: user?.avatarUrl }}
                    style={styles.overlaidAvatar}
                  />
                  <View style={styles.headerText}>
                    <Text style={styles.overlaidDisplayName}>
                      {user?.displayName ?? "Unknown"}
                    </Text>
                    <Text style={styles.overlaidUsername}>
                      @{user?.username ?? "unknown"}
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
        )}

        {/* Actions row */}
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <HapticPressable style={styles.actionButton} onPress={handleLike}>
              <Animated.View style={likeAnimatedStyle}>
                <SFIcon
                  name={liked ? "heart.fill" : "heart"}
                  fallback={liked ? "heart" : "heart-outline"}
                  size={26}
                  color={liked ? colors.liked : colors.text}
                />
              </Animated.View>
            </HapticPressable>
            <HapticPressable
              style={styles.actionButton}
              onPress={() => inputRef.current?.focus()}
            >
              <SFIcon
                name="bubble.left"
                fallback="chatbubble-outline"
                size={24}
                color={colors.text}
              />
            </HapticPressable>
            <HapticPressable
              style={styles.actionButton}
              onPress={() =>
                sharePost(post.id, place?.name ?? "a place", post.content)
              }
            >
              <SFIcon
                name="paperplane"
                fallback="paper-plane-outline"
                size={24}
                color={colors.text}
              />
            </HapticPressable>
          </View>
          <SFIcon name="bookmark" fallback="bookmark-outline" size={24} color={colors.text} />
        </View>

        {/* Like count */}
        <Text style={styles.likeCount}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Text>

        {/* Caption */}
        <View style={styles.captionRow}>
          <Text style={styles.captionText}>
            <Text style={styles.captionAuthor}>{user?.displayName} </Text>
            {post.content}
          </Text>
        </View>

        {/* Location row */}
        {place && (
          <HapticPressable
            style={styles.locationRow}
            onPress={() => handlePressPlace(place.id)}
          >
            <SFIcon name="mappin" fallback="location" size={16} color={categoryColor} />
            <Text style={styles.locationName}>{place.name}</Text>
            <SFIcon
              name="chevron.right"
              fallback="chevron-forward"
              size={14}
              color={colors.textMuted}
            />
          </HapticPressable>
        )}

        {/* Comments */}
        {allComments.length > 0 && (
          <View style={styles.commentsSection}>
            {allComments.map((comment) => {
              const commentUser = commentUserMap.get(comment.userId);
              const isOwn = comment.userId === profile?.id;
              return (
                <View key={comment.id} style={styles.commentRow}>
                  <HapticPressable
                    onPress={() => handlePressUser(comment.userId)}
                  >
                    <Image
                      source={{ uri: commentUser?.avatarUrl }}
                      style={styles.commentAvatar}
                    />
                  </HapticPressable>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentAuthor}>
                        {commentUser?.displayName ?? "Unknown"}
                      </Text>
                      <Text style={styles.commentTime}>
                        {" "}
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </Text>
                    <Text style={styles.commentBody}>{comment.text}</Text>
                    {isOwn && (
                      <View style={styles.commentActions}>
                        <HapticPressable
                          onPress={() => {
                            setEditingCommentId(comment.id);
                            setCommentText(comment.text);
                            inputRef.current?.focus();
                          }}
                        >
                          <Text style={styles.commentActionText}>Edit</Text>
                        </HapticPressable>
                        <HapticPressable
                          onPress={() => {
                            Alert.alert(
                              "Delete comment?",
                              "This cannot be undone.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: async () => {
                                    try {
                                      await deleteComment(comment.id);
                                      refetchComments();
                                    } catch {}
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.commentActionText,
                              { color: colors.liked },
                            ]}
                          >
                            Delete
                          </Text>
                        </HapticPressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Comment input bar */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: inputFocused ? 8 : insets.bottom + 60 },
        ]}
      >
        {editingCommentId && (
          <HapticPressable
            onPress={handleCancelEdit}
            style={styles.cancelButton}
          >
            <SFIcon name="xmark.circle.fill" fallback="close-circle" size={22} color={colors.textMuted} />
          </HapticPressable>
        )}
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder={
            editingCommentId ? "Edit comment..." : "Add a comment..."
          }
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSubmitEditing={handleSubmitComment}
          returnKeyType="send"
        />
        <HapticPressable
          onPress={handleSubmitComment}
          disabled={!commentText.trim()}
          style={styles.sendButton}
        >
          <SFIcon
            name={editingCommentId ? "checkmark.circle.fill" : "paperplane.fill"}
            fallback={editingCommentId ? "checkmark-circle" : "send"}
            size={22}
            color={commentText.trim() ? colors.primary : colors.gray300}
          />
        </HapticPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  // Standard header (text-only posts)
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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
    padding: 2,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  captionRow: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  captionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  captionAuthor: {
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  // Location row
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 16,
    paddingVertical: 8,
    gap: 4,
  },
  locationName: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
    flex: 1,
  },
  commentsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    paddingTop: 12,
  },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentAuthor: {
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  commentBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 19,
    marginTop: 2,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    backgroundColor: colors.background,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
  },
  cancelButton: {
    marginRight: 8,
    padding: 4,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
});
