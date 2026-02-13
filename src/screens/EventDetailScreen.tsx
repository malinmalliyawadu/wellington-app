import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  getEventById,
  getEventAttendees,
  toggleAttendance,
} from "../services/events";
import { getPlaceById } from "../services/places";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { useFollow } from "../context/FollowContext";
import { addToCalendar } from "../utils/addToCalendar";
import { colors } from "../theme/colors";
import type { Event } from "../types";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";

const CATEGORY_COLORS: Record<Event["category"], string> = {
  music: "#7209B7",
  comedy: "#F72585",
  art: "#4361EE",
  food: "#E85D04",
  market: "#2D6A4F",
  community: "#0077B6",
};

const CATEGORY_LABELS: Record<Event["category"], string> = {
  music: "Music",
  comedy: "Comedy",
  art: "Art",
  food: "Food & Drink",
  market: "Market",
  community: "Community",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-NZ", options);
}

function formatTime(time: string, endTime?: string): string {
  const formatSingleTime = (t: string) => {
    const [hours, minutes] = t.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12}${minutes !== "00" ? `:${minutes}` : ""}${suffix}`;
  };

  if (endTime) {
    return `${formatSingleTime(time)} - ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(time);
}

export function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { session } = useAuth();
  const { followingIds } = useFollow();
  const [togglingAttendance, setTogglingAttendance] = useState(false);

  const fetchEvent = useCallback(() => getEventById(eventId), [eventId]);
  const { data: event, loading } = useQuery(fetchEvent);

  const fetchPlace = useCallback(
    () => (event ? getPlaceById(event.placeId) : Promise.resolve(null)),
    [event?.placeId]
  );
  const { data: place } = useQuery(fetchPlace, event?.placeId);

  const fetchAttendeeIds = useCallback(
    () => (event ? getEventAttendees(event.id) : Promise.resolve([])),
    [event?.id]
  );
  const { data: attendeeIds, refetch: refetchAttendees } = useQuery(
    fetchAttendeeIds,
    event?.id
  );

  const allAttendeeIds = attendeeIds ?? [];

  const fetchAttendeeProfiles = useCallback(
    () => getProfilesByIds(allAttendeeIds),
    [allAttendeeIds]
  );
  const { data: attendeeProfiles } = useQuery(
    fetchAttendeeProfiles,
    allAttendeeIds
  );

  const profileMap = useMemo(
    () => new Map((attendeeProfiles ?? []).map((u) => [u.id, u])),
    [attendeeProfiles]
  );

  if (loading) {
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

  if (!event) return null;

  const currentUserId = session?.user?.id;
  const isGoing = currentUserId
    ? allAttendeeIds.includes(currentUserId)
    : false;
  const categoryColor = CATEGORY_COLORS[event.category];

  const sortedAttendees = [...allAttendeeIds]
    .sort((a, b) => {
      const aFollowed = followingIds.includes(a);
      const bFollowed = followingIds.includes(b);
      if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
      return 0;
    })
    .map((id) => ({
      user: profileMap.get(id),
      isFollowed: followingIds.includes(id),
    }))
    .filter((item) => item.user != null);

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedAttendees}
        keyExtractor={(item) => item.user!.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: insets.bottom + 60,
        }}
        ListHeaderComponent={
          <>
            {event.imageUrl && (
              <Image
                source={{ uri: event.imageUrl }}
                style={styles.heroImage}
              />
            )}
            <View style={styles.infoSection}>
              <View style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryText}>
                    {CATEGORY_LABELS[event.category]}
                  </Text>
                </View>
                <HapticPressable
                  onPress={() => {
                    const placeName = place?.name ?? "Wellington";
                    Share.share({
                      message: `${event.title} — ${formatDate(
                        event.date
                      )} at ${placeName}\n${event.description}`,
                    });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="share-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </HapticPressable>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.detailText}>{formatDate(event.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.detailText}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              </View>
              {place && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <View>
                    <Text style={styles.detailText}>{place.name}</Text>
                    <Text style={styles.addressText}>{place.address}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>

            {currentUserId && (
              <View style={styles.goingButtonContainer}>
                <LiquidGlassButton
                  title="I'm going"
                  icon={
                    isGoing ? "checkmark-circle" : "checkmark-circle-outline"
                  }
                  variant={isGoing ? "primary" : "secondary"}
                  fullWidth
                  loading={togglingAttendance}
                  onPress={async () => {
                    setTogglingAttendance(true);
                    try {
                      await toggleAttendance(event.id, currentUserId);
                      refetchAttendees();
                    } catch {
                      Alert.alert(
                        "Error",
                        "Could not update attendance. Please try again."
                      );
                    } finally {
                      setTogglingAttendance(false);
                    }
                  }}
                />
              </View>
            )}

            <View style={styles.actionButtons}>
              <LiquidGlassButton
                title="Add to Calendar"
                icon="calendar-outline"
                variant="secondary"
                size="medium"
                style={styles.calendarButton}
                onPress={async () => {
                  const success = await addToCalendar({
                    title: event.title,
                    date: event.date,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    location: place?.name,
                    notes: event.description,
                  });
                  if (success) {
                    Alert.alert(
                      "Added to Calendar",
                      `"${event.title}" has been added to your calendar.`
                    );
                  }
                }}
              />
              {event.ticketUrl && (
                <LiquidGlassButton
                  title="Get Tickets"
                  icon="ticket-outline"
                  size="medium"
                  style={styles.ticketButton}
                  onPress={() => {
                    WebBrowser.openBrowserAsync(event.ticketUrl!);
                  }}
                />
              )}
            </View>

            <View style={styles.attendeesHeader}>
              <Text style={styles.sectionTitle}>Who's going</Text>
              <Text style={styles.attendeeCount}>{allAttendeeIds.length}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <HapticPressable
            style={({ pressed }) => [
              styles.attendeeRow,
              pressed && styles.attendeeRowPressed,
            ]}
            onPress={() => router.push(`/events/user/${item.user!.id}`)}
          >
            <Image
              source={{ uri: item.user!.avatarUrl }}
              style={styles.attendeeAvatar}
            />
            <Text style={styles.attendeeName} numberOfLines={1}>
              {item.user!.displayName}
            </Text>
            {item.isFollowed && (
              <View style={styles.followBadge}>
                <Text style={styles.followBadgeText}>Following</Text>
              </View>
            )}
          </HapticPressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendees yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroImage: {
    width: "100%",
    height: 220,
    backgroundColor: colors.gray200,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: colors.text,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descriptionSection: {
    padding: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  goingButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  calendarButton: {
    flex: 1,
  },
  ticketButton: {
    flex: 1,
  },
  attendeesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  attendeeCount: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  attendeeRowPressed: {
    backgroundColor: colors.gray100,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    marginRight: 12,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
  },
  followBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
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
