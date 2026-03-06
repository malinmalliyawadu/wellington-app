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
import { useTheme } from "../theme/ThemeContext";
import { shareEvent } from "../utils/sharing";
import { useSave } from "../context/SaveContext";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { ContextMenu, Button as ExpoButton, Host } from "@expo/ui/swift-ui";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatDate,
  formatTime,
  createStyles,
  createMarkdownStyles,
} from "./event-detail/eventDetailStyles";

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
