import React from 'react';
import { useFollow } from '../context/FollowContext';
import { LiquidGlassButton } from './LiquidGlassButton';

interface FollowButtonProps {
  userId: string;
  compact?: boolean;
}

export function FollowButton({ userId, compact }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = useFollow();
  const following = isFollowing(userId);

  return (
    <LiquidGlassButton
      title={following ? 'Following' : 'Follow'}
      variant={following ? 'secondary' : 'primary'}
      size={compact ? 'small' : 'medium'}
      onPress={() => toggleFollow(userId)}
    />
  );
}
