import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FeedPost } from "../components/FeedPost";
import { useFollow } from "../context/FollowContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { getFeedPosts } from "../services/posts";
import { getProfilesByIds } from "../services/users";
import { getPlaces } from "../services/places";
import { sortPosts } from "../utils/postSorting";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { profile } = useAuth();
  const headerHeight = useHeaderHeight();
  const fetchFeedPosts = useCallback(
    () => getFeedPosts(followingIds, profile?.id),
    [followingIds, profile?.id]
  );
  const {
    data: feedPosts,
    loading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery(fetchFeedPosts, [followingIds, profile?.id]);
  const [refreshing, setRefreshing] = useState(false);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
    }, [refetchPosts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchPosts();
    setTimeout(() => setRefreshing(false), 600);
  }, [refetchPosts]);

  // Fetch all users and places for the feed
  const userIds = useMemo(
    () => [...new Set((feedPosts ?? []).map((p) => p.userId))],
    [feedPosts]
  );
  const fetchUsers = useCallback(() => getProfilesByIds(userIds), [userIds]);
  const { data: users } = useQuery(fetchUsers, userIds);
  const { data: places } = useQuery(getPlaces);

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

  const handlePressUser = (userId: string) => {
    router.push(`/feed/user/${userId}`);
  };

  const handlePressPlace = (placeId: string) => {
    router.push(`/feed/place/${placeId}`);
  };

  const handlePressPost = (postId: string) => {
    router.push(`/feed/post/${postId}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={postsWithData}
        keyExtractor={(item) => item.post.id}
        renderItem={({ item }) => (
          <FeedPost
            post={item.post}
            user={item.user}
            place={item.place}
            onPressUser={handlePressUser}
            onPressPlace={handlePressPlace}
            onPressPost={handlePressPost}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
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
    fontWeight: "700",
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
  },
});
