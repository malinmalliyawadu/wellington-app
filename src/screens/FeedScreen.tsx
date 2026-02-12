import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { FeedPost } from "../components/FeedPost";
import { useFollow } from "../context/FollowContext";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { getFeedPosts } from "../services/posts";
import { getProfilesByIds } from "../services/users";
import { getPlaces } from "../services/places";
import { HapticPressable } from "src/components/HapticPressable";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingIds } = useFollow();
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchFeedPosts = useCallback(
    () => getFeedPosts(followingIds),
    [followingIds]
  );
  const {
    data: feedPosts,
    loading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery(fetchFeedPosts, followingIds);
  const [refreshing, setRefreshing] = useState(false);

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
    return feedPosts
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

  const headerHeight = insets.top + 84; // insets.top + header padding + title height

  // Animate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0.95, 0.95],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Animated.FlatList
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
          paddingTop: headerHeight - 60,
          paddingBottom: insets.bottom + 40,
          flexGrow: 1,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
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

      <Animated.View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top,
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint="regular"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "transparent",
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Feed</Text>
              <Text style={styles.subtitle}>From people you follow</Text>
            </View>
            <HapticPressable
              style={styles.headerButton}
              onPress={() => router.push("/feed/discover")}
            >
              <Ionicons name="people-outline" size={20} color={colors.text} />
            </HapticPressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
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
