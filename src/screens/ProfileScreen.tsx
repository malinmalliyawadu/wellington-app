import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFollow } from "../context/FollowContext";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../services/auth";
import { useQuery } from "../hooks/useQuery";
import { getPostsByUserId } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getUnlockedAchievementCount } from "../services/achievements";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { PostsGrid } from "../components/PostsGrid";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { profile } = useAuth();

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
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts);
  const { data: allPlaces, refetch: refetchPlaces } = useQuery(getPlaces);
  const fetchCounts = useCallback(
    () => getFollowCounts(currentUser.id),
    [currentUser.id]
  );
  const { data: counts, refetch: refetchCounts } = useQuery(fetchCounts);
  const fetchAchievementCount = useCallback(
    () => getUnlockedAchievementCount(currentUser.id),
    [currentUser.id]
  );
  const { data: achievementCount, refetch: refetchAchievementCount } = useQuery(fetchAchievementCount);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchPlaces();
      refetchCounts();
      refetchAchievementCount();
    }, [refetchPosts, refetchPlaces, refetchCounts, refetchAchievementCount])
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refetchPosts();
    refetchPlaces();
    refetchCounts();
    refetchAchievementCount();
    // Give a small delay to ensure queries complete
    setTimeout(() => setRefreshing(false), 1000);
  }, [refetchPosts, refetchPlaces, refetchCounts, refetchAchievementCount]);

  const postCount = posts?.length ?? 0;
  const followerCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  const userPosts = useMemo(() => {
    if (!posts || !allPlaces) return [];
    const placeMap = new Map(allPlaces.map((p) => [p.id, p]));
    return posts.map((post) => ({
      ...post,
      place: placeMap.get(post.placeId),
    }));
  }, [posts, allPlaces]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <HapticPressable
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign Out",
                style: "destructive",
                onPress: () => signOut(),
              },
            ])
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
        </HapticPressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
      >
        <View style={styles.profileSection}>
          <Image
            source={{ uri: currentUser.avatarUrl }}
            style={styles.avatar}
          />
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
            onPress={() => router.push('/profile/achievements')}
            style={{ marginTop: 10 }}
          />
        </View>

        <Text style={styles.sectionTitle}>Your Posts</Text>

        <PostsGrid
          posts={userPosts}
          onPostPress={(postId) => router.push(`/profile/post/${postId}`)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSpacer: {
    width: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  logoutButton: {
    padding: 2,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.gray200,
    marginBottom: 12,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
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
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
});
