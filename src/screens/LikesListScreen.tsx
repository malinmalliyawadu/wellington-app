import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, usePathname, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import { fonts } from "../theme/fonts";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useQuery } from "../hooks/useQuery";
import { getProfilesByIds } from "../services/users";
import { getLikerIds } from "../services/likes";
import { HapticPressable } from "src/components/HapticPressable";
import { QueryErrorState } from "../components/QueryErrorState";

export function LikesListScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const fetchLikerIds = useCallback(() => getLikerIds(postId), [postId]);
  const { data: likerIds, loading: loadingIds, error: likesError, refetch: refetchLikerIds } = useQuery(fetchLikerIds, ['likes', postId]);

  const fetchProfiles = useCallback(
    () => getProfilesByIds(likerIds ?? []),
    [likerIds]
  );
  const { data: likers, loading: loadingProfiles } = useQuery(
    fetchProfiles,
    likerIds && likerIds.length > 0
  );

  const isLoading = loadingIds || loadingProfiles;

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchLikerIds();
    }, [refetchLikerIds])
  );

  if (likesError && !likerIds) {
    return <QueryErrorState message={likesError} onRetry={refetchLikerIds} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header} collapsable={false}>
        <Text style={styles.headerTitle}>Likes</Text>
      </View>

      <FlatList
        data={isLoading ? [] : (likers ?? [])}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentUser = item.id === profile?.id;
          return (
            <HapticPressable
              style={styles.userRow}
              onPress={() => {
                if (!isCurrentUser) {
                  router.dismiss();
                  router.push(`${tabBase}/user/${item.id}` as any);
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
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No likes yet</Text>
            </View>
          )
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 8 + insets.bottom },
        ]}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  list: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    alignItems: "center",
    paddingTop: 40,
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
