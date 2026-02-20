import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "../hooks/useQuery";
import { getProfileById } from "../services/users";
import { getPostsByUserId as getPostsByUserIdAsync } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getEventsByUserId } from "../services/events";
import { FollowButton } from "../components/FollowButton";
import { PostsGrid } from "../components/PostsGrid";
import { UpcomingEvents } from "../components/UpcomingEvents";
import { fonts } from "../theme/fonts";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";

export function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [refreshing, setRefreshing] = useState(false);
  const [avatarVisible, setAvatarVisible] = useState(false);
  const avatarAnim = useRef(new Animated.Value(0)).current;

  const showAvatar = useCallback(() => {
    setAvatarVisible(true);
    Animated.timing(avatarAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [avatarAnim]);

  const hideAvatar = useCallback(() => {
    Animated.timing(avatarAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setAvatarVisible(false));
  }, [avatarAnim]);

  const fetchUser = useCallback(() => getProfileById(userId), [userId]);
  const { data: user, loading: loadingUser, refetch: refetchUser } = useQuery(fetchUser, ['user', userId]);

  const fetchPosts = useCallback(() => getPostsByUserIdAsync(userId), [userId]);
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts, ['posts', 'user', userId]);
  const { data: allPlaces, refetch: refetchPlaces } = useQuery(getPlaces, 'places');

  const fetchCounts = useCallback(() => getFollowCounts(userId), [userId]);
  const { data: counts, refetch: refetchCounts } = useQuery(fetchCounts, ['follow-counts', userId]);

  const fetchEvents = useCallback(() => getEventsByUserId(userId), [userId]);
  const { data: events, refetch: refetchEvents } = useQuery(fetchEvents, ['events', 'user', userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchPosts(), refetchPlaces(), refetchCounts(), refetchEvents()]);
    setRefreshing(false);
  }, [refetchUser, refetchPosts, refetchPlaces, refetchCounts, refetchEvents]);

  const userPosts = useMemo(() => {
    if (!posts || !allPlaces) return [];
    const placeMap = new Map(allPlaces.map((p) => [p.id, p]));
    return posts.map((post) => ({
      ...post,
      place: placeMap.get(post.placeId),
    }));
  }, [posts, allPlaces]);

  const userEvents = useMemo(() => {
    if (!events || !allPlaces) return [];
    const placeMap = new Map(allPlaces.map((p) => [p.id, p]));
    return events.map((event) => ({
      ...event,
      place: placeMap.get(event.placeId),
    }));
  }, [events, allPlaces]);

  if (loadingUser) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  const followerCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  return (
    <>
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentInset={{ top: headerHeight - 30 }}
      contentOffset={{ x: 0, y: -(headerHeight - 30) }}
      contentContainerStyle={{
        paddingBottom: 60 + insets.bottom,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.profileSection}>
        <Pressable onPress={showAvatar}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} />
        </Pressable>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <HapticPressable
            style={styles.stat}
            onPress={() =>
              router.push({
                pathname: `${tabBase}/follow-list`,
                params: { userId, tab: "followers" },
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
                pathname: `${tabBase}/follow-list`,
                params: { userId, tab: "following" },
              })
            }
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </HapticPressable>
        </View>

        <View style={styles.actionRow}>
          <FollowButton userId={userId} />
        </View>
      </View>

      <UpcomingEvents events={userEvents} />

      <View style={styles.gridDivider} />

      <PostsGrid
        posts={userPosts}
        title="Posts"
        onPostPress={(postId) => router.push(`${tabBase}/post/${postId}`)}
      />
    </ScrollView>

      {avatarVisible && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.avatarModalBackdrop, { opacity: avatarAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={hideAvatar}>
            <View style={styles.avatarFullscreenContainer}>
              <Animated.Image
                source={{ uri: user.avatarUrl }}
                style={[
                  styles.avatarFullscreen,
                  { transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] },
                ]}
                resizeMode="contain"
              />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </>
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
  actionRow: {
    marginTop: 20,
  },
  gridDivider: {
    height: 1,
    // backgroundColor: colors.gray200,
    marginTop: 8,
  },
  avatarModalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 100,
  },
  avatarFullscreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFullscreen: {
    width: "85%",
    aspectRatio: 1,
  },
});
