import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Event, Place } from '../types';
import { colors } from '../theme/colors';

interface EventCardProps {
  event: Event;
  place: Place;
}

const CATEGORY_COLORS: Record<Event['category'], string> = {
  music: '#7209B7',
  comedy: '#F72585',
  art: '#4361EE',
  food: '#E85D04',
  market: '#2D6A4F',
  community: '#0077B6',
};

const CATEGORY_LABELS: Record<Event['category'], string> = {
  music: 'Music',
  comedy: 'Comedy',
  art: 'Art',
  food: 'Food & Drink',
  market: 'Market',
  community: 'Community',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-NZ', options);
}

function formatTime(time: string, endTime?: string): string {
  const formatSingleTime = (t: string) => {
    const [hours, minutes] = t.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    return `${hour12}${minutes !== '00' ? `:${minutes}` : ''}${suffix}`;
  };

  if (endTime) {
    return `${formatSingleTime(time)} - ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(time);
}

export function EventCard({ event, place }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.category];

  return (
    <View style={styles.container}>
      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{CATEGORY_LABELS[event.category]}</Text>
          </View>
          <Text style={styles.date}>{formatDate(event.date)}</Text>
        </View>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.place}>{place.name}</Text>
          <Text style={styles.time}>{formatTime(event.startTime, event.endTime)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.gray200,
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  place: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
