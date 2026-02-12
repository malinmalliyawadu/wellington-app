import React, { useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { EventCard } from '../components/EventCard';
import { getUpcomingEvents } from '../services/events';
import { getPlaces } from '../services/places';
import { useQuery } from '../hooks/useQuery';
import { useFollow } from '../context/FollowContext';
import { useEventFilters } from '../context/EventFilterContext';
import { colors } from '../theme/colors';
import { HapticPressable } from 'src/components/HapticPressable';
import { FloatingCreateButton } from 'src/components/FloatingCreateButton';

type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This Weekend',
  month: 'This Month',
};

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (range) {
    case 'today':
      return { start: fmt(now), end: fmt(now) };
    case 'tomorrow': {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return { start: fmt(tomorrow), end: fmt(tomorrow) };
    }
    case 'weekend': {
      const day = now.getDay();
      const daysUntilSat = day === 0 ? 6 : 6 - day;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const start = day === 0 || day === 6 ? now : sat;
      return { start: fmt(start), end: fmt(sun) };
    }
    case 'month': {
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const {
    selectedDateRange,
    selectedCategories,
    showFollowingOnly,
  } = useEventFilters();

  const fetchEvents = useCallback(() => getUpcomingEvents(), []);
  const { data: events, loading: loadingEvents } = useQuery(fetchEvents);

  const fetchPlaces = useCallback(() => getPlaces(), []);
  const { data: places } = useQuery(fetchPlaces);

  const placeMap = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places],
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
    [events, placeMap],
  );

  const filteredEvents = useMemo(() => {
    return eventsWithPlaces.filter(({ event }) => {
      if (selectedDateRange) {
        const { start, end } = getDateRange(selectedDateRange);
        if (event.date < start || event.date > end) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.category)) {
        return false;
      }
      if (showFollowingOnly && !(event.attendeeIds ?? []).some((id) => isFollowing(id))) {
        return false;
      }
      return true;
    });
  }, [eventsWithPlaces, selectedDateRange, selectedCategories, showFollowingOnly, isFollowing]);

  const activeFilterCount =
    (selectedDateRange ? 1 : 0) + (selectedCategories.length > 0 ? 1 : 0) + (showFollowingOnly ? 1 : 0);

  const filterSummary = [
    selectedDateRange ? DATE_RANGE_LABELS[selectedDateRange] : null,
    selectedCategories.length === 1
      ? selectedCategories[0]
      : selectedCategories.length > 1
        ? `${selectedCategories.length} categories`
        : null,
    showFollowingOnly ? 'Following' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const openFilters = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const headerHeight = insets.top + (activeFilterCount > 0 ? 104 : 84); // Adjust for filter summary

  // Animate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0.95, 0.95],
    extrapolate: 'clamp',
  });

  if (loadingEvents) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
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
            paddingBottom: 40 + insets.bottom
          }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No events match your filters</Text>
            <HapticPressable onPress={openFilters}>
              <Text style={styles.emptyAction}>Adjust filters</Text>
            </HapticPressable>
          </View>
        }
      />

      <Animated.View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top,
            height: headerHeight,
          }
        ]}
      >
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Events</Text>
              <Text style={styles.subtitle}>What's happening in Wellington</Text>
            </View>
            <HapticPressable
              style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
              onPress={openFilters}
            >
              <Ionicons
                name="options"
                size={20}
                color={activeFilterCount > 0 ? '#FFFFFF' : colors.text}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </HapticPressable>
          </View>
          {activeFilterCount > 0 && (
            <Text style={styles.filterSummary}>{filterSummary}</Text>
          )}
        </View>
      </Animated.View>

      <FloatingCreateButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  filterSummary: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  emptyAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
