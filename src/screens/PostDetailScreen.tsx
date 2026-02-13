import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPostById as getPostByIdAsync } from '../services/posts';
import { getProfileById, getProfilesByIds } from '../services/users';
import { getPlaceById as getPlaceByIdAsync } from '../services/places';
import { getCommentsByPostId as getCommentsAsync, createComment, updateComment, deleteComment } from '../services/comments';
import { useQuery } from '../hooks/useQuery';
import { useLike } from '../context/LikeContext';
import { useAuth } from '../context/AuthContext';
import { VideoPlayer } from '../components/VideoPlayer';
import { colors } from '../theme/colors';
import { HapticPressable } from 'src/components/HapticPressable';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

export function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const { profile } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const fetchPost = useCallback(() => getPostByIdAsync(postId), [postId]);
  const { data: post, loading } = useQuery(fetchPost);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

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
  const { data: comments, refetch: refetchComments } = useQuery(fetchComments, post?.id);

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) return null;

  const allComments = comments ?? [];
  const liked = isLiked(post.id);
  const likeCount = getLikeCount(post.id);
  const categoryColor = place ? colors.category[place.category] : colors.gray400;

  const currentTab = pathname.startsWith('/feed')
    ? '/feed'
    : pathname.startsWith('/profile')
      ? '/profile'
      : '/map';

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
        await createComment({ postId: post.id, userId: profile.id, text: trimmed });
      }
      setEditingCommentId(null);
      setCommentText('');
      Keyboard.dismiss();
      // Delay refetch to avoid the cleanup function cancelling the in-flight request
      setTimeout(() => refetchComments(), 0);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save comment');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Author header */}
        <HapticPressable style={styles.header} onPress={() => handlePressUser(post.userId)}>
          <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.displayName}>{user?.displayName ?? 'Unknown'}</Text>
            <Text style={styles.username}>@{user?.username ?? 'unknown'}</Text>
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
        </HapticPressable>

        {/* Media */}
        {post.mediaUrl && (
          post.type === 'video' ? (
            <VideoPlayer
              uri={post.mediaUrl}
              style={[styles.media, { aspectRatio }]}
              shouldPlay
              useNativeControls
              onLoad={handleVideoLoad}
            />
          ) : (
            <Image
              source={{ uri: post.mediaUrl }}
              style={[styles.media, { aspectRatio }]}
              onLoad={handleImageLoad}
            />
          )
        )}

        {/* Actions row */}
        <View style={styles.actions}>
          <HapticPressable
            style={styles.actionButton}
            onPress={() => toggleLike(post.id)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? colors.liked : colors.text}
            />
          </HapticPressable>
          <HapticPressable style={styles.actionButton} onPress={() => inputRef.current?.focus()}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </HapticPressable>
          <HapticPressable
            style={styles.actionButton}
            onPress={() => {
              const placeName = place?.name ?? 'a place';
              Share.share({ message: `Check out ${placeName}: ${post.content}` });
            }}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </HapticPressable>
        </View>

        {/* Like count */}
        <Text style={styles.likeCount}>
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </Text>

        {/* Caption */}
        <View style={styles.captionRow}>
          <Text style={styles.captionText}>
            <Text style={styles.captionAuthor}>{user?.displayName} </Text>
            {post.content}
          </Text>
        </View>

        {/* Place tag */}
        {place && (
          <HapticPressable
            style={[styles.placeBadge, { backgroundColor: categoryColor + '15' }]}
            onPress={() => handlePressPlace(place.id)}
          >
            <View style={[styles.placeDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.placeName, { color: categoryColor }]}>{place.name}</Text>
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
                  <HapticPressable onPress={() => handlePressUser(comment.userId)}>
                    <Image
                      source={{ uri: commentUser?.avatarUrl }}
                      style={styles.commentAvatar}
                    />
                  </HapticPressable>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentAuthor}>
                        {commentUser?.displayName ?? 'Unknown'}
                      </Text>
                      <Text style={styles.commentTime}> {formatTimeAgo(comment.createdAt)}</Text>
                    </Text>
                    <Text style={styles.commentBody}>{comment.text}</Text>
                    {isOwn && (
                      <View style={styles.commentActions}>
                        <HapticPressable onPress={() => {
                          setEditingCommentId(comment.id);
                          setCommentText(comment.text);
                          inputRef.current?.focus();
                        }}>
                          <Text style={styles.commentActionText}>Edit</Text>
                        </HapticPressable>
                        <HapticPressable onPress={() => {
                          Alert.alert('Delete comment?', 'This cannot be undone.', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await deleteComment(comment.id);
                                  refetchComments();
                                } catch { }
                              },
                            },
                          ]);
                        }}>
                          <Text style={[styles.commentActionText, { color: colors.liked }]}>Delete</Text>
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
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + (inputFocused ? 0 : 60) || 8 }]}>
        {editingCommentId && (
          <HapticPressable onPress={handleCancelEdit} style={styles.cancelButton}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </HapticPressable>
        )}
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder={editingCommentId ? 'Edit comment...' : 'Add a comment...'}
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
          <Ionicons
            name={editingCommentId ? 'checkmark-circle' : 'send'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
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
    width: '100%',
    backgroundColor: colors.gray200,
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
  },
  actionButton: {
    padding: 2,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  placeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '500',
  },
  commentsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    paddingTop: 12,
  },
  commentRow: {
    flexDirection: 'row',
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
    fontWeight: '600',
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
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
