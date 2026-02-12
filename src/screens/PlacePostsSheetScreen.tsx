import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFollow } from '../context/FollowContext';
import { useLike } from '../context/LikeContext';
import { useQuery } from '../hooks/useQuery';
import { getPlaceById } from '../services/places';
import { getPostsByPlaceId } from '../services/posts';
import { getProfileById } from '../services/users';
import { fetchPlaceDetails } from '../services/googlePlaceDetails';
import { formatNumber } from '../utils/formatNumber';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import type { Place, PlaceCategory, Post } from '../types';

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
};

export function PlacePostsSheetScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const { followingIds } = useFollow();

  const fetchPlace = useCallback(() => getPlaceById(placeId!), [placeId]);
  const fetchPosts = useCallback(() => getPostsByPlaceId(placeId!), [placeId]);

  const { data: place, loading: placeLoading } = useQuery(fetchPlace, placeId);
  const { data: posts, loading: postsLoading } = useQuery(fetchPosts, placeId);

  const [placeDetails, setPlaceDetails] = useState<{ rating?: number; userRatingsTotal?: number }>({});

  // Fetch place details from Google Places API
  useEffect(() => {
    if (place && !place.rating) {
      fetchPlaceDetails(place.latitude, place.longitude, place.name).then(details => {
        if (details.rating) {
          setPlaceDetails(details);
        }
      });
    } else if (place?.rating) {
      setPlaceDetails({ rating: place.rating, userRatingsTotal: place.userRatingsTotal });
    }
  }, [place]);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      const aFollowed = followingIds.includes(a.userId);
      const bFollowed = followingIds.includes(b.userId);
      if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
      return b.likes - a.likes;
    });
  }, [posts, followingIds]);

  const totalLikes = useMemo(
    () => (posts ?? []).reduce((sum, p) => sum + p.likes, 0),
    [posts],
  );

  const handleOpenDirections = useCallback(() => {
    if (!place) return;

    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);

    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open maps:', err);
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      });
    }
  }, [place]);

  if (placeLoading || postsLoading || !place) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const categoryColor = colors.category[place.category];

  return (
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <HapticPressable
          onPress={() => {
            router.dismiss();
            router.push(`/map/place/${place.id}`);
          }}
          style={styles.nameButton}
        >
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </HapticPressable>
        <View style={styles.metaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
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
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{sortedPosts.length} posts</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{totalLikes} likes</Text>
          </View>
          <HapticPressable style={styles.directionsButton} onPress={handleOpenDirections}>
            <Ionicons name="navigate" size={14} color={colors.primary} />
            <Text style={styles.directionsText}>Directions</Text>
          </HapticPressable>
        </View>
      </View>

      <View style={styles.postList}>
        {sortedPosts.map((post) => (
          <HapticPressable
            key={post.id}
            onPress={() => {
              router.dismiss();
              router.push(`/map/post/${post.id}`);
            }}
          >
            <PostRow
              post={post}
              isFollowed={followingIds.includes(post.userId)}
            />
          </HapticPressable>
        ))}
      </View>
    </ScrollView>
  );
}

function PostRow({
  post,
  isFollowed,
}: {
  post: Post;
  isFollowed: boolean;
}) {
  const fetchUser = useCallback(() => getProfileById(post.userId), [post.userId]);
  const { data: user } = useQuery(fetchUser);
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(post.id);

  return (
    <View style={styles.postRow}>
      <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user?.displayName ?? 'Unknown'}
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
            name={liked ? 'heart' : 'heart-outline'}
            size={14}
            color={liked ? colors.liked : colors.textMuted}
          />
          <Text style={[styles.likesText, liked && { color: colors.liked }]}>
            {getLikeCount(post.id)}
          </Text>
        </HapticPressable>
      </View>
      {post.mediaUrl &&
        (post.type === 'video' ? (
          <VideoThumbnail thumbnailUrl={post.thumbnailUrl} style={styles.thumbnail} />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={styles.thumbnail} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    paddingTop: 100
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.cardBackground,
  },
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  postList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postRow: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  followBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  followBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  postText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
