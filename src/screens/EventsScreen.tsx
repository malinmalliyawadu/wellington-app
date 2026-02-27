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
import { getUpcomingEvents, getUpcomingEventsPaginated } from "../services/events";
import { getPlaces } from "../services/places";
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
  const fmt = (d: Date) => d.toISOString().split("T")[0];

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
  { key: "today", label: "Today", icon: { sf: "sun.max.fill", fallback: "sunny" } },
  { key: "tomorrow", label: "Tomorrow", icon: { sf: "arrow.right.circle", fallback: "arrow-forward-circle" } },
  { key: "weekend", label: "Weekend", icon: { sf: "cup.and.saucer.fill", fallback: "cafe" } },
  { key: "free", label: "Free", icon: { sf: "tag.fill", fallback: "pricetag" } },
  { key: "filters", label: "Filters", icon: { sf: "slider.horizontal.3", fallback: "options" } },
];

type EventWithPlace = { event: Event; place: Place };

// ─── Section classification for discovery mode ───────────────────────

function classifySections(eventsWithPlaces: EventWithPlace[]) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const todayStr = fmt(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = fmt(tomorrowDate);

  // Weekend dates
  const day = now.getDay();
  const daysUntilSat = day === 0 ? 6 : 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const satStr = fmt(sat);
  const sunStr = fmt(sun);
  const isCurrentlyWeekend = day === 0 || day === 6;

  const happeningNow: EventWithPlace[] = [];
  const weekend: EventWithPlace[] = [];
  const free: EventWithPlace[] = [];
  const comingUp: EventWithPlace[] = [];

  for (const item of eventsWithPlaces) {
    const { event } = item;
    const isToday = event.date === todayStr;
    const isTomorrow = event.date === tomorrowStr;
    const isWeekend =
      event.date === satStr || event.date === sunStr || (isCurrentlyWeekend && isToday);
    const isFree = event.price == null || event.price === 0;

    if (isToday || isTomorrow) happeningNow.push(item);
    if (isWeekend) weekend.push(item);
    if (isFree) free.push(item);
    comingUp.push(item);
  }

  // Popular = top 10 by attendee count
  const popular = [...eventsWithPlaces]
    .sort((a, b) => (b.event.attendeeIds?.length ?? 0) - (a.event.attendeeIds?.length ?? 0))
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

  const styles = createStyles(colors);

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
  } = useQuery(fetchAllEvents, "discovery-events", { enabled: !hasActiveFilters });

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

  // ─── Invalidate on focus ──────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-events"] });
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

  const renderChips = () => (
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
                <Text style={styles.chipBadgeText}>{advancedFilterCount}</Text>
              </View>
            )}
          </HapticPressable>
        );
      })}
    </ScrollView>
  );

  // ─── Horizontal carousel ──────────────────────────────────────────

  const renderCarousel = (items: EventWithPlace[], variant: "small" | "default" = "small") => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
    >
      {items.map((item) => (
        <EventCard
          key={item.event.id}
          event={item.event}
          place={item.place}
          variant={variant}
          onPress={() => navigateToEvent(item.event.id)}
        />
      ))}
    </ScrollView>
  );

  // ─── Loading state ────────────────────────────────────────────────

  const isLoading = hasActiveFilters ? loadingFiltered : loadingDiscovery;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const errorMessage = hasActiveFilters ? filteredError?.message : discoveryError;
  const hasNoData = hasActiveFilters ? filteredEvents.length === 0 : (allEvents ?? []).length === 0;

  if (errorMessage && hasNoData) {
    return (
      <QueryErrorState
        message={errorMessage}
        onRetry={() => (hasActiveFilters ? refetchFiltered() : refetchDiscovery())}
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
            <EventCard
              event={item.event}
              place={item.place}
              onPress={() => navigateToEvent(item.event.id)}
            />
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
                <SFIcon name="sparkles" fallback="sparkles" size={28} color={colors.gray300} />
                <Text style={styles.footerText}>That&apos;s everything for now</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <SFIcon name="calendar" fallback="calendar-outline" size={48} color={colors.gray300} />
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

  const { happeningNow, weekend, popular, free, comingUp } = sections;
  const weekendFeatured = weekend.length > 0 ? weekend[0] : null;
  const weekendRest = weekend.slice(1);
  const comingUpCapped = comingUp.slice(0, 15);

  return (
    <View style={styles.container}>
      <ScrollView
        testID="events-list"
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
      >
        {/* Quick filter chips */}
        {renderChips()}

        {/* Happening Now */}
        {happeningNow.length > 0 && (
          <View>
            <SectionHeader
              title="Happening Now"
              icon={{ sf: "sun.max.fill", fallback: "sunny" }}
              count={happeningNow.length}
            />
            {renderCarousel(happeningNow)}
          </View>
        )}

        {/* This Weekend */}
        {weekend.length > 0 && (
          <View>
            <SectionHeader
              title="This Weekend"
              icon={{ sf: "cup.and.saucer.fill", fallback: "cafe" }}
              count={weekend.length}
            />
            {weekendFeatured && (
              <EventCard
                event={weekendFeatured.event}
                place={weekendFeatured.place}
                variant="featured"
                onPress={() => navigateToEvent(weekendFeatured.event.id)}
              />
            )}
            {weekendRest.length > 0 && (
              <View style={styles.carouselSpacing}>
                {renderCarousel(weekendRest)}
              </View>
            )}
          </View>
        )}

        {/* Popular */}
        {popular.length > 0 && (
          <View>
            <SectionHeader
              title="Popular"
              icon={{ sf: "flame.fill", fallback: "flame" }}
              count={popular.length}
            />
            {renderCarousel(popular)}
          </View>
        )}

        {/* Free Events */}
        {free.length > 0 && (
          <View>
            <SectionHeader
              title="Free Events"
              icon={{ sf: "tag.fill", fallback: "pricetag" }}
              count={free.length}
            />
            {renderCarousel(free)}
          </View>
        )}

        {/* Coming Up */}
        {comingUpCapped.length > 0 && (
          <View>
            <SectionHeader
              title="Coming Up"
              icon={{ sf: "binoculars.fill", fallback: "telescope" }}
              count={comingUp.length}
            />
            {comingUpCapped.map((item) => (
              <EventCard
                key={item.event.id}
                event={item.event}
                place={item.place}
                onPress={() => navigateToEvent(item.event.id)}
              />
            ))}
            {comingUp.length > 15 && (
              <HapticPressable
                style={styles.viewAllButton}
                onPress={() => setSelectedDateRange("month")}
              >
                <Text style={styles.viewAllText}>View all events</Text>
                <SFIcon name="chevron.right" fallback="chevron-forward" size={14} color={colors.primary} />
              </HapticPressable>
            )}
          </View>
        )}

        {/* Empty state for discovery */}
        {discoveryEventsWithPlaces.length === 0 && (
          <View style={styles.empty}>
            <SFIcon name="calendar" fallback="calendar-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No upcoming events yet</Text>
          </View>
        )}

        {/* End-of-list footer */}
        {discoveryEventsWithPlaces.length > 0 && (
          <View style={styles.footerContainer}>
            <SFIcon name="sparkles" fallback="sparkles" size={28} color={colors.gray300} />
            <Text style={styles.footerText}>That&apos;s everything for now</Text>
          </View>
        )}
      </ScrollView>

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
