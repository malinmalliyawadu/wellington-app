import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceById } from '../data/mockPlaces';
import { getPostsByPlaceId } from '../data/mockPosts';
import { getUserById } from '../data/mockUsers';
import { useFollow } from '../context/FollowContext';
import { colors } from '../theme/colors';
import type { MapStackParamList } from '../navigation/types';
import type { PlaceCategory } from '../types';

type Props = NativeStackScreenProps<MapStackParamList, 'PlaceDetail'>;

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
};

export function PlaceDetailScreen() {
  const route = useRoute<Props['route']>();
  const { placeId } = route.params;
  const { followingIds } = useFollow();

  const place = getPlaceById(placeId);
  if (!place) return null;

  const posts = getPostsByPlaceId(placeId);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const categoryColor = colors.category[place.category];

  const sortedPosts = [...posts].sort((a, b) => {
    const aFollowed = followingIds.includes(a.userId);
    const bFollowed = followingIds.includes(b.userId);
    if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
    return b.likes - a.likes;
  });

  const postsWithUsers = sortedPosts.map((post) => ({
    post,
    user: getUserById(post.userId),
    isFollowed: followingIds.includes(post.userId),
  }));

  return (
    <View style={styles.container}>
      <FlatList
        data={postsWithUsers}
        keyExtractor={(item) => item.post.id}
        showsVerticalScrollIndicator={false}
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
                <Text style={styles.statText}>{posts.length} posts</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>{totalLikes} likes</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postRow}>
            <Image
              source={{ uri: item.user?.avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.postContent}>
              <View style={styles.postHeader}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {item.user?.displayName ?? 'Unknown'}
                </Text>
                {item.isFollowed && (
                  <View style={styles.followBadge}>
                    <Text style={styles.followBadgeText}>Following</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postText}>{item.post.content}</Text>
              {item.post.mediaUrl && (
                <Image source={{ uri: item.post.mediaUrl }} style={styles.postMedia} />
              )}
              <View style={styles.postMeta}>
                <Ionicons name="heart" size={13} color={colors.textMuted} />
                <Text style={styles.likesText}>{item.post.likes}</Text>
              </View>
            </View>
          </View>
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
