import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import {
  useRouter,
  useLocalSearchParams,
  usePathname,
  useFocusEffect,
  useNavigation,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "../hooks/useQuery";
import { getProfileById } from "../services/users";
import { getPostsByUserId as getPostsByUserIdAsync } from "../services/posts";
import { getPlaces } from "../services/places";
import { getFollowCounts } from "../services/follows";
import { getEventsByUserId } from "../services/events";
import { getGuidesByUserId } from "../services/guides";
import { GuideCard } from "../components/GuideCard";
import { EventCard } from "../components/EventCard";
import { FollowButton } from "../components/FollowButton";
import { PostsGrid } from "../components/PostsGrid";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "src/components/HapticPressable";
import { QueryErrorState } from "../components/QueryErrorState";
import { useAuth } from "../context/AuthContext";
import { useBlock } from "../context/BlockContext";
import { useToast } from "../context/ToastContext";
import { useReport } from "../hooks/useReport";
import { SFIcon } from "../components/SFIcon";
import { SocialLinks } from "../components/SocialLinks";
import { LevelBadge } from "../components/LevelBadge";
import { getUserPointTotals } from "../services/points";
import { formatNumber } from "../utils/formatNumber";
import { ContextMenu, Button as ExpoButton, Host } from "@expo/ui/swift-ui";

type Tab = "posts" | "events" | "guides";

export function UserProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { isBlocked, toggleBlock } = useBlock();
  const { showToast } = useToast();
  const { showReportAlert } = useReport();
  const onReportRef = useRef<(() => void) | undefined>(undefined);
  const onBlockRef = useRef<(() => void) | undefined>(undefined);
  const userBlocked = isBlocked(userId);

  const isOtherUser = profile?.id !== userId;

  useLayoutEffect(() => {
    if (!isOtherUser) return;
    navigation.setOptions({
      headerRight: () => (
        <Host matchContents>
          <ContextMenu activationMethod="singlePress">
            <ContextMenu.Trigger>
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 7,
                }}
              >
                <SFIcon
                  name="ellipsis"
                  fallback="ellipsis-horizontal"
                  size={22}
                  color={colors.text}
                />
              </View>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              <ExpoButton
                systemImage={userBlocked ? "hand.raised.slash" : "hand.raised"}
                role="destructive"
                onPress={() => onBlockRef.current?.()}
              >
                {userBlocked ? "Unblock user" : "Block user"}
              </ExpoButton>
              <ExpoButton
                systemImage="flag"
                role="destructive"
                onPress={() => onReportRef.current?.()}
              >
                Report user
              </ExpoButton>
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isOtherUser, userBlocked]);

  const [activeTab, setActiveTab] = useState<Tab>("posts");
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
  const {
    data: user,
    loading: loadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery(fetchUser, ["user", userId]);

  const fetchPosts = useCallback(() => getPostsByUserIdAsync(userId), [userId]);
  const { data: posts, refetch: refetchPosts } = useQuery(fetchPosts, [
    "posts",
    "user",
    userId,
  ]);
  const { data: allPlaces, refetch: refetchPlaces } = useQuery(
    getPlaces,
    "places"
  );

  const fetchCounts = useCallback(() => getFollowCounts(userId), [userId]);
  const { data: counts, refetch: refetchCounts } = useQuery(fetchCounts, [
    "follow-counts",
    userId,
  ]);

  const fetchEvents = useCallback(() => getEventsByUserId(userId), [userId]);
  const { data: events, refetch: refetchEvents } = useQuery(fetchEvents, [
    "events",
    "user",
    userId,
  ]);

  const fetchGuides = useCallback(() => getGuidesByUserId(userId), [userId]);
  const { data: guides, refetch: refetchGuides } = useQuery(fetchGuides, [
    "guides",
    "user",
    userId,
  ]);

  const fetchPointTotals = useCallback(() => getUserPointTotals(userId), [userId]);
  const { data: userPointTotals } = useQuery(fetchPointTotals, [
    "point-totals",
    userId,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUser(),
      refetchPosts(),
      refetchPlaces(),
      refetchCounts(),
      refetchEvents(),
      refetchGuides(),
    ]);
    setRefreshing(false);
  }, [
    refetchUser,
    refetchPosts,
    refetchPlaces,
    refetchCounts,
    refetchEvents,
    refetchGuides,
  ]);

  useFocusEffect(
    useCallback(() => {
      refetchUser();
      refetchPosts();
      refetchCounts();
    }, [refetchUser, refetchPosts, refetchCounts])
  );

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

  if (userError && !user) {
    return <QueryErrorState message={userError} onRetry={refetchUser} />;
  }

  if (!user) return null;

  onReportRef.current = () => {
    showReportAlert({
      contentType: "user",
      contentId: undefined,
      reportedUserId: userId,
    });
  };

  onBlockRef.current = () => {
    if (userBlocked) {
      toggleBlock(userId);
      showToast({ message: `@${user.username} unblocked` });
    } else {
      Alert.alert(
        "Block user",
        `Block @${user.username}? They won't be able to see your profile or content, and you won't see theirs.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            style: "destructive",
            onPress: () => {
              toggleBlock(userId);
              showToast({ message: `@${user.username} blocked` });
            },
          },
        ]
      );
    }
  };

  const postCount = userPosts.length;
  const followerCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "posts", label: "Posts", count: postCount },
    { key: "events", label: "Events", count: userEvents.length },
    { key: "guides", label: "Guides", count: guides?.length ?? 0 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <PostsGrid
            posts={userPosts}
            title="Posts"
            onPostPress={(postId) => router.push(`${tabBase}/post/${postId}`)}
            emptyText="No posts yet"
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
                    router.push(`${tabBase}/event/${event.id}` as any)
                  }
                />
              );
            })}
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
            </View>
          );
        }
        return (
          <View style={styles.guidesList}>
            {guides.map((guide) => (
              <View key={guide.id} style={styles.guideCardWrapper}>
                <GuideCard
                  guide={guide}
                  onPress={() => router.push(`${tabBase}/guide/${guide.id}`)}
                />
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: 60 + insets.bottom,
        }}
      >
        {/* Compact header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Pressable onPress={showAvatar}>
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
            <View style={styles.identityColumn}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {user.displayName}
                </Text>
                {userPointTotals && (
                  <LevelBadge level={userPointTotals.level} totalPoints={userPointTotals.totalPoints} size="small" />
                )}
              </View>
              <Text style={styles.username} numberOfLines={1}>
                @{user.username}
              </Text>
              <View style={styles.inlineStats}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>
                    {formatNumber(postCount)}
                  </Text>{" "}
                  posts
                </Text>
                <Text style={styles.statDot}>·</Text>
                <HapticPressable
                  onPress={() =>
                    router.push({
                      pathname: `${tabBase}/follow-list`,
                      params: { userId, tab: "followers" },
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
                      pathname: `${tabBase}/follow-list`,
                      params: { userId, tab: "following" },
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

          {userBlocked ? (
            <View style={styles.blockedBanner}>
              <SFIcon
                name="hand.raised.fill"
                fallback="hand-left"
                size={20}
                color={colors.textMuted}
              />
              <Text style={styles.blockedText}>
                You have blocked @{user.username}
              </Text>
              <HapticPressable
                onPress={() => {
                  toggleBlock(userId);
                  showToast({ message: `@${user.username} unblocked` });
                }}
              >
                <Text style={styles.unblockLink}>Unblock</Text>
              </HapticPressable>
            </View>
          ) : (
            <>
              {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

              <SocialLinks
                instagramUsername={user.instagramUsername}
                tiktokUsername={user.tiktokUsername}
                xUsername={user.xUsername}
              />

              {/* Action row */}
              <View style={styles.actionRow}>
                <FollowButton userId={userId} />
              </View>
            </>
          )}
        </View>

        {!userBlocked && (
          <>
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
          </>
        )}
      </ScrollView>

      {avatarVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.avatarModalBackdrop,
            { opacity: avatarAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={hideAvatar}>
            <View style={styles.avatarFullscreenContainer}>
              <Animated.Image
                source={{ uri: user.avatarUrl }}
                style={[
                  styles.avatarFullscreen,
                  {
                    transform: [
                      {
                        scale: avatarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
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
    // Blocked state
    blockedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.gray100,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blockedText: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
    unblockLink: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Action row
    actionRow: {
      marginTop: 14,
    },
    // Tab bar
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
    // Avatar fullscreen modal
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
