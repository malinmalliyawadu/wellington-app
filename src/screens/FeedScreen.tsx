import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FeedPost } from "../components/FeedPost";
import { FeedGuideCard } from "../components/FeedGuideCard";
import { useFollow } from "../context/FollowContext";
import { useAuth } from "../context/AuthContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useQuery } from "../hooks/useQuery";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getFeedPostsPaginated } from "../services/posts";
import { getFeedGuides } from "../services/guides";
import { getProfilesByIds, getProfileByUsername } from "../services/users";
import { getPlaces } from "../services/places";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { QueryErrorState } from "../components/QueryErrorState";
import { fonts } from "../theme/fonts";
import type { FeedItem } from "../types";

export function FeedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();

  const {
    data: postsData,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ['feedPosts', followingIds, profile?.id],
    queryFn: ({ pageParam }) =>
      getFeedPostsPaginated(followingIds, profile?.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });

  const feedPosts = useMemo(
    () => postsData?.pages.flatMap((page) => page.posts) ?? [],
    [postsData]
  );

  const fetchFeedGuidesData = useCallback(
    () => getFeedGuides(followingIds, profile?.id),
    [followingIds, profile?.id]
  );
  const {
    data: feedGuides,
    refetch: refetchGuides,
  } = useQuery(fetchFeedGuidesData, ['feedGuides', followingIds, profile?.id], { staleTime: 60_000 });

  const [refreshing, setRefreshing] = useState(false);

  // Invalidate data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      refetchGuides();
    }, [queryClient, refetchGuides])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPosts(), refetchGuides()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPosts, refetchGuides]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch all users and places for the feed
  const userIds = useMemo(() => {
    const postUserIds = feedPosts.map((p) => p.userId);
    const guideUserIds = (feedGuides ?? []).map((g) => g.userId);
    return [...new Set([...postUserIds, ...guideUserIds])];
  }, [feedPosts, feedGuides]);

  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds);
  const { data: places } = useQuery(getPlaces, 'places');

  // Pre-populate per-post and per-user cache entries so navigating to
  // PostDetailScreen or UserProfileScreen returns data instantly (no "Unknown" flash)
  useEffect(() => {
    for (const post of feedPosts) {
      queryClient.setQueryData(['q', ['post', post.id]], post);
    }
  }, [feedPosts, queryClient]);

  useEffect(() => {
    if (feedGuides) {
      for (const guide of feedGuides) {
        queryClient.setQueryData(['q', ['guide', guide.id]], guide);
      }
    }
  }, [feedGuides, queryClient]);

  useEffect(() => {
    if (users) {
      for (const user of users) {
        queryClient.setQueryData(['q', ['user', user.id]], user);
      }
    }
  }, [users, queryClient]);

  const feedItems = useMemo<FeedItem[]>(() => {
    if (!users || !places) return [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const placeMap = new Map(places.map((p) => [p.id, p]));

    const items: FeedItem[] = [];

    // Add posts (already in chronological order from pagination)
    for (const post of feedPosts) {
      const user = userMap.get(post.userId);
      const place = placeMap.get(post.placeId);
      if (user && place) {
        items.push({ type: 'post', post, user, place, sortDate: post.createdAt });
      }
    }

    // Add guides — only include guides within the loaded date range
    // to avoid chronological gaps when more posts haven't loaded yet
    const oldestPostDate = feedPosts.length > 0
      ? feedPosts[feedPosts.length - 1].createdAt
      : null;

    for (const guide of feedGuides ?? []) {
      const user = userMap.get(guide.userId);
      if (!user) continue;
      // If there are more post pages to load, only show guides newer than the oldest loaded post
      if (hasNextPage && oldestPostDate && guide.createdAt < oldestPostDate) continue;
      items.push({ type: 'guide', guide, user, sortDate: guide.createdAt });
    }

    // Sort combined feed by date descending
    items.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

    return items;
  }, [feedPosts, feedGuides, users, places, hasNextPage]);

  const handlePressUser = useCallback(
    (userId: string) => router.push(`/feed/user/${userId}`),
    [router]
  );

  const handlePressPlace = useCallback(
    (placeId: string) => router.push(`/feed/place/${placeId}`),
    [router]
  );

  const handlePressPost = useCallback(
    (postId: string) => router.push(`/feed/post/${postId}`),
    [router]
  );

  const handlePressLikes = useCallback(
    (postId: string) =>
      router.push({ pathname: "/feed/likes", params: { postId } }),
    [router]
  );

  const handlePressHashtag = useCallback(
    (tag: string) => router.push(`/feed/hashtag/${tag}` as any),
    [router]
  );

  const handlePressMention = useCallback(
    (username: string) => {
      getProfileByUsername(username).then((user) => {
        if (user) router.push(`/feed/user/${user.id}` as any);
      });
    },
    [router]
  );

  const handlePressGuide = useCallback(
    (guideId: string) => router.push(`/feed/guide/${guideId}` as any),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.type === 'guide') {
        return (
          <FeedGuideCard
            guide={item.guide}
            user={item.user}
            onPress={() => handlePressGuide(item.guide.id)}
            onPressUser={handlePressUser}
          />
        );
      }
      return (
        <FeedPost
          post={item.post}
          user={item.user}
          place={item.place}
          onPressUser={handlePressUser}
          onPressPlace={handlePressPlace}
          onPressPost={handlePressPost}
          onPressLikes={handlePressLikes}
          onPressHashtag={handlePressHashtag}
          onPressMention={handlePressMention}
        />
      );
    },
    [handlePressUser, handlePressPlace, handlePressPost, handlePressLikes, handlePressHashtag, handlePressMention, handlePressGuide]
  );

  const keyExtractor = useCallback((item: FeedItem) => {
    return item.type === 'post' ? `post-${item.post.id}` : `guide-${item.guide.id}`;
  }, []);

  const styles = createStyles(colors);

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    if (!hasNextPage && feedItems.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <SFIcon name="checkmark.circle.fill" fallback="checkmark-circle" size={28} color={colors.gray300} />
          <Text style={styles.footerText}>You&apos;re all caught up</Text>
        </View>
      );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchingNextPage, hasNextPage, feedItems.length, colors.primary, styles]);

  if (postsError && feedPosts.length === 0) {
    return (
      <QueryErrorState
        message={postsError.message}
        onRetry={() => refetchPosts()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        testID="feed-list"
        data={feedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={3}
        removeClippedSubviews={Platform.OS === "android"}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentInset={{ top: headerHeight }}
        contentOffset={{ x: 0, y: -headerHeight }}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptySubtitle}>
              Follow people to see their recommendations here
            </Text>
            <HapticPressable
              style={styles.discoverButton}
              onPress={() => router.push("/feed/discover")}
            >
              <Text style={styles.discoverButtonText}>Discover People</Text>
            </HapticPressable>
          </View>
        }
      />

      <FloatingCreateButton />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
});
