import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFollowing } = useFollow();

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

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
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.category)) {
        return false;
      }
      if (showFollowingOnly && !(event.attendeeIds ?? []).some((id) => isFollowing(id))) {
        return false;
      }
      return true;
    });
  }, [eventsWithPlaces, selectedCategories, showFollowingOnly, isFollowing]);

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
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

        {ALL_CATEGORIES.map((cat) => {
          const active = selectedCategories.includes(cat);
          const catColor = CATEGORY_COLORS[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                active ? [styles.chipActive, { backgroundColor: catColor }] : styles.chipInactive,
              ]}
              onPress={() => toggleCategory(cat)}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat]}
                size={14}
                color={active ? '#FFFFFF' : catColor}
              />
              <Text
                style={[
                  styles.chipLabel,
                  active ? styles.chipLabelActive : styles.chipLabelInactive,
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  chipsRow: {
    flexGrow: 0,
    paddingTop: 4,
    paddingLeft: 16,
    paddingBottom: 12,
  },
  chipsContent: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
    display: 'flex',
    justifyContent: 'center',
    height: 32,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
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
    paddingTop: 16,
    paddingBottom: 20,
  },
});
