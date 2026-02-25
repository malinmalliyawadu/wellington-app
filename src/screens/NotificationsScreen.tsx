import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNotifications } from "../context/NotificationContext";
import { getProfilesByIds } from "../services/users";
import { getPostsByIds } from "../services/posts";
import { getEventsByIds } from "../services/events";
import { useQuery } from "../hooks/useQuery";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { QueryErrorState } from "../components/QueryErrorState";
import { fonts } from "../theme/fonts";
import type { Notification } from "../services/notifications";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMins > 0) return `${diffMins}m`;
  return "now";
}

export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAll,
    refetch,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {unreadCount > 0 && notifications.length > 0 && (
            <HapticPressable
              onPress={markAllAsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ padding: 6 }}
            >
              <SFIcon
                name="checkmark.circle"
                fallback="checkmark-circle-outline"
                size={22}
                color={colors.primary}
              />
            </HapticPressable>
          )}
          {notifications.length > 0 && (
            <HapticPressable
              onPress={() =>
                Alert.alert(
                  "Delete all notifications?",
                  "This cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: deleteAll,
                    },
                  ]
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ padding: 6 }}
            >
              <SFIcon
                name="trash"
                fallback="trash-outline"
                size={20}
                color={colors.error}
              />
            </HapticPressable>
          )}
          <HapticPressable
            onPress={() =>
              router.push("/profile/notification-preferences" as any)
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 6 }}
          >
            <SFIcon
              name="gearshape"
              fallback="settings-outline"
              size={20}
              color={colors.text}
            />
          </HapticPressable>
        </View>
      ),
    });
  }, [
    navigation,
    notifications.length,
    unreadCount,
    markAllAsRead,
    deleteAll,
    router,
  ]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const actorIds = useMemo(
    () => [...new Set(notifications.map((n) => n.actorId))],
    [notifications]
  );
  const postIds = useMemo(
    () => [
      ...new Set(
        notifications
          .map((n) => n.postId)
          .filter((id): id is string => id !== null)
      ),
    ],
    [notifications]
  );
  const eventIds = useMemo(
    () => [
      ...new Set(
        notifications
          .map((n) => n.eventId)
          .filter((id): id is string => id !== null)
      ),
    ],
    [notifications]
  );

  const fetchActors = useCallback(() => getProfilesByIds(actorIds), [actorIds]);
  const {
    data: actors,
    loading,
    error: actorsError,
  } = useQuery(fetchActors, actorIds);

  const fetchPosts = useCallback(() => getPostsByIds(postIds), [postIds]);
  const { data: posts } = useQuery(fetchPosts, postIds);

  const fetchEvents = useCallback(() => getEventsByIds(eventIds), [eventIds]);
  const { data: events } = useQuery(fetchEvents, eventIds);

  const actorMap = useMemo(
    () => new Map((actors ?? []).map((u) => [u.id, u])),
    [actors]
  );
  const postMap = useMemo(
    () => new Map((posts ?? []).map((p) => [p.id, p])),
    [posts]
  );
  const eventMap = useMemo(
    () => new Map((events ?? []).map((e) => [e.id, e])),
    [events]
  );

  const handlePress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      if (notification.type === "follow") {
        router.push(`/profile/user/${notification.actorId}` as any);
      } else if (
        notification.type === "event_attendance" &&
        notification.eventId
      ) {
        router.push(`/events/${notification.eventId}` as any);
      } else if (notification.postId) {
        router.push(`/profile/post/${notification.postId}` as any);
      }
    },
    [markAsRead, router]
  );

  const ACTION_TEXT: Record<string, string> = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
    guide_like: "liked your guide",
    guide_comment: "commented on your guide",
    event_attendance: "is going to your event",
    event_reminder: "Event starting soon",
    comment_reply: "replied to your comment",
  };

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => {
      const actor = actorMap.get(item.actorId);
      const post = item.postId ? postMap.get(item.postId) : null;
      const event = item.eventId ? eventMap.get(item.eventId) : null;
      const actionText = ACTION_TEXT[item.type] ?? "sent you a notification";
      const thumbnail = event?.imageUrl ?? post?.thumbnailUrl ?? post?.mediaUrl;
      const showThumbnail = item.type !== "follow";

      return (
        <HapticPressable
          style={[styles.notificationRow, !item.read && styles.unreadRow]}
          onPress={() => handlePress(item)}
        >
          <Image
            source={{ uri: actor?.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText} numberOfLines={2}>
              <Text style={styles.actorName}>
                {actor?.displayName ?? "Someone"}
              </Text>{" "}
              {actionText}
            </Text>
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
          {showThumbnail &&
            (thumbnail ? (
              <Image
                source={{ uri: thumbnail }}
                style={styles.postThumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[styles.postThumbnail, styles.postThumbnailPlaceholder]}
              >
                <SFIcon
                  name="text.alignleft"
                  fallback="reader-outline"
                  size={16}
                  color={colors.gray400}
                />
              </View>
            ))}
        </HapticPressable>
      );
    },
    [actorMap, postMap, eventMap, handlePress]
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  if (actorsError && notifications.length === 0) {
    return <QueryErrorState message={actorsError} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 60,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SFIcon
              name="bell.slash"
              fallback="notifications-off-outline"
              size={48}
              color={colors.gray300}
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes, comments, or attends your events, you&apos;ll
              see it here.
            </Text>
          </View>
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.gray200,
      gap: 10,
    },
    unreadRow: {
      backgroundColor: colors.gray100,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.gray200,
    },
    notificationContent: {
      flex: 1,
    },
    notificationText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    actorName: {
      fontFamily: fonts.semiBold,
    },
    timeText: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    postThumbnail: {
      width: 44,
      height: 44,
      borderRadius: 6,
      backgroundColor: colors.gray200,
    },
    postThumbnailPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },
  });
