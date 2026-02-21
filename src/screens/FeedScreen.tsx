import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FeedPost } from "../components/FeedPost";
import { useFollow } from "../context/FollowContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { useQueryClient } from "@tanstack/react-query";
import { getFeedPosts } from "../services/posts";
import { getProfilesByIds } from "../services/users";
import { getPlaces } from "../services/places";
import { sortPosts } from "../utils/postSorting";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { fonts } from "../theme/fonts";

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();
  const fetchFeedPosts = useCallback(
    () => getFeedPosts(followingIds, profile?.id),
    [followingIds, profile?.id]
  );
  const {
    data: feedPosts,
    loading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery(fetchFeedPosts, [followingIds, profile?.id], { staleTime: 60_000 });
  const [refreshing, setRefreshing] = useState(false);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
    }, [refetchPosts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchPosts();
    } finally {
      setRefreshing(false);
    }
  }, [refetchPosts]);

  // Fetch all users and places for the feed
  const userIds = useMemo(
    () => [...new Set((feedPosts ?? []).map((p) => p.userId))],
    [feedPosts]
  );
  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds);
  const { data: places } = useQuery(getPlaces, 'places');

  // Pre-populate per-post and per-user cache entries so navigating to
  // PostDetailScreen or UserProfileScreen returns data instantly (no "Unknown" flash)
  useEffect(() => {
    if (feedPosts) {
      for (const post of feedPosts) {
        queryClient.setQueryData(['q', ['post', post.id]], post);
      }
    }
  }, [feedPosts, queryClient]);

  useEffect(() => {
    if (users) {
      for (const user of users) {
        queryClient.setQueryData(['q', ['user', user.id]], user);
      }
    }
  }, [users, queryClient]);

  const postsWithData = useMemo(() => {
    if (!feedPosts || !users || !places) return [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const placeMap = new Map(places.map((p) => [p.id, p]));
    // Use centralized sorting - sorts by most recent first
    const sorted = sortPosts(feedPosts);
    return sorted
      .map((post) => {
        const user = userMap.get(post.userId);
        const place = placeMap.get(post.placeId);
        if (!user || !place) return null;
        return { post, user, place };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [feedPosts, users, places]);

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

  const renderItem = useCallback(
    ({ item }: { item: (typeof postsWithData)[number] }) => (
      <FeedPost
        post={item.post}
        user={item.user}
        place={item.place}
        onPressUser={handlePressUser}
        onPressPlace={handlePressPlace}
        onPressPost={handlePressPost}
        onPressLikes={handlePressLikes}
        onPressHashtag={handlePressHashtag}
      />
    ),
    [handlePressUser, handlePressPlace, handlePressPost, handlePressLikes, handlePressHashtag]
  );

  return (
    <View style={styles.container}>
      <FlatList
        testID="feed-list"
        data={postsWithData}
        keyExtractor={(item) => item.post.id}
        renderItem={renderItem}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={3}
        removeClippedSubviews={Platform.OS === "android"}
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

const styles = StyleSheet.create({
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
});
