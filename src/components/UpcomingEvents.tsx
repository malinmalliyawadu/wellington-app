import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { fonts } from "../theme/fonts";
import { EventCard } from "./EventCard";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { Event, Place } from "../types";

interface UpcomingEventsProps {
  events: (Event & { place?: Place })[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();

  const eventsWithPlace = events.filter(
    (e): e is Event & { place: Place } => e.place != null
  );

  if (eventsWithPlace.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {eventsWithPlace.map((event) => (
          <View key={event.id} style={styles.cardWrapper}>
            <EventCard
              event={event}
              place={event.place}
              onPress={() => router.push(`/events/${event.id}`)}
              variant="small"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: 300,
    marginRight: 12,
    overflow: "hidden",
  },
});
