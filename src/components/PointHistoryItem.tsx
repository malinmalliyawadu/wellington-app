import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PointEntry, PointActionType } from '../types/Exploration';
import { fonts } from '../theme/fonts';
import { useTheme, type Colors } from '../theme/ThemeContext';

interface PointHistoryItemProps {
  entry: PointEntry;
}

const ACTION_CONFIG: Record<PointActionType, { label: string; icon: string }> = {
  post_photo: { label: 'Created a post', icon: '📸' },
  post_text: { label: 'Wrote a review', icon: '✏️' },
  like_received: { label: 'Received a like', icon: '❤️' },
  comment: { label: 'Left a comment', icon: '💬' },
  follow: { label: 'Followed someone', icon: '👤' },
  event_attend: { label: 'RSVPd to an event', icon: '🎉' },
  first_discover: { label: 'First to discover!', icon: '🚩' },
  event_create: { label: 'Created an event', icon: '🎪' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}

export function PointHistoryItem({ entry }: PointHistoryItemProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const config = ACTION_CONFIG[entry.actionType] ?? { label: 'Points earned', icon: '⭐' };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{config.icon}</Text>
      <View style={styles.info}>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.time}>{formatTimeAgo(entry.createdAt)}</Text>
      </View>
      <Text style={styles.points}>+{entry.points}</Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    icon: {
      fontSize: 20,
      marginRight: 12,
    },
    info: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    time: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textMuted,
      marginTop: 1,
    },
    points: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: '#27AE60',
    },
  });
