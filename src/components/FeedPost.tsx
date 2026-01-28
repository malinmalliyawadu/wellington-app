import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Post, User, Place } from '../types';
import { colors } from '../theme/colors';

interface FeedPostProps {
  post: Post;
  user: User;
  place: Place;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  return 'Just now';
}

export function FeedPost({ post, user, place }: FeedPostProps) {
  const categoryColor = colors.category[place.category];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
      </View>

      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} />
      )}

      <View style={styles.content}>
        <Text style={styles.caption}>{post.content}</Text>
        <View style={[styles.placeBadge, { backgroundColor: categoryColor + '15' }]}>
          <View style={[styles.placeDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.placeName, { color: categoryColor }]}>{place.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timeAgo: {
    fontSize: 13,
    color: colors.textMuted,
  },
  media: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray200,
  },
  content: {
    padding: 12,
  },
  caption: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  placeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '500',
  },
});
