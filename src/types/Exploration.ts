import { ExplorationMethod, AchievementType } from './database';

export interface UserExploration {
  userId: string;
  placeId: string;
  exploredAt: string;
  explorationMethod: ExplorationMethod;
}

export interface AchievementRequirement {
  category?: string;
  count?: number;
  neighborhood?: string;
  [key: string]: any;
}

export interface AchievementDefinition {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  iconName: string;
  requirement: AchievementRequirement;
  badgeColor: string;
  sortOrder: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: Record<string, any>;
}

export interface AchievementProgress extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress?: number;
  requiredProgress?: number;
}

export interface ExplorationStats {
  totalPlaces: number;
  byCategory: Record<string, number>;
  byNeighborhood: Record<string, number>;
}
