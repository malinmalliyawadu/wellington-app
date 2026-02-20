import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFollow } from "../context/FollowContext";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "../hooks/useQuery";
import { getPostsByUserId } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getUnlockedAchievementCount } from "../services/achievements";
import { getEventsByUserId } from "../services/events";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { PostsGrid } from "../components/PostsGrid";
import { UpcomingEvents } from "../components/UpcomingEvents";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import { useInstagramConnection } from "../hooks/useInstagramConnection";
import { HapticPressable } from "src/components/HapticPressable";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const { isConnected: igConnected } = useInstagramConnection();

  const currentUser = profile ?? {
    id: "",
    username: "you",
    displayName: "You",
    avatarUrl: "",
    bio: "",
  };

  const fetchPosts = useCallback(
    () => getPostsByUserId(currentUser.id),
    [currentUser.id]
  );
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts, [
    "posts",
    "user",
    currentUser.id,
  ]);
  const { data: allPlaces, refetch: refetchPlaces } = useQuery(
    getPlaces,
    "places"
  );
  const fetchCounts = useCallback(
    () => getFollowCounts(currentUser.id),
    [currentUser.id]
  );
  const { data: counts, refetch: refetchCounts } = useQuery(fetchCounts, [
    "follow-counts",
    currentUser.id,
  ]);
  const fetchAchievementCount = useCallback(
    () => getUnlockedAchievementCount(currentUser.id),
    [currentUser.id]
  );
  const { data: achievementCount, refetch: refetchAchievementCount } = useQuery(
    fetchAchievementCount,
    ["achievement-count", currentUser.id]
  );
  const fetchEvents = useCallback(
    () => getEventsByUserId(currentUser.id),
    [currentUser.id]
  );
  const { data: events, refetch: refetchEvents } = useQuery(fetchEvents, [
    "events",
    "user",
    currentUser.id,
  ]);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchPlaces();
      refetchCounts();
      refetchAchievementCount();
      refetchEvents();
    }, [
      refetchPosts,
      refetchPlaces,
      refetchCounts,
      refetchAchievementCount,
      refetchEvents,
    ])
  );

  const [avatarError, setAvatarError] = useState(!currentUser.avatarUrl);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPosts(),
        refetchPlaces(),
        refetchCounts(),
        refetchAchievementCount(),
        refetchEvents(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchPosts,
    refetchPlaces,
    refetchCounts,
    refetchAchievementCount,
    refetchEvents,
  ]);

  const postCount = posts?.length ?? 0;
  const followerCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  const placeMap = useMemo(
    () => (allPlaces ? new Map(allPlaces.map((p) => [p.id, p])) : new Map()),
    [allPlaces]
  );

  const userPosts = useMemo(() => {
    if (!posts || !allPlaces) return [];
    return posts.map((post) => ({
      ...post,
      place: placeMap.get(post.placeId),
    }));
  }, [posts, allPlaces, placeMap]);

  const userEvents = useMemo(() => {
    if (!events || !allPlaces) return [];
    return events.map((event) => ({
      ...event,
      place: placeMap.get(event.placeId),
    }));
  }, [events, allPlaces, placeMap]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={{
        paddingBottom: insets.bottom,
      }}
    >
      <View style={styles.profileSection}>
        {avatarError ? (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={40} color={colors.textMuted} />
          </View>
        ) : (
          <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} onError={() => setAvatarError(true)} />
        )}
        <Text style={styles.displayName}>{currentUser.displayName}</Text>
        <Text style={styles.username}>@{currentUser.username}</Text>
        {currentUser.bio && <Text style={styles.bio}>{currentUser.bio}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <HapticPressable
            style={styles.stat}
            onPress={() =>
              router.push({
                pathname: "/profile/follow-list",
                params: { userId: currentUser.id, tab: "followers" },
              })
            }
          >
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </HapticPressable>
          <View style={styles.statDivider} />
          <HapticPressable
            style={styles.stat}
            onPress={() =>
              router.push({
                pathname: "/profile/follow-list",
                params: { userId: currentUser.id, tab: "following" },
              })
            }
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </HapticPressable>
        </View>

        <View style={styles.buttonRow}>
          <LiquidGlassButton
            title="Edit Profile"
            variant="secondary"
            size="medium"
            onPress={() => router.push("/profile/edit-profile")}
            style={{ flex: 1, marginRight: 10 }}
          />
          <LiquidGlassButton
            title="Find People"
            variant="primary"
            size="medium"
            onPress={() => router.push("/profile/discover")}
            style={{ flex: 1 }}
          />
        </View>

        <LiquidGlassButton
          title={`Achievements · ${achievementCount ?? 0} unlocked`}
          variant="secondary"
          size="medium"
          icon="trophy"
          onPress={() => router.push("/profile/achievements")}
          style={{ marginTop: 10 }}
        />

        {igConnected && (
          <LiquidGlassButton
            title="Import from Instagram"
            variant="secondary"
            size="medium"
            icon="logo-instagram"
            onPress={() => router.push("/profile/instagram-import")}
            style={{ marginTop: 10 }}
          />
        )}
      </View>

      <UpcomingEvents events={userEvents} />

      <View style={styles.gridDivider} />

      <PostsGrid
        posts={userPosts}
        title="Your Posts"
        onPostPress={(postId) => router.push(`/profile/post/${postId}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray200,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  username: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray200,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  gridDivider: {
    height: 1,
    paddingVertical: 8,
  },
});
