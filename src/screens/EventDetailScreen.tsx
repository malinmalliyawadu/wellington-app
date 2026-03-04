import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
  useNavigation,
  usePathname,
  useFocusEffect,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { SFIcon } from "../components/SFIcon";
import { QueryErrorState } from "../components/QueryErrorState";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import {
  getEventById,
  getEventAttendees,
  toggleAttendance,
  deleteEvent,
  enrichEventDescription,
  enrichEventfindaDescription,
} from "../services/events";
import { getPlaceById } from "../services/places";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { useFollow } from "../context/FollowContext";
import { addToCalendar } from "../utils/addToCalendar";
import {
  scheduleEventReminder,
  cancelEventReminder,
} from "../utils/eventReminders";
import {
  createEventAttendanceNotification,
  deleteNotificationForEventAttendance,
} from "../services/notifications";
import { useToast } from "../context/ToastContext";
import { usePoints } from "../context/PointsContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import type { Event } from "../types";
import { shareEvent } from "../utils/sharing";
import { useSave } from "../context/SaveContext";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { ContextMenu, Button as ExpoButton, Host } from "@expo/ui/swift-ui";
import { fonts } from "../theme/fonts";

const CATEGORY_COLORS: Record<Event["category"], string> = {
  music: "#7209B7",
  comedy: "#F72585",
  art: "#4361EE",
  food: "#E85D04",
  market: "#2D6A4F",
  community: "#0077B6",
  quiz: "#6D28D9",
  craft: "#D97706",
  kids: "#059669",
  cultural: "#B91C1C",
};

const CATEGORY_LABELS: Record<Event["category"], string> = {
  music: "Music",
  comedy: "Comedy",
  art: "Art",
  food: "Food & Drink",
  market: "Market",
  community: "Community",
  quiz: "Quiz",
  craft: "Craft",
  kids: "Kids",
  cultural: "Cultural",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Pacific/Auckland",
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

export function EventDetailScreen() {
  const { colors } = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { session, profile } = useAuth();
  const { followingIds } = useFollow();
  const { awardPointsForAction } = usePoints();
  const { isSaved, toggleSave } = useSave();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [togglingAttendance, setTogglingAttendance] = useState(false);

  const fetchEvent = useCallback(() => getEventById(eventId), [eventId]);
  const {
    data: event,
    loading,
    error: eventError,
    refetch: refetchEvent,
  } = useQuery(fetchEvent, ["event", eventId]);

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

  // Enrich Humanitix event descriptions on-demand
  const [enrichedDescription, setEnrichedDescription] = useState<string | null>(
    null
  );
  useEffect(() => {
    if (!event?.humanitixUrl) return;
    // Check if description is a placeholder ("{title} at {venue}")
    const isPlaceholder =
      event.description.startsWith(event.title + " at ") &&
      !event.description.includes("\n") &&
      event.description.length < 200;
    if (!isPlaceholder) return;

    let cancelled = false;
    enrichEventDescription(event.id, event.humanitixUrl!).then((desc) => {
      if (!cancelled && desc) setEnrichedDescription(desc);
    });
    return () => {
      cancelled = true;
    };
  }, [event?.id, event?.humanitixUrl, event?.description, event?.title]);

  // Enrich Eventfinda event descriptions on-demand
  useEffect(() => {
    if (!event?.eventfindaUrl) return;
    // Eventfinda API truncates descriptions to ~220 chars ending with "..."
    const isTruncated = event.description.trimEnd().endsWith("...");
    if (!isTruncated) return;

    let cancelled = false;
    enrichEventfindaDescription(event.id, event.eventfindaUrl!).then((desc) => {
      if (!cancelled && desc) setEnrichedDescription(desc);
    });
    return () => {
      cancelled = true;
    };
  }, [event?.id, event?.eventfindaUrl, event?.description]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchEvent();
      refetchAttendees();
    }, [refetchEvent, refetchAttendees])
  );

  const isOwnEvent =
    event?.creatorId != null && event.creatorId === profile?.id;
  const onEditRef = useRef<(() => void) | undefined>(undefined);
  const onDeleteRef = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    if (!isOwnEvent) return;
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
                />
              </View>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              <ExpoButton
                systemImage="pencil"
                onPress={() => onEditRef.current?.()}
              >
                Edit event
              </ExpoButton>
              <ExpoButton
                systemImage="trash"
                role="destructive"
                onPress={() => onDeleteRef.current?.()}
              >
                Delete event
              </ExpoButton>
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      ),
    });
  }, [navigation, isOwnEvent]);

  const styles = createStyles(colors);

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

  if (eventError && !event) {
    return <QueryErrorState message={eventError} onRetry={refetchEvent} />;
  }

  if (!event) return null;

  const tabBase = "/" + pathname.split("/")[1];

  onEditRef.current = () => {
    router.push({
      pathname: `${tabBase}/create-post` as any,
      params: { editEventId: event.id },
    });
  };

  onDeleteRef.current = () => {
    Alert.alert("Delete event?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(event.id);
            queryClient.invalidateQueries({ queryKey: ["q", "events"] });
            queryClient.invalidateQueries({
              queryKey: ["q", "upcoming-events"],
            });
            queryClient.invalidateQueries({
              queryKey: ["q", ["event", event.id]],
            });
            showToast({ message: "Event deleted" });
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to delete event");
          }
        },
      },
    ]);
  };

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
                  onPress={() => toggleSave("event", event.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.shareButton}
                >
                  <SFIcon
                    name={
                      isSaved("event", event.id) ? "bookmark.fill" : "bookmark"
                    }
                    fallback={
                      isSaved("event", event.id)
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={20}
                    color={
                      isSaved("event", event.id) ? colors.saved : colors.text
                    }
                  />
                </HapticPressable>
                <HapticPressable
                  onPress={() => shareEvent(event.id)}
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
                <SFIcon
                  name="clock"
                  fallback="time"
                  size={18}
                  color={colors.textSecondary}
                />
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
              <View style={styles.infoRow}>
                <SFIcon
                  name="dollarsign.circle"
                  fallback="cash-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  {event.price != null && event.price > 0
                    ? `$${event.price.toFixed(2)}`
                    : "Free"}
                </Text>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionText}>
                {enrichedDescription ?? event.description}
              </Text>
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
                      const nowAttending = await toggleAttendance(
                        event.id,
                        currentUserId
                      );
                      refetchAttendees();

                      if (nowAttending) {
                        createEventAttendanceNotification(
                          currentUserId,
                          event.id
                        ).catch(() => {});
                        scheduleEventReminder(event).catch(() => {});
                        awardPointsForAction("event_attend", event.id);
                      } else {
                        deleteNotificationForEventAttendance(
                          currentUserId,
                          event.id
                        ).catch(() => {});
                        cancelEventReminder(event.id).catch(() => {});
                      }
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
              <Text style={styles.sectionTitle}>Who&apos;s going</Text>
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
    heroTitle: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      fontSize: 26,
      fontFamily: fonts.bold,
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
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    attendeeCount: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: "500",
      fontFamily: fonts.medium,
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
      fontFamily: fonts.medium,
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
      fontFamily: fonts.semiBold,
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
