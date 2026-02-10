import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, Place } from '../types';
import { useFollow } from '../context/FollowContext';
import { getProfilesByIds } from '../services/users';
import { useQuery } from '../hooks/useQuery';
import { colors } from '../theme/colors';

interface EventCardProps {
  event: Event;
  place: Place;
  onPress?: () => void;
}

export const CATEGORY_COLORS: Record<Event['category'], string> = {
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

const AVATAR_SIZE = 24;
const AVATAR_OVERLAP = 8;

export function EventCard({ event, place, onPress }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.category];
  const { followingIds } = useFollow();
  const attendeeIds = event.attendeeIds ?? [];

  const sortedAttendeeIds = useMemo(
    () =>
      [...attendeeIds].sort((a, b) => {
        const aFollowed = followingIds.includes(a);
        const bFollowed = followingIds.includes(b);
        if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
        return 0;
      }),
    [attendeeIds, followingIds],
  );

  const displayIds = sortedAttendeeIds.slice(0, 3);
  const fetchDisplayUsers = useCallback(
    () => getProfilesByIds(displayIds),
    [displayIds],
  );
  const { data: displayUsers } = useQuery(fetchDisplayUsers, displayIds);
  const displayAttendees = displayUsers ?? [];

  const totalCount = attendeeIds.length;

  const firstFollowedId = sortedAttendeeIds.find((id) => followingIds.includes(id));
  const firstFollowedUser = displayAttendees.find((u) => u.id === firstFollowedId);
  const firstFollowedName = firstFollowedUser?.displayName ?? null;

  let attendeeText = '';
  if (totalCount > 0) {
    if (firstFollowedName) {
      const othersCount = totalCount - 1;
      attendeeText = othersCount > 0
        ? `${firstFollowedName} and ${othersCount} ${othersCount === 1 ? 'other' : 'others'} going`
        : `${firstFollowedName} going`;
    } else {
      attendeeText = `${totalCount} going`;
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{CATEGORY_LABELS[event.category]}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.date}>{formatDate(event.date)}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                Share.share({ message: `${event.title} — ${formatDate(event.date)} at ${place.name}` });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.place}>{place.name}</Text>
          <Text style={styles.time}>{formatTime(event.startTime, event.endTime)}</Text>
        </View>
        {totalCount > 0 && (
          <View style={styles.attendeeRow}>
            <View style={styles.avatarStack}>
              {displayAttendees.map((user, index) => (
                <Image
                  key={user.id}
                  source={{ uri: user.avatarUrl }}
                  style={[
                    styles.attendeeAvatar,
                    { marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP },
                    { zIndex: displayAttendees.length - index },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.attendeeText}>{attendeeText}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  attendeeAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.cardBackground,
    backgroundColor: colors.gray200,
  },
  attendeeText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
});
