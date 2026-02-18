import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { SFIcon } from "../components/SFIcon";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
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
import { shareEvent } from "../utils/sharing";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";

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
    return `${formatSingleTime(time)} – ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(time);
}

function getMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NZ", { month: "short" }).toUpperCase();
}

function getDay(dateString: string): string {
  const date = new Date(dateString);
  return date.getDate().toString();
}

const glassEnabled = isLiquidGlassAvailable();

export function EventDetailScreen() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

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
            {/* Hero image area with overlays */}
            <View style={styles.heroContainer}>
              {event.imageUrl ? (
                <Image
                  source={{ uri: event.imageUrl }}
                  style={styles.heroImage}
                />
              ) : (
                <LinearGradient
                  colors={[categoryColor, categoryColor + "88"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroImage}
                />
              )}

              {/* Bottom gradient for title readability */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroGradient}
              />

              {/* Date badge (top-right) */}
              {glassEnabled ? (
                <GlassView
                  glassEffectStyle="regular"
                  style={styles.heroDateBadge}
                >
                  <Text style={[styles.heroDateMonth, styles.heroDateMonthGlass]}>{getMonth(event.date)}</Text>
                  <Text style={[styles.heroDateDay, styles.heroDateDayGlass]}>{getDay(event.date)}</Text>
                </GlassView>
              ) : (
                <View style={[styles.heroDateBadge, styles.heroDateBadgeFallback]}>
                  <Text style={styles.heroDateMonth}>{getMonth(event.date)}</Text>
                  <Text style={styles.heroDateDay}>{getDay(event.date)}</Text>
                </View>
              )}

              {/* Title overlaid on bottom */}
              <Text style={styles.heroTitle} numberOfLines={3}>
                {event.title}
              </Text>
            </View>

            {/* Info section */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <SFIcon
                  name="calendar"
                  fallback="calendar"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>{formatDate(event.date)}</Text>
                <HapticPressable
                  onPress={() =>
                    shareEvent(
                      event.id,
                      event.title,
                      formatDate(event.date),
                      place?.name ?? "Wellington",
                      event.description
                    )
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.shareButton}
                >
                  <SFIcon
                    name="paperplane"
                    fallback="paper-plane-outline"
                    size={20}
                    color={colors.text}
                  />
                </HapticPressable>
              </View>
              <View style={styles.infoRow}>
                <SFIcon name="clock" fallback="time" size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  {formatTime(event.startTime, event.endTime)}
                </Text>
              </View>
              {place && (
                <View style={styles.infoRow}>
                  <SFIcon
                    name="mappin"
                    fallback="location"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoLocationContent}>
                    <Text style={styles.infoText}>{place.name}</Text>
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
  // Hero image area with overlays
  heroContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  heroDateBadge: {
    position: "absolute",
    top: 60,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 52,
    overflow: "hidden",
  },
  heroDateBadgeFallback: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heroDateMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroDateMonthGlass: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroDateDay: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: colors.text,
    lineHeight: 28,
  },
  heroDateDayGlass: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroTitle: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 26,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Info section
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  infoLocationContent: {
    flex: 1,
  },
  shareButton: {
    padding: 4,
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
