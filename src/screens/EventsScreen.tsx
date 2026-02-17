import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { EventCard } from "../components/EventCard";
import { getUpcomingEvents } from "../services/events";
import { getPlaces } from "../services/places";
import { useQuery } from "../hooks/useQuery";
import { useFollow } from "../context/FollowContext";
import { useEventFilters } from "../context/EventFilterContext";
import { colors } from "../theme/colors";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";

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

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { isFollowing } = useFollow();
  const headerHeight = useHeaderHeight();
  const { selectedDateRange, selectedCategories, showFollowingOnly } =
    useEventFilters();

  const fetchEvents = useCallback(() => getUpcomingEvents(), []);
  const { data: events, loading: loadingEvents } = useQuery(fetchEvents);

  const fetchPlaces = useCallback(() => getPlaces(), []);
  const { data: places } = useQuery(fetchPlaces);

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
      return true;
    });
  }, [
    eventsWithPlaces,
    selectedDateRange,
    selectedCategories,
    showFollowingOnly,
    isFollowing,
  ]);

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0);

  const filterSummary = [
    selectedDateRange ? DATE_RANGE_LABELS[selectedDateRange] : null,
    selectedCategories.length === 1
      ? selectedCategories[0]
      : selectedCategories.length > 1
      ? `${selectedCategories.length} categories`
      : null,
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
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.event.id}
        renderItem={({ item }) => (
          <EventCard
            event={item.event}
            place={item.place}
            onPress={() => router.push(`/events/${item.event.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight,
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
            <Ionicons
              name="calendar-outline"
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
  filterSummaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterSummary: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
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
    color: colors.primary,
  },
});
