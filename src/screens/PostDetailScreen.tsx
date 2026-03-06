import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import {
  useLocalSearchParams,
  useRouter,
  usePathname,
  useNavigation,
  useFocusEffect,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { SFIcon } from "../components/SFIcon";
import { QueryErrorState } from "../components/QueryErrorState";
import {
  getPostById as getPostByIdAsync,
  updatePost,
  deletePost,
} from "../services/posts";
import { getProfileById, getProfilesByIds, getProfileByUsername } from "../services/users";
import { getPlaceById as getPlaceByIdAsync } from "../services/places";
import {
  getCommentsByPostId as getCommentsAsync,
  createComment,
  updateComment,
} from "../services/comments";
import { useQuery } from "../hooks/useQuery";
import { useDoubleTapLike } from "../hooks/useDoubleTapLike";
import { useAuth } from "../context/AuthContext";
import { getPostMediaItems } from "../utils/postMedia";
import { useTheme } from "../theme/ThemeContext";
import { sharePost } from "../utils/sharing";
import { useSave } from "../context/SaveContext";
import { usePoints } from "../context/PointsContext";
import { useToast } from "../context/ToastContext";
import { createCommentNotification, createMentionNotification } from "../services/notifications";
import { ContextMenu, Button as ExpoButton, Host } from "@expo/ui/swift-ui";
import { HapticPressable } from "src/components/HapticPressable";
import { HashtagText } from "../components/HashtagText";
import { useReport } from "../hooks/useReport";
import { detectMentionAtCursor, extractMentions } from "../utils/mentions";
import { useMentionSuggestions } from "../hooks/useMentionSuggestions";
import { formatTimeAgo } from "./post-detail/formatTimeAgo";
import { createStyles } from "./post-detail/postDetailStyles";
import { PostMediaSection } from "./post-detail/PostMediaSection";
import { PostActions } from "./post-detail/PostActions";
import { CommentSection } from "./post-detail/CommentSection";
import { CommentInputBar } from "./post-detail/CommentInputBar";
import { EditCaptionModal } from "./post-detail/EditCaptionModal";

export function PostDetailScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { profile } = useAuth();
  const { awardPointsForAction } = usePoints();
  const inputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState("");
  const [commentCursorPosition, setCommentCursorPosition] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isSaved, toggleSave } = useSave();
  const saved = isSaved("post", postId);
  const fetchPost = useCallback(() => getPostByIdAsync(postId), [postId]);
  const {
    data: post,
    loading,
    error: postError,
    refetch: refetchPost,
  } = useQuery(fetchPost, ["post", postId]);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Use stored dimensions when available to avoid layout shift
  useEffect(() => {
    if (post?.mediaWidth && post?.mediaHeight) {
      setAspectRatio(post.mediaWidth / post.mediaHeight);
    }
  }, [post?.mediaWidth, post?.mediaHeight]);

  const isOwnPost = post?.userId === profile?.id;
  const onEditRef = useRef<(() => void) | undefined>(undefined);
  const onDeleteRef = useRef<(() => void) | undefined>(undefined);
  const onReportRef = useRef<(() => void) | undefined>(undefined);
  const { showReportAlert } = useReport();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Host matchContents>
          <ContextMenu activationMethod="singlePress">
            <ContextMenu.Trigger>
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 7,
                }}
              >
                <SFIcon
                  name="ellipsis"
                  fallback="ellipsis-horizontal"
                  size={22}
                  color={colors.text}
                />
              </View>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              {isOwnPost ? (
                <>
                  <ExpoButton
                    systemImage="pencil"
                    onPress={() => onEditRef.current?.()}
                  >
                    Edit caption
                  </ExpoButton>
                  <ExpoButton
                    systemImage="trash"
                    role="destructive"
                    onPress={() => onDeleteRef.current?.()}
                  >
                    Delete post
                  </ExpoButton>
                </>
              ) : (
                <ExpoButton
                  systemImage="flag"
                  role="destructive"
                  onPress={() => onReportRef.current?.()}
                >
                  Report
                </ExpoButton>
              )}
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isOwnPost]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post?.userId]
  );
  const { data: user } = useQuery(fetchUser, post?.userId);

  const fetchPlace = useCallback(
    () => (post ? getPlaceByIdAsync(post.placeId) : Promise.resolve(null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post?.placeId]
  );
  const { data: place } = useQuery(fetchPlace, post?.placeId);

  const fetchComments = useCallback(
    () => (post ? getCommentsAsync(post.id) : Promise.resolve([])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post?.id]
  );
  const { data: comments, refetch: refetchComments } = useQuery(
    fetchComments,
    post?.id ? ["comments", post.id] : undefined,
    { staleTime: 30_000 }
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

  // Mention autocomplete for comment input
  const commentMentionQuery = detectMentionAtCursor(commentText, commentCursorPosition);
  const commentMentionSuggestions = useMentionSuggestions(commentMentionQuery, profile?.id);

  const insertCommentMention = useCallback(
    (user: { username: string }) => {
      const MAX = 500;
      const partial = detectMentionAtCursor(commentText, commentCursorPosition);
      if (partial === null) return;

      const start = commentCursorPosition - partial.length - 1;
      const before = commentText.slice(0, start);
      const after = commentText.slice(commentCursorPosition);
      const insertion = `@${user.username} `;
      const newText = (before + insertion + after).slice(0, MAX);
      setCommentText(newText);
      setCommentCursorPosition(Math.min(before.length + insertion.length, MAX));
    },
    [commentText, commentCursorPosition],
  );

  // Refetch post and comments when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchPost();
      refetchComments();
    }, [refetchPost, refetchComments])
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

  if (postError && !post) {
    return <QueryErrorState message={postError} onRetry={refetchPost} />;
  }

  if (!post) return null;

  const allComments = comments ?? [];
  const categoryColor = place
    ? colors.category[place.category]
    : colors.gray400;
  const mediaItems = getPostMediaItems(post);
  const hasMedia = mediaItems.length > 0;

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

  const handlePressMention = (username: string) => {
    getProfileByUsername(username).then((u) => {
      if (u) router.push(`${currentTab}/user/${u.id}` as any);
    });
  };

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !profile) return;
    try {
      if (editingCommentId) {
        await updateComment(editingCommentId, trimmed);
      } else {
        const newComment = await createComment({
          postId: post.id,
          userId: profile.id,
          text: trimmed,
        });
        createCommentNotification(profile.id, post.id).catch(() => {});
        awardPointsForAction('comment', newComment?.id);
        // Send mention notifications for mentioned users in the comment
        const mentionedUsernames = extractMentions(trimmed);
        for (const username of mentionedUsernames) {
          getProfileByUsername(username).then((u) => {
            if (u) createMentionNotification(profile.id, u.id, post.id).catch(() => {});
          });
        }
      }
      setEditingCommentId(null);
      setCommentText("");
      Keyboard.dismiss();
      queryClient.invalidateQueries({ queryKey: ["q", ["comments", post.id]] });
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

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setCommentText(text);
    inputRef.current?.focus();
  };

  onEditRef.current = () => {
    setEditContent(post.content);
    setEditModalVisible(true);
  };

  onReportRef.current = () => {
    showReportAlert({
      contentType: 'post',
      contentId: post.id,
      reportedUserId: post.userId,
    });
  };

  onDeleteRef.current = () => {
    Alert.alert("Delete post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(post.id);
            queryClient.invalidateQueries({ queryKey: ["q", "posts"] });
            queryClient.invalidateQueries({ queryKey: ["q", "feed"] });
            queryClient.invalidateQueries({
              queryKey: ["q", ["post", post.id]],
            });
            showToast({ message: "Post deleted" });
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      await updatePost(post.id, trimmed);
      setEditModalVisible(false);
      showToast({ message: "Post updated" });
      queryClient.invalidateQueries({ queryKey: ["q", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["q", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["q", ["post", post.id]] });
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to update post");
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
            <Image
              source={{ uri: user?.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
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
          <PostMediaSection
            post={post}
            user={user}
            mediaItems={mediaItems}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            onImageLoad={handleImageLoad}
            onVideoLoad={handleVideoLoad}
            onPressUser={handlePressUser}
            doubleTapRef={doubleTapRef}
            handleDoubleTap={handleDoubleTap}
            heartOverlayStyle={heartOverlayStyle}
            styles={styles}
          />
        )}

        {/* Actions + Like count */}
        <PostActions
          liked={liked}
          likeCount={likeCount}
          saved={saved}
          likeAnimatedStyle={likeAnimatedStyle}
          postId={post.id}
          currentTab={currentTab}
          onLike={handleLike}
          onFocusComment={() => inputRef.current?.focus()}
          onShare={() => sharePost(post.id)}
          onToggleSave={() => toggleSave("post", postId)}
          onPressLikeCount={() =>
            router.push({
              pathname: `${currentTab}/likes` as any,
              params: { postId: post.id },
            })
          }
          colors={colors}
          styles={styles}
        />

        {/* Caption */}
        <View style={styles.captionRow}>
          <HashtagText
            style={styles.captionText}
            onPressHashtag={(tag) =>
              router.push(`${currentTab}/hashtag/${tag}` as any)
            }
            onPressMention={handlePressMention}
          >
            {post.content}
          </HashtagText>
        </View>

        {/* Location row */}
        {place && (
          <HapticPressable
            style={styles.locationRow}
            onPress={() => handlePressPlace(place.id)}
          >
            <SFIcon
              name="mappin"
              fallback="location"
              size={16}
              color={categoryColor}
            />
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
        <CommentSection
          comments={allComments}
          commentUserMap={commentUserMap}
          profileId={profile?.id}
          currentTab={currentTab}
          router={router}
          queryClient={queryClient}
          postId={post.id}
          onPressUser={handlePressUser}
          onPressMention={handlePressMention}
          onEditComment={handleEditComment}
          colors={colors}
          styles={styles}
        />
      </ScrollView>

      {/* Mention suggestions + Comment input bar */}
      <CommentInputBar
        inputRef={inputRef}
        commentText={commentText}
        editingCommentId={editingCommentId}
        inputFocused={inputFocused}
        bottomInset={insets.bottom}
        mentionSuggestions={commentMentionSuggestions}
        onChangeText={setCommentText}
        onSelectionChange={(e) =>
          setCommentCursorPosition(e.nativeEvent.selection.end)
        }
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        onSubmit={handleSubmitComment}
        onCancelEdit={handleCancelEdit}
        onSelectMention={insertCommentMention}
        colors={colors}
        styles={styles}
      />

      {/* Edit caption modal */}
      <EditCaptionModal
        visible={editModalVisible}
        editContent={editContent}
        onChangeContent={setEditContent}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        colors={colors}
        styles={styles}
      />
    </KeyboardAvoidingView>
  );
}
