import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, User, Place, PlaceCategory } from '../types';
import { useLike } from '../context/LikeContext';
import { useQuery } from '../hooks/useQuery';
import { getCommentsByPostId } from '../services/comments';
import { VideoPlayer } from './VideoPlayer';
import { colors } from '../theme/colors';

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  cafe: 'cafe',
  restaurant: 'restaurant',
  bar: 'wine',
  attraction: 'compass',
  park: 'leaf',
  venue: 'musical-notes',
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
  return 'Just now';
}

export function FeedPost({ post, user, place, onPressUser, onPressPlace, onPressPost }: FeedPostProps) {
  const categoryColor = colors.category[place.category];
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);
  const fetchComments = useCallback(() => getCommentsByPostId(post.id), [post.id]);
  const { data: comments } = useQuery(fetchComments);
  const commentCount = comments?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => onPressUser?.(user.id)}
          disabled={!onPressUser}
        >
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressPost?.(post.id)}
        disabled={!onPressPost}
      >
        {post.mediaUrl && (
          post.type === 'video' ? (
            <VideoPlayer
              uri={post.mediaUrl}
              style={styles.media}
              shouldPlay
              isMuted
              isLooping
            />
          ) : (
            <Image source={{ uri: post.mediaUrl }} style={styles.media} />
          )
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.caption}>{post.content}</Text>
        <TouchableOpacity
          style={[styles.placeBadge, { backgroundColor: categoryColor + '15' }]}
          onPress={() => onPressPlace?.(place.id)}
          disabled={!onPressPlace}
        >
          <Ionicons name={CATEGORY_ICONS[place.category]} size={13} color={categoryColor} style={styles.placeIcon} />
          <Text style={[styles.placeName, { color: categoryColor }]}>{place.name}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(post.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.liked : colors.textMuted}
          />
          <Text style={[styles.actionCount, liked && { color: colors.liked }]}>
            {getLikeCount(post.id)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPressPost?.(post.id)}
          disabled={!onPressPost}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
          <Text style={styles.actionCount}>
            {commentCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Share.share({ message: `Check out ${place.name}: ${post.content}` })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 300,
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  placeIcon: {
    marginRight: 5,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
