import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useQuery } from '../hooks/useQuery';
import { getHashtagByName, getPostIdsByHashtagId } from '../services/hashtags';
import { getPostsByIds } from '../services/posts';
import { getProfilesByIds } from '../services/users';
import { getPlaces } from '../services/places';
import { FeedPost } from '../components/FeedPost';
import { formatNumber } from '../utils/formatNumber';
import { useTheme, type Colors } from '../theme/ThemeContext';
import { QueryErrorState } from '../components/QueryErrorState';
import { fonts } from '../theme/fonts';

export function HashtagDetailScreen() {
  const { colors } = useTheme();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = '/' + pathname.split('/')[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const styles = createStyles(colors);

  const fetchHashtag = useCallback(() => getHashtagByName(tag), [tag]);
  const { data: hashtag, loading: loadingHashtag, error: hashtagError, refetch: refetchHashtag } = useQuery(fetchHashtag, ['hashtag', tag]);

  const fetchPostIds = useCallback(
    () => (hashtag ? getPostIdsByHashtagId(hashtag.id) : Promise.resolve([])),
    [hashtag?.id]
  );
  const { data: postIds, loading: loadingPostIds } = useQuery(fetchPostIds, hashtag?.id ? ['hashtag-posts', hashtag.id] : null);

  const fetchPosts = useCallback(
    () => getPostsByIds(postIds ?? []),
    [postIds]
  );
  const { data: posts, loading: loadingPosts } = useQuery(fetchPosts, postIds?.length ? ['posts', ...postIds] : null);

  const userIds = useMemo(
    () => [...new Set((posts ?? []).map((p) => p.userId))],
    [posts]
  );
  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds.length ? userIds : null);

  const { data: places } = useQuery(getPlaces, 'places');

  const userMap = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u])),
    [users]
  );
  const placeMap = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places]
  );

  const loadingFeed = loadingHashtag || loadingPostIds || loadingPosts;

  const postsWithData = useMemo(
    () =>
      (posts ?? [])
        .map((post) => ({
          post,
          user: userMap.get(post.userId),
          place: placeMap.get(post.placeId),
        }))
        .filter(
          (item): item is typeof item & { user: NonNullable<typeof item.user>; place: NonNullable<typeof item.place> } =>
            !!item.user && !!item.place
        )
        .sort((a, b) => new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()),
    [posts, userMap, placeMap]
  );

  const handlePressUser = useCallback(
    (userId: string) => router.push(`${tabBase}/user/${userId}` as any),
    [router, tabBase]
  );

  const handlePressPlace = useCallback(
    (placeId: string) => router.push(`${tabBase}/place/${placeId}` as any),
    [router, tabBase]
  );

  const handlePressPost = useCallback(
    (postId: string) => router.push(`${tabBase}/post/${postId}` as any),
    [router, tabBase]
  );

  const handlePressHashtag = useCallback(
    (hashtagTag: string) => router.push(`${tabBase}/hashtag/${hashtagTag}` as any),
    [router, tabBase]
  );

  if (loadingHashtag) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hashtagError && !hashtag) {
    return <QueryErrorState message={hashtagError} onRetry={refetchHashtag} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={postsWithData}
        keyExtractor={(item) => item.post.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 60 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.tagName}>#{tag}</Text>
            {hashtag && (
              <Text style={styles.postCount}>
                {formatNumber(hashtag.postCount)} {hashtag.postCount === 1 ? 'post' : 'posts'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <FeedPost
            post={item.post}
            user={item.user}
            place={item.place}
            onPressUser={handlePressUser}
            onPressPlace={handlePressPlace}
            onPressPost={handlePressPost}
            onPressHashtag={handlePressHashtag}
          />
        )}
        ListEmptyComponent={
          loadingFeed ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {hashtag ? 'No posts with this hashtag yet' : `#${tag} not found`}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tagName: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  postCount: {
    fontSize: 15,
    color: colors.textSecondary,
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
