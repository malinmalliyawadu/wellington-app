import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
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
import { useTheme } from "../theme/ThemeContext";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { QueryErrorState } from "../components/QueryErrorState";
import { QuickFilterChips } from "./events/QuickFilterChips";
import { FilteredEventsView } from "./events/FilteredEventsView";
import {
  type DateRange,
  DATE_RANGE_LABELS,
  getDateRange,
  type EventWithPlace,
  type DiscoveryItem,
  classifySections,
} from "./events/eventsHelpers";
import { createStyles } from "./events/eventsStyles";

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
          return (
            <QuickFilterChips
              isChipActive={isChipActive}
              onChipPress={handleChipPress}
              advancedFilterCount={advancedFilterCount}
              styles={styles}
              colors={colors}
            />
          );
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
      isChipActive,
      handleChipPress,
      advancedFilterCount,
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
      <FilteredEventsView
        filteredEventsWithPlaces={filteredEventsWithPlaces}
        navigateToEvent={navigateToEvent}
        attendeeProfiles={attendeeProfiles ?? undefined}
        handleLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        filterSummary={filterSummary}
        isChipActive={isChipActive}
        onChipPress={handleChipPress}
        advancedFilterCount={advancedFilterCount}
        openFilters={openFilters}
        styles={styles}
        colors={colors}
      />
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
