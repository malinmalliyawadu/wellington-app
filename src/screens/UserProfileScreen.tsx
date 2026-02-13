import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFollow } from "../context/FollowContext";
import { useQuery } from "../hooks/useQuery";
import { getProfileById } from "../services/users";
import { getPostsByUserId as getPostsByUserIdAsync } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getEventsByUserId } from "../services/events";
import { FollowButton } from "../components/FollowButton";
import { PostsGrid } from "../components/PostsGrid";
import { EventCard } from "../components/EventCard";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";

export function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { followingIds } = useFollow();

  const fetchUser = useCallback(() => getProfileById(userId), [userId]);
  const { data: user, loading: loadingUser } = useQuery(fetchUser);

  const fetchPosts = useCallback(() => getPostsByUserIdAsync(userId), [userId]);
  const { data: posts } = useQuery(fetchPosts);
  const { data: allPlaces } = useQuery(getPlaces);

  const fetchCounts = useCallback(() => getFollowCounts(userId), [userId]);
  const { data: counts } = useQuery(fetchCounts);

  const fetchEvents = useCallback(() => getEventsByUserId(userId), [userId]);
  const { data: events } = useQuery(fetchEvents);

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
    return events
      .map((event) => ({
        ...event,
        place: placeMap.get(event.placeId),
      }))
      .filter((e) => e.place != null);
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 60 + insets.bottom }}
    >
      <View style={styles.profileSection}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
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

      {userEvents.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScrollContent}
          >
            {userEvents.map((event) => (
              <View key={event.id} style={styles.eventCardWrapper}>
                <EventCard
                  event={event}
                  place={event.place!}
                  onPress={() => {
                    // Navigate within the current tab
                    if (tabBase === "/events") {
                      router.push(`/events/${event.id}`);
                    } else {
                      // For other tabs, switch to events tab
                      router.push(`/events/${event.id}`);
                    }
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.sectionTitle}>Posts</Text>

      <PostsGrid
        posts={userPosts}
        onPostPress={(postId) => router.push(`${tabBase}/post/${postId}`)}
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
  actionRow: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  eventsScrollContent: {},
  eventCardWrapper: {
    width: 300,
  },
});
