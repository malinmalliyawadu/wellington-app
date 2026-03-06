import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  Linking,
  Platform,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
  useNavigation,
  usePathname,
  useFocusEffect,
} from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SFIcon } from "../components/SFIcon";
import { QueryErrorState } from "../components/QueryErrorState";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import {
  getEventById,
  getEventAttendees,
  toggleAttendance,
  deleteEvent,
} from "../services/events";
import Markdown from "react-native-markdown-display";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event?.placeId]
  );
  const { data: place } = useQuery(fetchPlace, event?.placeId);

  const fetchAttendeeIds = useCallback(
    () => (event ? getEventAttendees(event.id) : Promise.resolve([])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event?.id]
  );
  const { data: attendeeIds, refetch: refetchAttendees } = useQuery(
    fetchAttendeeIds,
    event?.id
  );

  const allAttendeeIds = useMemo(() => attendeeIds ?? [], [attendeeIds]);

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

  // AI description is set server-side during event sync

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

  const handleOpenDirections = useCallback(() => {
    if (!place) return;
    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        );
      });
    }
  }, [place]);

  const styles = createStyles(colors);
  const mdStyles = createMarkdownStyles(colors);

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
  const categoryLabel = CATEGORY_LABELS[event.category];
  const priceLabel =
    event.price != null && event.price > 0
      ? `$${event.price.toFixed(2)}`
      : "Free";

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
            {/* Hero image with category + price pills and title */}
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

              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroGradient}
              />

              {/* Pills row + title overlaid at bottom */}
              <View style={styles.heroOverlay}>
                <View style={styles.heroPills}>
                  <View
                    style={[
                      styles.heroPill,
                      { backgroundColor: categoryColor },
                    ]}
                  >
                    <Text style={styles.heroPillText}>{categoryLabel}</Text>
                  </View>
                  <Text style={styles.heroPillDot}>·</Text>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>{priceLabel}</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {event.title}
                </Text>
              </View>
            </View>

            {/* Date & time block */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <SFIcon
                  name="calendar"
                  fallback="calendar"
                  size={18}
                  color={colors.textSecondary}
                />
                <View>
                  <Text style={styles.metaPrimary}>
                    {formatDate(event.date)}
                  </Text>
                  <Text style={styles.metaSecondary}>
                    {formatTime(event.startTime, event.endTime)}
                  </Text>
                </View>
              </View>

              {/* Location block — tappable */}
              {place && (
                <View style={styles.metaRow}>
                  <SFIcon
                    name="mappin"
                    fallback="location"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <HapticPressable
                      onPress={() =>
                        router.push(`${tabBase}/place/${place.id}` as any)
                      }
                    >
                      <Text style={styles.metaLink}>{place.name}</Text>
                    </HapticPressable>
                    <View style={styles.addressRow}>
                      <Text style={styles.metaSecondary} numberOfLines={1}>
                        {place.address}
                      </Text>
                      <HapticPressable
                        onPress={handleOpenDirections}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.directionsButton}
                      >
                        <Text style={styles.directionsText}>Directions</Text>
                        <SFIcon
                          name="arrow.right"
                          fallback="chevron-forward"
                          size={12}
                          color={colors.primary}
                        />
                      </HapticPressable>
                    </View>
                  </View>
                </View>
              )}

            </View>

            <View style={styles.divider} />

            {/* Primary CTAs */}
            <View style={styles.ctaSection}>
              {currentUserId && (
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
              )}
              {event.ticketUrl && (
                <LiquidGlassButton
                  title="Get Tickets"
                  icon="ticket-outline"
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    WebBrowser.openBrowserAsync(event.ticketUrl!);
                  }}
                />
              )}
            </View>

            {/* Utility icon row */}
            <View style={styles.utilityRow}>
              <HapticPressable
                style={styles.utilityItem}
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
              >
                <SFIcon
                  name="calendar.badge.plus"
                  fallback="calendar-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={styles.utilityLabel}>Cal</Text>
              </HapticPressable>

              <HapticPressable
                style={styles.utilityItem}
                onPress={() => toggleSave("event", event.id)}
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
                  size={22}
                  color={
                    isSaved("event", event.id) ? colors.saved : colors.text
                  }
                />
                <Text style={styles.utilityLabel}>Save</Text>
              </HapticPressable>

              <HapticPressable
                style={styles.utilityItem}
                onPress={() => shareEvent(event.id)}
              >
                <SFIcon
                  name="paperplane"
                  fallback="paper-plane-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={styles.utilityLabel}>Share</Text>
              </HapticPressable>

              <HapticPressable
                style={styles.utilityItem}
                onPress={() => {
                  // Dismiss any sheets/modals first so AI chat opens full-screen
                  router.dismissAll();
                  router.push({
                    pathname: `${tabBase}/ai-chat` as any,
                    params: {
                      eventId: event.id,
                      eventTitle: event.title,
                      eventCategory: event.category,
                      eventImageUrl: event.imageUrl ?? undefined,
                    },
                  });
                }}
              >
                <SFIcon
                  name="sparkles"
                  fallback="sparkles-outline"
                  size={22}
                  color={colors.text}
                />
                <Text style={styles.utilityLabel}>Ask AI</Text>
              </HapticPressable>
            </View>

            <View style={styles.divider} />

            {/* About section */}
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About</Text>
              {event.aiDescription ? (
                <Markdown style={mdStyles}>{event.aiDescription}</Markdown>
              ) : (
                <Text style={styles.descriptionText}>
                  {event.description}
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Attendees header */}
            <View style={styles.attendeesHeader}>
              <Text style={styles.sectionTitle}>
                Who&apos;s going{" "}
                <Text style={styles.attendeeCount}>
                  · {allAttendeeIds.length}
                </Text>
              </Text>
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
        ListFooterComponent={
          place ? (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              <HapticPressable
                onPress={handleOpenDirections}
                style={styles.mapContainer}
              >
                <MapView
                  style={styles.miniMap}
                  initialRegion={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  pointerEvents="none"
                >
                  <Marker
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }}
                  />
                </MapView>
              </HapticPressable>
              <Text style={styles.mapPlaceName}>{place.name}</Text>
              <Text style={styles.mapAddress}>{place.address}</Text>
            </View>
          ) : null
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
    heroOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
    },
    heroPills: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    heroPill: {
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    heroPillText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: "#FFFFFF",
    },
    heroPillDot: {
      fontSize: 16,
      color: "rgba(255,255,255,0.7)",
    },
    heroTitle: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: "#FFFFFF",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    // Meta info (date/time, location)
    metaSection: {
      padding: 20,
      gap: 16,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    metaPrimary: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    metaSecondary: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metaLink: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    directionsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    directionsText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    mapSection: {
      padding: 20,
      gap: 8,
    },
    mapContainer: {
      borderRadius: 12,
      overflow: "hidden",
    },
    miniMap: {
      height: 180,
    },
    mapPlaceName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    mapAddress: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.gray200,
      marginHorizontal: 20,
    },
    // CTA buttons
    ctaSection: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 10,
    },
    // Utility icon row
    utilityRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 32,
      paddingVertical: 16,
    },
    utilityItem: {
      alignItems: "center",
      gap: 4,
    },
    utilityLabel: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    // About section
    aboutSection: {
      padding: 20,
      gap: 12,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    attendeesHeader: {
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
      fontSize: 16,
      color: colors.textSecondary,
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

const createMarkdownStyles = (colors: Colors) =>
  StyleSheet.create({
    body: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    heading1: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 18,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 4,
    },
    strong: {
      fontFamily: fonts.bold,
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 14,
    },
  });
