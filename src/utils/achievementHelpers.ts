import { getAchievementDefinition, getBadgeDefinition } from '../data/achievementDefinitions';
import { LevelDefinition } from '../types/Exploration';
import { ToastConfig } from '../context/ToastContext';

/**
 * Creates a toast configuration for achievement unlock notification
 */
export function createAchievementToast(achievementId: string): ToastConfig {
  const achievement = getAchievementDefinition(achievementId);

  if (!achievement) {
    return {
      message: `Achievement unlocked!`,
      type: 'achievement',
      duration: 4000,
    };
  }

  return {
    title: 'Achievement Unlocked',
    message: achievement.title,
    type: 'achievement',
    duration: 4000,
    icon: 'trophy',
  };
}

/**
 * Creates a toast for leveling up.
 */
export function createLevelUpToast(level: LevelDefinition): ToastConfig {
  return {
    title: 'Level Up!',
    message: `You're now Level ${level.level}: ${level.title}`,
    type: 'level_up',
    duration: 4500,
    icon: 'arrow-up-circle',
  };
}

/**
 * Creates a toast for earning a badge.
 */
export function createBadgeToast(badgeId: string): ToastConfig {
  const badge = getBadgeDefinition(badgeId);

  if (!badge) {
    return {
      message: 'New badge earned!',
      type: 'achievement',
      duration: 4000,
    };
  }

  return {
    title: 'Badge Earned',
    message: `${badge.iconName} ${badge.title}`,
    type: 'achievement',
    duration: 4000,
    icon: 'trophy',
  };
}
