import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, usePathname, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { SFIcon } from '../components/SFIcon';
import { useQuery } from '../hooks/useQuery';
import { getPlaceById } from '../services/places';
import { getPostsByPlaceId as getPostsByPlaceIdAsync } from '../services/posts';
import { getProfilesByIds } from '../services/users';
import { fetchPlaceDetails } from '../services/googlePlaceDetails';
import { formatNumber } from '../utils/formatNumber';
import { sortPosts } from '../utils/postSorting';
import { useFollow } from '../context/FollowContext';
import { useLike } from '../context/LikeContext';
import { useSave } from '../context/SaveContext';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { useTheme, type Colors } from '../theme/ThemeContext';
import type { PlaceCategory } from '../types';
import { fonts } from "../theme/fonts";
import { HapticPressable } from 'src/components/HapticPressable';
import { HashtagText } from '../components/HashtagText';
import { LiquidGlassButton } from '../components/LiquidGlassButton';

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  attraction: 'Attraction',
  park: 'Park',
  venue: 'Venue',
  trail: 'Trail',
};

export function PlaceDetailScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { followingIds } = useFollow();
  const { isSaved, toggleSave } = useSave();

  const fetchPlace = useCallback(() => getPlaceById(placeId), [placeId]);
  const { data: place, loading: loadingPlace, refetch: refetchPlace } = useQuery(fetchPlace, ['place', placeId]);

  const fetchPosts = useCallback(() => getPostsByPlaceIdAsync(placeId), [placeId]);
  const { data: posts, loading: loadingPosts, refetch: refetchPosts } = useQuery(fetchPosts, ['posts', 'place', placeId]);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
    }, [refetchPosts])
  );

  const userIds = useMemo(
    () => [...new Set((posts ?? []).map((p) => p.userId))],
    [posts]
  );
  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds);

  const loading = loadingPlace || loadingPosts;

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

  // Use centralized sorting - sorts by most recent first
  const sortedPosts = sortPosts(allPosts);

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
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 60 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.name}>{place.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>
                  {CATEGORY_LABELS[place.category]}
                </Text>
              </View>
              {placeDetails.rating && (
                <View style={styles.ratingContainer}>
                  <SFIcon name="star.fill" fallback="star" size={14} color="#FFA500" />
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
                <SFIcon name="bubble.left" fallback="chatbubble-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>{allPosts.length} posts</Text>
              </View>
              <View style={styles.stat}>
                <SFIcon name="heart" fallback="heart-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>{totalLikes} likes</Text>
              </View>
              <HapticPressable
                style={styles.saveButton}
                onPress={() => toggleSave('place', place.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SFIcon
                  name={isSaved('place', place.id) ? 'bookmark.fill' : 'bookmark'}
                  fallback={isSaved('place', place.id) ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={isSaved('place', place.id) ? colors.saved : colors.textSecondary}
                />
                <Text style={[styles.statText, isSaved('place', place.id) && { color: colors.saved }]}>Save</Text>
              </HapticPressable>
              <HapticPressable style={styles.directionsButton} onPress={handleOpenDirections}>
                <SFIcon name="location.fill" fallback="navigate" size={16} color={colors.primary} />
                <Text style={styles.directionsText}>Directions</Text>
              </HapticPressable>
            </View>
            <LiquidGlassButton
              title="Write a post"
              icon="create-outline"
              variant="secondary"
              fullWidth
              size="medium"
              style={styles.writePostButton}
              onPress={() => router.push({ pathname: `${tabBase}/create-post`, params: { placeId: place.id } })}
            />
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
                contentFit="cover"
                transition={200}
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
              <HashtagText
                style={styles.postText}
                onPressHashtag={(tag) => router.push(`${tabBase}/hashtag/${tag}` as any)}
              >
                {item.post.content}
              </HashtagText>
              {item.post.mediaUrl && (
                item.post.type === 'video' ? (
                  <VideoThumbnail thumbnailUrl={item.post.thumbnailUrl} fallbackUrl={item.post.mediaUrl} style={styles.postMedia} />
                ) : (
                  <Image source={{ uri: item.post.mediaUrl }} style={styles.postMedia} contentFit="cover" transition={200} />
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isLiked, toggleLike, getLikeCount } = useLike();
  const liked = isLiked(postId);

  return (
    <HapticPressable
      style={styles.postMeta}
      onPress={() => toggleLike(postId)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SFIcon
        name={liked ? 'heart.fill' : 'heart'}
        fallback={liked ? 'heart' : 'heart-outline'}
        size={15}
        color={liked ? colors.liked : colors.textMuted}
      />
      <Text style={[styles.likesText, liked && { color: colors.liked }]}>
        {getLikeCount(postId)}
      </Text>
    </HapticPressable>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.semiBold,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 10,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  reviewCountText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  writePostButton: {
    marginTop: 14,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  directionsText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
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
    fontFamily: fonts.semiBold,
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
    fontFamily: fonts.semiBold,
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
