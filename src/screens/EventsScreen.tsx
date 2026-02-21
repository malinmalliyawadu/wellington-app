import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
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
import { getUpcomingEvents } from "../services/events";
import { getPlaces } from "../services/places";
import { useQuery } from "../hooks/useQuery";
import { useFollow } from "../context/FollowContext";
import { useEventFilters } from "../context/EventFilterContext";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { fonts } from "../theme/fonts";

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

type TimeSection =
  | "today"
  | "tonight"
  | "tomorrow"
  | "weekend"
  | "thisMonth"
  | "comingUp";

const SECTION_LABELS: Record<TimeSection, string> = {
  today: "Today",
  tonight: "Tonight",
  tomorrow: "Tomorrow",
  weekend: "This Weekend",
  thisMonth: "This Month",
  comingUp: "Coming Up",
};

const SECTION_ICONS: Record<TimeSection, { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }> = {
  today: { sf: "sun.max.fill", fallback: "sunny" },
  tonight: { sf: "moon.fill", fallback: "moon" },
  tomorrow: { sf: "arrow.right.circle", fallback: "arrow-forward-circle" },
  weekend: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  thisMonth: { sf: "calendar", fallback: "calendar" },
  comingUp: { sf: "binoculars.fill", fallback: "telescope" },
};

const SECTION_ORDER: TimeSection[] = [
  "today",
  "tonight",
  "tomorrow",
  "weekend",
  "thisMonth",
  "comingUp",
];

function getEventSection(eventDate: string, startTime: string): TimeSection {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const todayStr = fmt(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = fmt(tomorrowDate);

  if (eventDate === todayStr) {
    const hour = parseInt(startTime.split(":")[0], 10);
    return hour >= 17 ? "tonight" : "today";
  }

  if (eventDate === tomorrowStr) {
    return "tomorrow";
  }

  // Check if it falls on the nearest weekend (Sat/Sun)
  const day = now.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 0 ? 6 : 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const satStr = fmt(sat);
  const sunStr = fmt(sun);

  if (eventDate === satStr || eventDate === sunStr) {
    return "weekend";
  }

  // This month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (eventDate <= fmt(endOfMonth)) {
    return "thisMonth";
  }

  return "comingUp";
}

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { isFollowing } = useFollow();
  const headerHeight = useHeaderHeight();
  const { selectedDateRange, selectedCategories, showFollowingOnly, showFreeOnly } =
    useEventFilters();

  const fetchEvents = useCallback(() => getUpcomingEvents(), []);
  const { data: events, loading: loadingEvents, refetch: refetchEvents } = useQuery(fetchEvents, 'events');

  const fetchPlaces = useCallback(() => getPlaces(), []);
  const { data: places, refetch: refetchPlaces } = useQuery(fetchPlaces, 'places');

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchEvents();
    }, [refetchEvents])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchEvents(), refetchPlaces()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchEvents, refetchPlaces]);

  const placeMap = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places]
  );

  const eventsWithPlaces = useMemo(
    () =>
      (events ?? [])
        .map((event) => {
          const place = placeMap.get(event.placeId);
          if (!place) return null;
          return { event, place };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [events, placeMap]
  );

  const filteredEvents = useMemo(() => {
    return eventsWithPlaces.filter(({ event }) => {
      if (selectedDateRange) {
        const { start, end } = getDateRange(selectedDateRange);
        if (event.date < start || event.date > end) return false;
      }
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(event.category)
      ) {
        return false;
      }
      if (
        showFollowingOnly &&
        !(event.attendeeIds ?? []).some((id) => isFollowing(id))
      ) {
        return false;
      }
      if (showFreeOnly && event.price != null && event.price > 0) {
        return false;
      }
      return true;
    });
  }, [
    eventsWithPlaces,
    selectedDateRange,
    selectedCategories,
    showFollowingOnly,
    showFreeOnly,
    isFollowing,
  ]);

  const sections = useMemo(() => {
    const grouped = new Map<TimeSection, typeof filteredEvents>();
    for (const item of filteredEvents) {
      const section = getEventSection(item.event.date, item.event.startTime);
      if (!grouped.has(section)) grouped.set(section, []);
      grouped.get(section)!.push(item);
    }
    return SECTION_ORDER.filter((k) => grouped.has(k)).map((k, index) => ({
      key: k,
      title: SECTION_LABELS[k],
      icon: SECTION_ICONS[k],
      count: grouped.get(k)!.length,
      isFirst: index === 0,
      data: grouped.get(k)!,
    }));
  }, [filteredEvents]);

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0) +
    (showFreeOnly ? 1 : 0);

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

  const openFilters = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  if (loadingEvents) {
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

  return (
    <View style={styles.container}>
      <SectionList
        testID="events-list"
        sections={sections}
        keyExtractor={(item) => item.event.id}
        renderItem={({ item }) => (
          <EventCard
            event={item.event}
            place={item.place}
            onPress={() => router.push(`/events/${item.event.id}`)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              !section.isFirst && styles.sectionHeaderWithDivider,
            ]}
          >
            <View style={styles.sectionRow}>
              <SFIcon
                name={section.icon.sf}
                fallback={section.icon.fallback}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{section.count}</Text>
              </View>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentInset={{ top: headerHeight }}
        contentOffset={{ x: 0, y: -headerHeight }}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        ListHeaderComponent={
          activeFilterCount > 0 ? (
            <View style={styles.filterSummaryRow}>
              <Text style={styles.filterSummary}>{filterSummary}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeaderWithDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    marginTop: 8,
    paddingTop: 24,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  filterSummaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterSummary: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 20,
  },
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
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});
