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
import { useAuth } from "../context/AuthContext";
import { useQuery } from "../hooks/useQuery";
import { getPostsByUserId } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getEventsByUserId } from "../services/events";
import { getGuidesByUserId } from "../services/guides";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { PostsGrid } from "../components/PostsGrid";
import { EventCard } from "../components/EventCard";
import { GuideCard } from "../components/GuideCard";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useInstagramConnection } from "../hooks/useInstagramConnection";
import { HapticPressable } from "src/components/HapticPressable";
import { QueryErrorState } from "../components/QueryErrorState";
import { SFIcon } from "../components/SFIcon";
import { SocialLinks } from "../components/SocialLinks";
import { LevelBadge } from "../components/LevelBadge";
import { usePoints } from "../context/PointsContext";
import { formatNumber } from "../utils/formatNumber";

type Tab = "posts" | "events" | "guides";

export function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const { isConnected: igConnected } = useInstagramConnection();
  const { level, totalPoints } = usePoints();

  const [activeTab, setActiveTab] = useState<Tab>("posts");

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
  const {
    data: posts,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery(fetchPosts, ["posts", "user", currentUser.id]);

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

  const fetchEvents = useCallback(
    () => getEventsByUserId(currentUser.id),
    [currentUser.id]
  );
  const { data: events, refetch: refetchEvents } = useQuery(fetchEvents, [
    "events",
    "user",
    currentUser.id,
  ]);

  const fetchGuides = useCallback(
    () => getGuidesByUserId(currentUser.id),
    [currentUser.id]
  );
  const { data: guides, refetch: refetchGuides } = useQuery(fetchGuides, [
    "guides",
    "user",
    currentUser.id,
  ]);

  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchPlaces();
      refetchCounts();
      refetchEvents();
      refetchGuides();
    }, [
      refetchPosts,
      refetchPlaces,
      refetchCounts,
      refetchEvents,
      refetchGuides,
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
        refetchEvents(),
        refetchGuides(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchPosts,
    refetchPlaces,
    refetchCounts,
    refetchEvents,
    refetchGuides,
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

  const styles = createStyles(colors);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "posts", label: "Posts", count: postCount },
    { key: "events", label: "Events", count: userEvents.length },
    { key: "guides", label: "Guides", count: guides?.length ?? 0 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "posts":
        if (postsError && !posts) {
          return (
            <QueryErrorState
              message={postsError}
              onRetry={refetchPosts}
              fullScreen={false}
            />
          );
        }
        return (
          <PostsGrid
            posts={userPosts}
            onPostPress={(postId) => router.push(`/profile/post/${postId}`)}
            emptyText="No posts yet"
            onCreatePress={() => router.push("/profile/create-post")}
          />
        );

      case "events":
        if (!userEvents || userEvents.length === 0) {
          return (
            <View style={styles.emptyState}>
              <SFIcon
                name="calendar"
                fallback="calendar-outline"
                size={40}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No events yet</Text>
              <LiquidGlassButton
                title="Create Event"
                icon="add"
                variant="primary"
                size="small"
                onPress={() => router.push("/profile/create-post")}
              />
            </View>
          );
        }
        return (
          <View style={styles.eventsList}>
            {userEvents.map((event) => {
              if (!event.place) return null;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  place={event.place}
                  onPress={() =>
                    router.push(`/profile/event/${event.id}` as any)
                  }
                />
              );
            })}
            <HapticPressable
              style={styles.createCell}
              onPress={() => router.push("/profile/create-post")}
            >
              <Ionicons name="add" size={22} color={colors.textMuted} />
              <Text style={styles.createCellText}>Create Event</Text>
            </HapticPressable>
          </View>
        );

      case "guides":
        if (!guides || guides.length === 0) {
          return (
            <View style={styles.emptyState}>
              <SFIcon
                name="book"
                fallback="book-outline"
                size={40}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No guides yet</Text>
              <LiquidGlassButton
                title="Create Guide"
                icon="add"
                variant="primary"
                size="small"
                onPress={() => router.push("/profile/create-guide")}
              />
            </View>
          );
        }
        return (
          <View style={styles.guidesList}>
            {guides.map((guide) => (
              <View key={guide.id} style={styles.guideCardWrapper}>
                <GuideCard
                  guide={guide}
                  onPress={() => router.push(`/profile/guide/${guide.id}`)}
                />
              </View>
            ))}
            <HapticPressable
              style={styles.createCell}
              onPress={() => router.push("/profile/create-guide")}
            >
              <Ionicons name="add" size={22} color={colors.textMuted} />
              <Text style={styles.createCellText}>Create Guide</Text>
            </HapticPressable>
          </View>
        );
    }
  };

  return (
    <ScrollView
      testID="profile-screen"
      style={styles.container}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={{
        paddingBottom: insets.bottom + 60,
      }}
    >
      {/* Compact header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          {avatarError ? (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={28} color={colors.textMuted} />
            </View>
          ) : (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              onError={() => setAvatarError(true)}
            />
          )}
          <View style={styles.identityColumn}>
            <View style={styles.nameRow}>
              <Text
                testID="profile-display-name"
                style={styles.displayName}
                numberOfLines={1}
              >
                {currentUser.displayName}
              </Text>
              <LevelBadge level={level} totalPoints={totalPoints} size="small" />
            </View>
            <Text
              testID="profile-username"
              style={styles.username}
              numberOfLines={1}
            >
              @{currentUser.username}
            </Text>
            <View testID="profile-stats" style={styles.inlineStats}>
              <Text style={styles.statText}>
                <Text style={styles.statNumber}>{formatNumber(postCount)}</Text>{" "}
                posts
              </Text>
              <Text style={styles.statDot}>·</Text>
              <HapticPressable
                onPress={() =>
                  router.push({
                    pathname: "/profile/follow-list",
                    params: { userId: currentUser.id, tab: "followers" },
                  })
                }
              >
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>
                    {formatNumber(followerCount)}
                  </Text>{" "}
                  followers
                </Text>
              </HapticPressable>
              <Text style={styles.statDot}>·</Text>
              <HapticPressable
                onPress={() =>
                  router.push({
                    pathname: "/profile/follow-list",
                    params: { userId: currentUser.id, tab: "following" },
                  })
                }
              >
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>
                    {formatNumber(followingCount)}
                  </Text>{" "}
                  following
                </Text>
              </HapticPressable>
            </View>
          </View>
        </View>

        {currentUser.bio ? (
          <Text style={styles.bio}>{currentUser.bio}</Text>
        ) : null}

        <SocialLinks
          instagramUsername={currentUser.instagramUsername}
          tiktokUsername={currentUser.tiktokUsername}
          xUsername={currentUser.xUsername}
        />

        {/* Action row */}
        <View style={styles.actionRow}>
          <LiquidGlassButton
            title="Edit Profile"
            variant="secondary"
            size="small"
            onPress={() => router.push("/profile/edit-profile")}
            style={styles.editButton}
          />
          <LiquidGlassButton
            icon="trophy"
            iconOnly
            variant="secondary"
            size="small"
            onPress={() => router.push("/profile/achievements")}
          />
          <LiquidGlassButton
            icon="bookmark"
            iconOnly
            variant="secondary"
            size="small"
            onPress={() => router.push("/profile/saved")}
          />
          {igConnected && (
            <LiquidGlassButton
              icon="logo-instagram"
              iconOnly
              variant="secondary"
              size="small"
              onPress={() => router.push("/profile/instagram-import")}
            />
          )}
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {tabs.map((tab) => (
          <HapticPressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.tabCount,
                activeTab === tab.key && styles.tabCountActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === tab.key && styles.tabCountTextActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </HapticPressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      {renderContent()}
    </ScrollView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Header
    headerSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.gray200,
    },
    avatarFallback: {
      justifyContent: "center",
      alignItems: "center",
    },
    identityColumn: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    displayName: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      flexShrink: 1,
    },
    username: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 1,
    },
    inlineStats: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      gap: 4,
      flexWrap: "wrap",
    },
    statText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
    },
    statNumber: {
      fontFamily: fonts.bold,
      color: colors.text,
    },
    statDot: {
      fontSize: 13,
      color: colors.textMuted,
    },
    bio: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 10,
      lineHeight: 20,
    },
    // Action row
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
    },
    editButton: {
      flex: 1,
    },
    // Tab bar (matches SavedScreen)
    tabBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.gray100,
      gap: 6,
    },
    tabActive: {
      backgroundColor: colors.text,
    },
    tabText: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.background,
    },
    tabCount: {
      backgroundColor: colors.gray200,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    tabCountActive: {
      backgroundColor: colors.overlay,
    },
    tabCountText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: colors.textMuted,
    },
    tabCountTextActive: {
      color: colors.background,
    },
    // Create cell
    createCell: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray200,
      borderStyle: "dashed",
    },
    createCellText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    // Events list
    eventsList: {
      gap: 12,
    },
    // Guides list
    guidesList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    guideCardWrapper: {
      borderRadius: 12,
      overflow: "hidden",
    },
    // Empty state
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
  });
