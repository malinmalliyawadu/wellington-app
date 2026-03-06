import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import { EventCard } from "../components/EventCard";
import { SectionHeader } from "../components/SectionHeader";
import {
  getUpcomingEvents,
  getUpcomingEventsPaginated,
} from "../services/events";
import { getPlaces } from "../services/places";
import { getProfilesByIds } from "../services/users";
import { useQuery } from "../hooks/useQuery";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useFollow } from "../context/FollowContext";
import { useEventFilters } from "../context/EventFilterContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { QueryErrorState } from "../components/QueryErrorState";
import { fonts } from "../theme/fonts";
import type { Event, Place } from "../types";

// ─── Types & Constants ───────────────────────────────────────────────

type DateRange = "today" | "tomorrow" | "weekend" | "month";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This Weekend",
  month: "This Month",
};

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });

  switch (range) {
    case "today":
      return { start: fmt(now), end: fmt(now) };
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return { start: fmt(tomorrow), end: fmt(tomorrow) };
    }
    case "weekend": {
      const day = now.getDay();
      const daysUntilSat = day === 0 ? 6 : 6 - day;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const start = day === 0 || day === 6 ? now : sat;
      return { start: fmt(start), end: fmt(sun) };
    }
    case "month": {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmt(now), end: fmt(endOfMonth) };
    }
  }
}

interface QuickChip {
  key: string;
  label: string;
  icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
}

const QUICK_CHIPS: QuickChip[] = [
  {
    key: "today",
    label: "Today",
    icon: { sf: "sun.max.fill", fallback: "sunny" },
  },
  {
    key: "tomorrow",
    label: "Tomorrow",
    icon: { sf: "arrow.right.circle", fallback: "arrow-forward-circle" },
  },
  {
    key: "weekend",
    label: "Weekend",
    icon: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  },
  {
    key: "free",
    label: "Free",
    icon: { sf: "tag.fill", fallback: "pricetag" },
  },
  {
    key: "filters",
    label: "Filters",
    icon: { sf: "slider.horizontal.3", fallback: "options" },
  },
];

type EventWithPlace = { event: Event; place: Place };

type DiscoveryItem =
  | { type: "chips" }
  | {
      type: "carousel";
      key: string;
      title: string;
      icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
      items: EventWithPlace[];
      count: number;
    }
  | {
      type: "featured";
      item: EventWithPlace;
      restCarousel: EventWithPlace[];
      title: string;
      icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
      count: number;
    }
  | { type: "comingUpHeader"; count: number }
  | { type: "comingUpItem"; item: EventWithPlace }
  | { type: "viewAll" }
  | { type: "empty" }
  | { type: "footer" };

// ─── Section classification for discovery mode ───────────────────────

function classifySections(eventsWithPlaces: EventWithPlace[]) {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
  const todayStr = fmt(now);

  // Compute tomorrow/weekend using NZ date to avoid device-timezone mismatch.
  // Parse the NZ-formatted date and do day arithmetic on that.
  const [y, mo, d] = todayStr.split("-").map(Number);
  const nzDate = new Date(y, mo - 1, d); // midnight local, but only used for day math
  const addDays = (base: Date, n: number) => {
    const r = new Date(base);
    r.setDate(r.getDate() + n);
    return r.toLocaleDateString("en-CA");
  };
  const tomorrowStr = addDays(nzDate, 1);

  // Weekend dates (based on NZ day of week)
  const nzDay = nzDate.getDay();
  const daysUntilSat = nzDay === 0 ? 6 : 6 - nzDay;
  const satStr = addDays(nzDate, daysUntilSat);
  const sunStr = addDays(nzDate, daysUntilSat + 1);
  const isCurrentlyWeekend = nzDay === 0 || nzDay === 6;

  const happeningNow: EventWithPlace[] = [];
  const weekend: EventWithPlace[] = [];
  const free: EventWithPlace[] = [];
  const comingUp: EventWithPlace[] = [];

  // Current time in minutes since midnight (NZ timezone)
  const nzTimeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Pacific/Auckland",
    hour12: false,
  });
  const [nowH, nowM] = nzTimeStr.split(":").map(Number);
  const nowMinutes = nowH * 60 + nowM;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  for (const item of eventsWithPlaces) {
    const { event } = item;
    const isToday = event.date === todayStr;
    const isTomorrow = event.date === tomorrowStr;
    const isWeekend =
      event.date === satStr ||
      event.date === sunStr ||
      (isCurrentlyWeekend && isToday);
    const isFree = event.price == null || event.price === 0;

    // For "Happening Now": skip today's events that have already finished.
    // Use endTime if available, otherwise assume ~3 hours after start.
    let hasEnded = false;
    if (isToday) {
      const endMinutes = event.endTime
        ? toMinutes(event.endTime)
        : toMinutes(event.startTime) + 180;
      hasEnded = endMinutes <= nowMinutes;
    }
    if (isToday && !hasEnded) happeningNow.push(item);
    if (isWeekend) weekend.push(item);
    if (isFree) free.push(item);
    comingUp.push(item);
  }

  // Sort sections by AI score (highest first), unscored events fall to end
  const byScore = (a: EventWithPlace, b: EventWithPlace) =>
    (b.event.aiScore ?? -1) - (a.event.aiScore ?? -1);

  happeningNow.sort(byScore);
  weekend.sort(byScore);
  free.sort(byScore);
  comingUp.sort(byScore);

  // Popular = top 10 by attendee count (social signal, not AI score)
  const popular = [...eventsWithPlaces]
    .sort(
      (a, b) =>
        (b.event.attendeeIds?.length ?? 0) - (a.event.attendeeIds?.length ?? 0)
    )
    .slice(0, 10)
    .filter((item) => (item.event.attendeeIds?.length ?? 0) > 0);

  return { happeningNow, weekend, popular, free, comingUp };
}

// ─── Component ───────────────────────────────────────────────────────

export function EventsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { followingIds } = useFollow();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const {
    selectedDateRange,
    setSelectedDateRange,
    selectedCategories,
    showFollowingOnly,
    showFreeOnly,
    setShowFreeOnly,
    registerOpenDrawer,
  } = useEventFilters();

  useEffect(() => {
    registerOpenDrawer(() => navigation.dispatch(DrawerActions.openDrawer()));
  }, [navigation, registerOpenDrawer]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Determine if any filter is active (switches to filtered mode)
  const hasActiveFilters =
    selectedDateRange != null ||
    selectedCategories.length > 0 ||
    showFollowingOnly ||
    showFreeOnly;

  // Advanced filter count (categories + following — excludes quick chips)
  const advancedFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) + (showFollowingOnly ? 1 : 0);

  // ─── Discovery mode data ──────────────────────────────────────────

  const fetchAllEvents = useCallback(() => getUpcomingEvents(), []);
  const {
    data: allEvents,
    loading: loadingDiscovery,
    error: discoveryError,
    refetch: refetchDiscovery,
  } = useQuery(fetchAllEvents, "discovery-events", {
    enabled: !hasActiveFilters,
  });

  // ─── Filtered mode data ───────────────────────────────────────────

  const dateRangeParam = selectedDateRange
    ? getDateRange(selectedDateRange)
    : undefined;
  const categoriesParam =
    selectedCategories.length > 0 ? selectedCategories : undefined;
  const followingParam =
    showFollowingOnly && followingIds.length > 0 ? followingIds : undefined;

  const {
    data: filteredData,
    isPending: loadingFiltered,
    error: filteredError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchFiltered,
  } = useInfiniteQuery({
    queryKey: [
      "events",
      dateRangeParam,
      categoriesParam,
      showFreeOnly,
      followingParam,
    ],
    queryFn: ({ pageParam }) =>
      getUpcomingEventsPaginated({
        offset: pageParam,
        dateRange: dateRangeParam,
        categories: categoriesParam,
        freeOnly: showFreeOnly,
        followingUserIds: followingParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((sum, page) => sum + page.events.length, 0);
    },
    staleTime: 60_000,
    enabled: hasActiveFilters,
  });

  const filteredEvents = useMemo(
    () => filteredData?.pages.flatMap((page) => page.events) ?? [],
    [filteredData]
  );

  // ─── Places ───────────────────────────────────────────────────────

  const fetchPlaces = useCallback(() => getPlaces(), []);
  const { data: places, refetch: refetchPlaces } = useQuery(
    fetchPlaces,
    "places"
  );

  const placeMap = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places]
  );

  // ─── Refetch stale data on focus ─────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["discovery-events"],
        refetchType: "none",
      });
    }, [queryClient])
  );

  // ─── Refresh ──────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        hasActiveFilters ? refetchFiltered() : refetchDiscovery(),
        refetchPlaces(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [hasActiveFilters, refetchFiltered, refetchDiscovery, refetchPlaces]);

  // ─── Discovery sections ───────────────────────────────────────────

  const discoveryEventsWithPlaces = useMemo(
    () =>
      (allEvents ?? [])
        .map((event) => {
          const place = placeMap.get(event.placeId);
          if (!place) return null;
          return { event, place };
        })
        .filter((item): item is EventWithPlace => item !== null),
    [allEvents, placeMap]
  );

  const sections = useMemo(
    () => classifySections(discoveryEventsWithPlaces),
    [discoveryEventsWithPlaces]
  );

  // ─── Batch attendee profiles ────────────────────────────────────

  const allAttendeeIds = useMemo(() => {
    const events = hasActiveFilters ? filteredEvents : allEvents ?? [];
    const ids = new Set<string>();
    for (const event of events) {
      for (const id of event.attendeeIds ?? []) {
        ids.add(id);
        if (ids.size >= 50) return Array.from(ids);
      }
    }
    return Array.from(ids);
  }, [hasActiveFilters, filteredEvents, allEvents]);

  const fetchAttendeeProfiles = useCallback(
    () => getProfilesByIds(allAttendeeIds),
    [allAttendeeIds]
  );
  const { data: attendeeProfiles } = useQuery(
    fetchAttendeeProfiles,
    ["event-attendees", allAttendeeIds],
    { enabled: allAttendeeIds.length > 0 }
  );

  // ─── Filtered mode helpers ────────────────────────────────────────

  const filteredEventsWithPlaces = useMemo(
    () =>
      filteredEvents
        .map((event) => {
          const place = placeMap.get(event.placeId);
          if (!place) return null;
          return { event, place };
        })
        .filter((item): item is EventWithPlace => item !== null),
    [filteredEvents, placeMap]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filterSummary = [
    selectedDateRange ? DATE_RANGE_LABELS[selectedDateRange] : null,
    selectedCategories.length === 1
      ? selectedCategories[0]
      : selectedCategories.length > 1
      ? `${selectedCategories.length} categories`
      : null,
    showFreeOnly ? "Free" : null,
    showFollowingOnly ? "Following" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // ─── Quick filter chip handler ────────────────────────────────────

  const openFilters = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleChipPress = useCallback(
    (key: string) => {
      if (key === "filters") {
        openFilters();
        return;
      }
      if (key === "free") {
        setShowFreeOnly(!showFreeOnly);
        return;
      }
      // Date range chips
      const range = key as DateRange;
      setSelectedDateRange(selectedDateRange === range ? null : range);
    },
    [
      openFilters,
      setShowFreeOnly,
      showFreeOnly,
      setSelectedDateRange,
      selectedDateRange,
    ]
  );

  const isChipActive = useCallback(
    (key: string) => {
      if (key === "free") return showFreeOnly;
      if (key === "filters") return advancedFilterCount > 0;
      return selectedDateRange === key;
    },
    [showFreeOnly, advancedFilterCount, selectedDateRange]
  );

  // ─── Navigate to event ────────────────────────────────────────────

  const navigateToEvent = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router]
  );

  // ─── Quick Filter Chips row ───────────────────────────────────────

  const renderChips = useCallback(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsRow}
      >
        {QUICK_CHIPS.map((chip) => {
          const active = isChipActive(chip.key);
          return (
            <HapticPressable
              key={chip.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handleChipPress(chip.key)}
            >
              <SFIcon
                name={chip.icon.sf}
                fallback={chip.icon.fallback}
                size={14}
                color={active ? "#FFFFFF" : colors.textSecondary}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
              {chip.key === "filters" && advancedFilterCount > 0 && (
                <View style={styles.chipBadge}>
                  <Text style={styles.chipBadgeText}>
                    {advancedFilterCount}
                  </Text>
                </View>
              )}
            </HapticPressable>
          );
        })}
      </ScrollView>
    ),
    [isChipActive, handleChipPress, advancedFilterCount, styles, colors]
  );

  // ─── Horizontal carousel ──────────────────────────────────────────

  const renderCarouselItem = useCallback(
    ({
      item,
      variant,
    }: {
      item: EventWithPlace;
      variant: "small" | "default";
    }) => (
      <EventCard
        event={item.event}
        place={item.place}
        variant={variant}
        onEventPress={navigateToEvent}
        attendeeProfiles={attendeeProfiles ?? undefined}
      />
    ),
    [navigateToEvent, attendeeProfiles]
  );

  const renderCarousel = useCallback(
    (items: EventWithPlace[], variant: "small" | "default" = "small") => (
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.event.id}
        renderItem={({ item }) => renderCarouselItem({ item, variant })}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      />
    ),
    [renderCarouselItem, styles.carouselContainer]
  );

  // ─── Discovery mode data ─────────────────────────────────────────

  const { happeningNow, weekend, popular, free, comingUp } = sections;
  const weekendRest = useMemo(() => weekend.slice(1), [weekend]);

  const discoveryData = useMemo(() => {
    const items: DiscoveryItem[] = [{ type: "chips" }];

    if (happeningNow.length > 0) {
      items.push({
        type: "carousel",
        key: "happeningNow",
        title: "Happening Now",
        icon: { sf: "sun.max.fill", fallback: "sunny" },
        items: happeningNow,
        count: happeningNow.length,
      });
    }
    if (weekend.length > 0) {
      items.push({
        type: "featured",
        item: weekend[0],
        restCarousel: weekendRest,
        title: "This Weekend",
        icon: { sf: "cup.and.saucer.fill", fallback: "cafe" },
        count: weekend.length,
      });
    }
    if (popular.length > 0) {
      items.push({
        type: "carousel",
        key: "popular",
        title: "Popular",
        icon: { sf: "flame.fill", fallback: "flame" },
        items: popular,
        count: popular.length,
      });
    }
    if (free.length > 0) {
      items.push({
        type: "carousel",
        key: "free",
        title: "Free Events",
        icon: { sf: "tag.fill", fallback: "pricetag" },
        items: free,
        count: free.length,
      });
    }
    if (comingUp.length > 0) {
      items.push({ type: "comingUpHeader", count: comingUp.length });
      for (const item of comingUp.slice(0, 8)) {
        items.push({ type: "comingUpItem", item });
      }
      if (comingUp.length > 8) {
        items.push({ type: "viewAll" });
      }
    }
    if (discoveryEventsWithPlaces.length === 0) {
      items.push({ type: "empty" });
    } else {
      items.push({ type: "footer" });
    }
    return items;
  }, [
    happeningNow,
    weekend,
    weekendRest,
    popular,
    free,
    comingUp,
    discoveryEventsWithPlaces.length,
  ]);

  const handleViewAll = useCallback(
    () => setSelectedDateRange("month"),
    [setSelectedDateRange]
  );

  const renderDiscoveryItem = useCallback(
    ({ item }: { item: DiscoveryItem }) => {
      switch (item.type) {
        case "chips":
          return renderChips();
        case "carousel":
          return (
            <View>
              <SectionHeader
                title={item.title}
                icon={item.icon}
                count={item.count}
              />
              {renderCarousel(item.items)}
            </View>
          );
        case "featured":
          return (
            <View>
              <SectionHeader
                title={item.title}
                icon={item.icon}
                count={item.count}
              />
              <EventCard
                event={item.item.event}
                place={item.item.place}
                variant="featured"
                onEventPress={navigateToEvent}
                attendeeProfiles={attendeeProfiles ?? undefined}
              />
              {item.restCarousel.length > 0 && (
                <View style={styles.carouselSpacing}>
                  {renderCarousel(item.restCarousel)}
                </View>
              )}
            </View>
          );
        case "comingUpHeader":
          return (
            <SectionHeader
              title="Coming Up"
              icon={{ sf: "binoculars.fill", fallback: "telescope" }}
              count={item.count}
            />
          );
        case "comingUpItem":
          return (
            <View style={styles.comingUpItemSpacing}>
              <EventCard
                event={item.item.event}
                place={item.item.place}
                onEventPress={navigateToEvent}
                attendeeProfiles={attendeeProfiles ?? undefined}
              />
            </View>
          );
        case "viewAll":
          return (
            <HapticPressable
              style={styles.viewAllButton}
              onPress={handleViewAll}
            >
              <Text style={styles.viewAllText}>View all events</Text>
              <SFIcon
                name="chevron.right"
                fallback="chevron-forward"
                size={14}
                color={colors.primary}
              />
            </HapticPressable>
          );
        case "empty":
          return (
            <View style={styles.empty}>
              <SFIcon
                name="calendar"
                fallback="calendar-outline"
                size={48}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No upcoming events yet</Text>
            </View>
          );
        case "footer":
          return (
            <View style={styles.footerContainer}>
              <SFIcon
                name="sparkles"
                fallback="sparkles"
                size={28}
                color={colors.gray300}
              />
              <Text style={styles.footerText}>
                That&apos;s everything for now
              </Text>
            </View>
          );
      }
    },
    [
      renderChips,
      renderCarousel,
      navigateToEvent,
      handleViewAll,
      attendeeProfiles,
      colors,
      styles,
    ]
  );

  const getDiscoveryItemKey = useCallback(
    (_item: DiscoveryItem, index: number) => {
      const item = _item;
      switch (item.type) {
        case "chips":
          return "chips";
        case "carousel":
          return `carousel-${item.key}`;
        case "featured":
          return `featured-${item.item.event.id}`;
        case "comingUpHeader":
          return "comingUpHeader";
        case "comingUpItem":
          return `coming-${item.item.event.id}`;
        case "viewAll":
          return "viewAll";
        case "empty":
          return "empty";
        case "footer":
          return "footer";
        default:
          return String(index);
      }
    },
    []
  );

  // ─── Loading state ────────────────────────────────────────────────

  const isLoading = hasActiveFilters ? loadingFiltered : loadingDiscovery;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const errorMessage = hasActiveFilters
    ? filteredError?.message
    : discoveryError;
  const hasNoData = hasActiveFilters
    ? filteredEvents.length === 0
    : (allEvents ?? []).length === 0;

  if (errorMessage && hasNoData) {
    return (
      <QueryErrorState
        message={errorMessage}
        onRetry={() =>
          hasActiveFilters ? refetchFiltered() : refetchDiscovery()
        }
      />
    );
  }

  // ─── Filtered mode ────────────────────────────────────────────────

  if (hasActiveFilters) {
    return (
      <View style={styles.container}>
        <FlatList
          testID="events-list"
          data={filteredEventsWithPlaces}
          keyExtractor={(item) => item.event.id}
          renderItem={({ item }) => (
            <View style={styles.comingUpItemSpacing}>
              <EventCard
                event={item.event}
                place={item.place}
                onEventPress={navigateToEvent}
                attendeeProfiles={attendeeProfiles ?? undefined}
              />
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentInset={{ top: headerHeight }}
          contentOffset={{ x: 0, y: -headerHeight }}
          scrollIndicatorInsets={{ top: headerHeight }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 40 + insets.bottom },
          ]}
          ListHeaderComponent={
            <View>
              {renderChips()}
              {filterSummary ? (
                <View style={styles.filterSummaryRow}>
                  <Text style={styles.filterSummary}>{filterSummary}</Text>
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !hasNextPage && filteredEventsWithPlaces.length > 0 ? (
              <View style={styles.footerContainer}>
                <SFIcon
                  name="sparkles"
                  fallback="sparkles"
                  size={28}
                  color={colors.gray300}
                />
                <Text style={styles.footerText}>
                  That&apos;s everything for now
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <SFIcon
                name="calendar"
                fallback="calendar-outline"
                size={48}
                color={colors.gray300}
              />
              <Text style={styles.emptyText}>No events match your filters</Text>
              <HapticPressable onPress={openFilters}>
                <Text style={styles.emptyAction}>Adjust filters</Text>
              </HapticPressable>
            </View>
          }
        />
        <FloatingCreateButton />
      </View>
    );
  }

  // ─── Discovery mode ───────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <FlatList
        testID="events-list"
        data={discoveryData}
        renderItem={renderDiscoveryItem}
        keyExtractor={getDiscoveryItemKey}
        showsVerticalScrollIndicator={false}
        contentInset={{ top: headerHeight }}
        contentOffset={{ x: 0, y: -headerHeight }}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 40 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      <FloatingCreateButton />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    // Quick filter chips
    chipsRow: {
      flexGrow: 0,
    },
    chipsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.gray100,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: "#FFFFFF",
    },
    chipBadge: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    chipBadgeText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    // Carousel
    carouselContainer: {
      paddingHorizontal: 16,
      gap: 12,
    },
    carouselSpacing: {
      marginTop: 12,
    },
    // Filter summary
    filterSummaryRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterSummary: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: fonts.medium,
    },
    comingUpItemSpacing: {
      marginBottom: 20,
    },
    // View all button
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: colors.gray100,
    },
    viewAllText: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Empty state
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
    emptyAction: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Footer
    footerContainer: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 8,
    },
    footerText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textMuted,
    },
  });
