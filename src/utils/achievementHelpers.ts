import { getAchievementDefinition } from '../data/achievementDefinitions';
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
    message: `🏆 ${achievement.title}`,
    type: 'achievement',
    duration: 4000,
    icon: 'trophy',
  };
}
