import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, usePathname, useNavigation, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useQuery } from "../hooks/useQuery";
import { getProfileById, getProfilesByIds } from "../services/users";
import { getFollowerIds, getFollowingIds } from "../services/follows";
import { HapticPressable } from "src/components/HapticPressable";

export function FollowListScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const navigation = useNavigation();
  const { userId, tab: initialTab } = useLocalSearchParams<{
    userId: string;
    tab: "followers" | "following";
  }>();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    initialTab
  );
  const { profile } = useAuth();

  const fetchUser = useCallback(() => getProfileById(userId), [userId]);
  const { data: user } = useQuery(fetchUser, ['user', userId]);

  // Update header title when user data loads
  useEffect(() => {
    if (user) {
      const isCurrentUser = user.id === profile?.id;
      navigation.setOptions({
        headerTitle: isCurrentUser ? "You" : user.displayName,
      });
    }
  }, [user, profile?.id, navigation]);

  // Fetch following IDs for this user
  const fetchFollowingIds = useCallback(
    () => getFollowingIds(userId),
    [userId]
  );
  const { data: followingUserIds, loading: loadingFollowingIds, refetch: refetchFollowingIds } =
    useQuery(fetchFollowingIds, ['following', userId]);

  // Fetch follower IDs for this user
  const fetchFollowerIds = useCallback(() => getFollowerIds(userId), [userId]);
  const { data: followerUserIds, loading: loadingFollowerIds, refetch: refetchFollowerIds } =
    useQuery(fetchFollowerIds, ['followers', userId]);

  // Fetch following profiles
  const fetchFollowing = useCallback(
    () => getProfilesByIds(followingUserIds ?? []),
    [followingUserIds]
  );
  const { data: followingList, loading: loadingFollowingProfiles } = useQuery(
    fetchFollowing,
    followingUserIds && followingUserIds.length > 0
  );

  // Fetch follower profiles
  const fetchFollowers = useCallback(
    () => getProfilesByIds(followerUserIds ?? []),
    [followerUserIds]
  );
  const { data: followerList, loading: loadingFollowerProfiles } = useQuery(
    fetchFollowers,
    followerUserIds && followerUserIds.length > 0
  );

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchFollowingIds();
      refetchFollowerIds();
    }, [refetchFollowingIds, refetchFollowerIds])
  );

  const listData =
    activeTab === "following" ? followingList ?? [] : followerList ?? [];

  const isLoading =
    activeTab === "following"
      ? loadingFollowingIds || loadingFollowingProfiles
      : loadingFollowerIds || loadingFollowerProfiles;

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.tabBar}>
        <HapticPressable
          style={[styles.tab, activeTab === "followers" && styles.activeTab]}
          onPress={() => setActiveTab("followers")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "followers" && styles.activeTabText,
            ]}
          >
            Followers
          </Text>
        </HapticPressable>
        <HapticPressable
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => setActiveTab("following")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "following" && styles.activeTabText,
            ]}
          >
            Following
          </Text>
        </HapticPressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item!.id}
          renderItem={({ item }) => {
            if (!item) return null;
            const isCurrentUser = item.id === profile?.id;
            return (
              <HapticPressable
                style={styles.userRow}
                onPress={() => {
                  if (!isCurrentUser) {
                    router.push(`${tabBase}/user/${item.id}`);
                  }
                }}
              >
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} />
                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>{item.displayName}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
                {!isCurrentUser && <FollowButton userId={item.id} compact />}
              </HapticPressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === "following"
                  ? "Not following anyone yet"
                  : "No followers yet"}
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 8 + insets.bottom },
          ]}
        />
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "center",
    paddingVertical: 4,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  list: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gray200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  displayName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
