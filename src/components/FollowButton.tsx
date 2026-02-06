import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFollow } from '../context/FollowContext';
import { colors } from '../theme/colors';

interface FollowButtonProps {
  userId: string;
  compact?: boolean;
}

export function FollowButton({ userId, compact }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = useFollow();
  const following = isFollowing(userId);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        following ? styles.followingButton : styles.followButton,
        compact && styles.compact,
      ]}
      onPress={() => toggleFollow(userId)}
    >
      <Text
        style={[
          styles.text,
          following ? styles.followingText : styles.followText,
          compact && styles.compactText,
        ]}
      >
        {following ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  followButton: {
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 13,
  },
  followText: {
    color: '#FFFFFF',
  },
  followingText: {
    color: colors.text,
  },
});
