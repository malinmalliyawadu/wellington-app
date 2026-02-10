import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EventCard, CATEGORY_COLORS } from '../components/EventCard';
import { getUpcomingEvents } from '../services/events';
import { getPlaces } from '../services/places';
import { useQuery } from '../hooks/useQuery';
import { useFollow } from '../context/FollowContext';
import { Event } from '../types';
import { colors } from '../theme/colors';

type EventCategory = Event['category'];
type DateRange = 'today' | 'tomorrow' | 'weekend' | 'month';

const DATE_RANGES: { key: DateRange; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'tomorrow', label: 'Tomorrow', icon: 'arrow-forward' },
  { key: 'weekend', label: 'This Weekend', icon: 'sunny' },
  { key: 'month', label: 'This Month', icon: 'calendar' },
];

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
      const day = now.getDay(); // 0=Sun, 6=Sat
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

const ALL_CATEGORIES: EventCategory[] = [
  'music',
  'comedy',
  'art',
  'food',
  'market',
  'community',
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Music',
  comedy: 'Comedy',
  art: 'Art',
  food: 'Food & Drink',
  market: 'Market',
  community: 'Community',
};

const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  music: 'musical-notes',
  comedy: 'happy',
  art: 'color-palette',
  food: 'restaurant',
  market: 'cart',
  community: 'people',
};

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This Weekend',
  month: 'This Month',
};

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFollowing } = useFollow();

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

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

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const dateLabel = selectedDateRange ? DATE_RANGE_LABELS[selectedDateRange] : 'When';
  const categoryLabel =
    selectedCategories.length === 0
      ? 'Category'
      : selectedCategories.length === 1
        ? CATEGORY_LABELS[selectedCategories[0]]
        : `${selectedCategories.length} categories`;

  if (loadingEvents) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>What's happening in Wellington</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.dropdown, selectedDateRange != null && styles.dropdownActive]}
          onPress={() => setShowDateSheet(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={selectedDateRange ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[styles.dropdownLabel, selectedDateRange != null && styles.dropdownLabelActive]}
            numberOfLines={1}
          >
            {dateLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={selectedDateRange ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dropdown, selectedCategories.length > 0 && styles.dropdownActive]}
          onPress={() => setShowCategorySheet(true)}
        >
          <Ionicons
            name="grid-outline"
            size={16}
            color={selectedCategories.length > 0 ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.dropdownLabel,
              selectedCategories.length > 0 && styles.dropdownLabelActive,
            ]}
            numberOfLines={1}
          >
            {categoryLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={selectedCategories.length > 0 ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, showFollowingOnly ? styles.chipActive : styles.chipInactive]}
          onPress={() => setShowFollowingOnly((v) => !v)}
        >
          <Ionicons
            name="people"
            size={14}
            color={showFollowingOnly ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.chipLabel,
              showFollowingOnly ? styles.chipLabelActive : styles.chipLabelInactive,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

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
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
      />

      {/* Date Range Sheet */}
      <Modal
        visible={showDateSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowDateSheet(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>When</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setSelectedDateRange(null);
                setShowDateSheet(false);
              }}
            >
              <Ionicons name="infinite" size={20} color={colors.text} />
              <Text style={styles.sheetOptionLabel}>Any time</Text>
              {selectedDateRange === null && (
                <Ionicons name="checkmark" size={20} color={colors.primary} style={styles.sheetCheck} />
              )}
            </TouchableOpacity>

            {DATE_RANGES.map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                style={styles.sheetOption}
                onPress={() => {
                  setSelectedDateRange(key);
                  setShowDateSheet(false);
                }}
              >
                <Ionicons name={icon} size={20} color={colors.text} />
                <Text style={styles.sheetOptionLabel}>{label}</Text>
                {selectedDateRange === key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} style={styles.sheetCheck} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Sheet */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowCategorySheet(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Category</Text>
              {selectedCategories.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedCategories([])}>
                  <Text style={styles.sheetClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {ALL_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              const catColor = CATEGORY_COLORS[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.sheetOption}
                  onPress={() => toggleCategory(cat)}
                >
                  <Ionicons name={CATEGORY_ICONS[cat]} size={20} color={catColor} />
                  <Text style={styles.sheetOptionLabel}>{CATEGORY_LABELS[cat]}</Text>
                  {active && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} style={styles.sheetCheck} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.sheetDoneButton}
              onPress={() => setShowCategorySheet(false)}
            >
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gray300,
    gap: 6,
  },
  dropdownActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    maxWidth: 100,
  },
  dropdownLabelActive: {
    color: '#FFFFFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 5,
    height: 36,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  chipLabelInactive: {
    color: colors.text,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Sheet styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sheetClearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: 12,
  },
  sheetOptionLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  sheetCheck: {
    marginLeft: 'auto',
  },
  sheetDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  sheetDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
