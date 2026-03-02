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

// --- Points & Leveling System ---

export type PointActionType =
  | 'post_photo'
  | 'post_text'
  | 'like_received'
  | 'comment'
  | 'follow'
  | 'event_attend'
  | 'first_discover'
  | 'event_create';

export interface PointEntry {
  id: string;
  userId: string;
  actionType: PointActionType;
  points: number;
  referenceId?: string;
  createdAt: string;
}

export interface UserPointTotals {
  userId: string;
  totalPoints: number;
  level: number;
  pointsByAction: Record<string, number>;
  updatedAt: string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  pointsRequired: number;
  color: string;
  illustration?: number;
}

export type BadgeType = 'level' | 'activity' | 'wellington';

export interface BadgeRequirement {
  type: 'level' | 'action_count' | 'category_explore' | 'event_category' | 'all_actions';
  level?: number;
  actionType?: PointActionType;
  count?: number;
  category?: string;
  eventCategories?: string[];
}

export interface BadgeDefinition {
  id: string;
  badgeType: BadgeType;
  title: string;
  description: string;
  iconName: string;
  badgeColor: string;
  requirement: BadgeRequirement;
  sortOrder: number;
}

export interface BadgeProgress extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress?: number;
  requiredProgress?: number;
}
