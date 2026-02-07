import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventCard } from '../components/EventCard';
import { getUpcomingEvents } from '../data/mockEvents';
import { getPlaceById } from '../data/mockPlaces';
import { colors } from '../theme/colors';

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const eventsWithPlaces = getUpcomingEvents()
    .map((event) => {
      const place = getPlaceById(event.placeId);
      if (!place) return null;
      return { event, place };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>What's happening in Wellington</Text>
      </View>
      <FlatList
        data={eventsWithPlaces}
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
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  list: {
    paddingTop: 16,
    paddingBottom: 20,
  },
});
