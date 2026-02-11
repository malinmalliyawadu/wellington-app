import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '../hooks/useQuery';
import { getPlaceById } from '../services/places';
import { getPostsByPlaceId as getPostsByPlaceIdAsync } from '../services/posts';
import { getProfilesByIds } from '../services/users';
import { useFollow } from '../context/FollowContext';
import { useLike } from '../context/LikeContext';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { colors } from '../theme/colors';
import type { PlaceCategory } from '../types';
import { HapticPressable } from 'src/components/HapticPressable';

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
};

export function PlaceDetailScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();

  const fetchPlace = useCallback(() => getPlaceById(placeId), [placeId]);
  const { data: place, loading: loadingPlace } = useQuery(fetchPlace);

  const fetchPosts = useCallback(() => getPostsByPlaceIdAsync(placeId), [placeId]);
  const { data: posts, loading: loadingPosts } = useQuery(fetchPosts);

  const userIds = useMemo(
    () => [...new Set((posts ?? []).map((p) => p.userId))],
    [posts]
  );
  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds);

  const loading = loadingPlace || loadingPosts;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!place) return null;

  const allPosts = posts ?? [];
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  const totalLikes = allPosts.reduce((sum, p) => sum + p.likes, 0);
  const categoryColor = colors.category[place.category];

  const sortedPosts = [...allPosts].sort((a, b) => {
    const aFollowed = followingIds.includes(a.userId);
    const bFollowed = followingIds.includes(b.userId);
    if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
    return b.likes - a.likes;
  });

  const postsWithUsers = sortedPosts.map((post) => ({
    post,
    user: userMap.get(post.userId),
    isFollowed: followingIds.includes(post.userId),
  }));

  return (
    <View style={styles.container}>
      <FlatList
        data={postsWithUsers}
        keyExtractor={(item) => item.post.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.name}>{place.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>
                  {CATEGORY_LABELS[place.category]}
                </Text>
              </View>
              <Text style={styles.address} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>{allPosts.length} posts</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>{totalLikes} likes</Text>
              </View>
            </View>
            <HapticPressable
              style={styles.writePostButton}
              onPress={() => router.navigate({ pathname: '/(tabs)/create', params: { placeId: place.id } })}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.writePostText}>Write a post</Text>
            </HapticPressable>
          </View>
        }
        renderItem={({ item }) => (
          <HapticPressable
            style={styles.postRow}
            onPress={() => router.push(`${tabBase}/post/${item.post.id}`)}
          >
            <HapticPressable onPress={() => router.push(`${tabBase}/user/${item.post.userId}`)}>
              <Image
                source={{ uri: item.user?.avatarUrl }}
                style={styles.avatar}
              />
            </HapticPressable>
            <View style={styles.postContent}>
              <HapticPressable
                style={styles.postHeader}
                onPress={() => router.push(`${tabBase}/user/${item.post.userId}`)}
              >
                <Text style={styles.displayName} numberOfLines={1}>
                  {item.user?.displayName ?? 'Unknown'}
                </Text>
                {item.isFollowed && (
                  <View style={styles.followBadge}>
                    <Text style={styles.followBadgeText}>Following</Text>
                  </View>
                )}
              </HapticPressable>
              <Text style={styles.postText}>{item.post.content}</Text>
              {item.post.mediaUrl && (
                item.post.type === 'video' ? (
                  <VideoThumbnail thumbnailUrl={item.post.thumbnailUrl} style={styles.postMedia} />
                ) : (
                  <Image source={{ uri: item.post.mediaUrl }} style={styles.postMedia} />
                )
              )}
              <PostLikeButton postId={item.post.id} />
            </View>
          </HapticPressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts for this place yet</Text>
          </View>
        }
      />
    </View>
  );
}

function PostLikeButton({ postId }: { postId: string }) {
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(postId);

  return (
    <HapticPressable
      style={styles.postMeta}
      onPress={() => toggleLike(postId)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={15}
        color={liked ? colors.liked : colors.textMuted}
      />
      <Text style={[styles.likesText, liked && { color: colors.liked }]}>
        {getLikeCount(postId)}
      </Text>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  writePostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  writePostText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  postRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  followBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  postText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
