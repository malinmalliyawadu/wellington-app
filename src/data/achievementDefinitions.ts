import { AchievementDefinition, PointActionType, LevelDefinition, BadgeDefinition } from '../types/Exploration';

// --- Legacy achievement definitions (kept for backward compat) ---

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'cafe_explorer', type: 'category', title: 'Cafe Connoisseur', description: 'Visited all cafes in Wellington', iconName: '☕', requirement: { category: 'cafe' }, badgeColor: '#8B4513', sortOrder: 1 },
  { id: 'restaurant_explorer', type: 'category', title: 'Foodie', description: 'Visited all restaurants in Wellington', iconName: '🍽️', requirement: { category: 'restaurant' }, badgeColor: '#FF6B35', sortOrder: 2 },
  { id: 'bar_explorer', type: 'category', title: 'Bar Hopper', description: 'Visited all bars in Wellington', iconName: '🍷', requirement: { category: 'bar' }, badgeColor: '#9B59B6', sortOrder: 3 },
  { id: 'attraction_explorer', type: 'category', title: 'Tourist', description: 'Visited all attractions in Wellington', iconName: '🎡', requirement: { category: 'attraction' }, badgeColor: '#3498DB', sortOrder: 4 },
  { id: 'park_explorer', type: 'category', title: 'Nature Lover', description: 'Visited all parks in Wellington', iconName: '🌿', requirement: { category: 'park' }, badgeColor: '#27AE60', sortOrder: 5 },
  { id: 'venue_explorer', type: 'category', title: 'Event Enthusiast', description: 'Visited all event venues in Wellington', iconName: '🎭', requirement: { category: 'venue' }, badgeColor: '#E74C3C', sortOrder: 6 },
  { id: 'explorer_5', type: 'milestone', title: 'Getting Started', description: 'Explored 5 places in Wellington', iconName: '⭐', requirement: { count: 5 }, badgeColor: '#95A5A6', sortOrder: 7 },
  { id: 'explorer_10', type: 'milestone', title: 'Explorer', description: 'Explored 10 places in Wellington', iconName: '🌟', requirement: { count: 10 }, badgeColor: '#E67E22', sortOrder: 8 },
  { id: 'explorer_15', type: 'milestone', title: 'Adventurer', description: 'Explored 15 places in Wellington', iconName: '🏅', requirement: { count: 15 }, badgeColor: '#F39C12', sortOrder: 9 },
  { id: 'local_legend_22', type: 'milestone', title: 'Local Legend', description: 'Explored all 22 places in Wellington', iconName: '👑', requirement: { count: 22 }, badgeColor: '#FFD700', sortOrder: 10 },
  { id: 'cbd_explorer', type: 'neighborhood', title: 'CBD Explorer', description: 'Visited all places in the CBD', iconName: '🏙️', requirement: { neighborhood: 'cbd' }, badgeColor: '#34495E', sortOrder: 11 },
  { id: 'te_aro_explorer', type: 'neighborhood', title: 'Te Aro Local', description: 'Visited all places in Te Aro', iconName: '🏘️', requirement: { neighborhood: 'te_aro' }, badgeColor: '#16A085', sortOrder: 12 },
  { id: 'mount_victoria_explorer', type: 'neighborhood', title: 'Mount Victoria Climber', description: 'Visited all places in Mount Victoria', iconName: '⛰️', requirement: { neighborhood: 'mount_victoria' }, badgeColor: '#27AE60', sortOrder: 13 },
  { id: 'waterfront_explorer', type: 'neighborhood', title: 'Waterfront Wanderer', description: 'Visited all places on the Waterfront', iconName: '🌊', requirement: { neighborhood: 'waterfront' }, badgeColor: '#3498DB', sortOrder: 14 },
  { id: 'thorndon_explorer', type: 'neighborhood', title: 'Thorndon Trekker', description: 'Visited all places in Thorndon', iconName: '🏛️', requirement: { neighborhood: 'thorndon' }, badgeColor: '#8E44AD', sortOrder: 15 },
  { id: 'first_explorer', type: 'social', title: 'First Explorer', description: 'Be the first among your friends to discover a place', iconName: '🚩', requirement: { type: 'first_to_discover' }, badgeColor: '#E74C3C', sortOrder: 16 },
  { id: 'social_butterfly', type: 'social', title: 'Social Butterfly', description: 'Visit 5 places where friends have posted', iconName: '🦋', requirement: { type: 'visit_friend_places', count: 5 }, badgeColor: '#F39C12', sortOrder: 17 },
  { id: 'friend_tracker', type: 'social', title: 'Friend Tracker', description: 'Visit a place within 24 hours of a friend', iconName: '📍', requirement: { type: 'visit_within_24h' }, badgeColor: '#9B59B6', sortOrder: 18 },
];

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

export function getAchievementsByType(type: string): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === type);
}

// --- New Points & Leveling System ---

export const POINT_VALUES: Record<PointActionType, number> = {
  post_photo: 15,
  post_text: 10,
  like_received: 2,
  comment: 5,
  follow: 3,
  event_attend: 10,
  first_discover: 25,
  event_create: 20,
};

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: 'Fresh Arrival', pointsRequired: 0, color: '#95A5A6', illustration: require('../../assets/images/levels/level-1.png') },
  { level: 2, title: 'Wayfarer', pointsRequired: 50, color: '#7F8C8D', illustration: require('../../assets/images/levels/level-2.png') },
  { level: 3, title: 'Regular', pointsRequired: 150, color: '#27AE60', illustration: require('../../assets/images/levels/level-3.png') },
  { level: 4, title: 'Wanderer', pointsRequired: 350, color: '#2980B9', illustration: require('../../assets/images/levels/level-4.png') },
  { level: 5, title: 'In-the-Know', pointsRequired: 700, color: '#8E44AD', illustration: require('../../assets/images/levels/level-5.png') },
  { level: 6, title: 'City Advocate', pointsRequired: 1200, color: '#E67E22', illustration: require('../../assets/images/levels/level-6.png') },
  { level: 7, title: 'Pathfinder', pointsRequired: 2000, color: '#E74C3C', illustration: require('../../assets/images/levels/level-7.png') },
  { level: 8, title: 'Wellington Legend', pointsRequired: 3500, color: '#F39C12', illustration: require('../../assets/images/levels/level-8.png') },
  { level: 9, title: 'City Icon', pointsRequired: 6000, color: '#D4930D', illustration: require('../../assets/images/levels/level-9.png') },
  { level: 10, title: 'Te Whanganui-a-Tara Master', pointsRequired: 10000, color: '#FFD700', illustration: require('../../assets/images/levels/level-10.png') },
];

export function getLevelForPoints(points: number): LevelDefinition {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_DEFINITIONS[i].pointsRequired) {
      return LEVEL_DEFINITIONS[i];
    }
  }
  return LEVEL_DEFINITIONS[0];
}

export function getPointsToNextLevel(points: number): { next: LevelDefinition | null; pointsNeeded: number; progress: number } {
  const current = getLevelForPoints(points);
  const nextIndex = LEVEL_DEFINITIONS.findIndex((l) => l.level === current.level + 1);

  if (nextIndex === -1) {
    return { next: null, pointsNeeded: 0, progress: 1 };
  }

  const next = LEVEL_DEFINITIONS[nextIndex];
  const pointsNeeded = next.pointsRequired - points;
  const rangeSize = next.pointsRequired - current.pointsRequired;
  const progress = rangeSize > 0 ? (points - current.pointsRequired) / rangeSize : 1;

  return { next, pointsNeeded, progress };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Level Badges (10)
  { id: 'level_1', badgeType: 'level', title: 'Fresh Arrival', description: 'Welcome to Wellington!', iconName: '👋', badgeColor: '#95A5A6', requirement: { type: 'level', level: 1 }, sortOrder: 1 },
  { id: 'level_2', badgeType: 'level', title: 'Wayfarer', description: 'Reached Level 2', iconName: '🎒', badgeColor: '#7F8C8D', requirement: { type: 'level', level: 2 }, sortOrder: 2 },
  { id: 'level_3', badgeType: 'level', title: 'Regular', description: 'Reached Level 3', iconName: '🏠', badgeColor: '#27AE60', requirement: { type: 'level', level: 3 }, sortOrder: 3 },
  { id: 'level_4', badgeType: 'level', title: 'Wanderer', description: 'Reached Level 4', iconName: '🧭', badgeColor: '#2980B9', requirement: { type: 'level', level: 4 }, sortOrder: 4 },
  { id: 'level_5', badgeType: 'level', title: 'In-the-Know', description: 'Reached Level 5', iconName: '🔑', badgeColor: '#8E44AD', requirement: { type: 'level', level: 5 }, sortOrder: 5 },
  { id: 'level_6', badgeType: 'level', title: 'City Advocate', description: 'Reached Level 6', iconName: '🌟', badgeColor: '#E67E22', requirement: { type: 'level', level: 6 }, sortOrder: 6 },
  { id: 'level_7', badgeType: 'level', title: 'Pathfinder', description: 'Reached Level 7', iconName: '🔥', badgeColor: '#E74C3C', requirement: { type: 'level', level: 7 }, sortOrder: 7 },
  { id: 'level_8', badgeType: 'level', title: 'Wellington Legend', description: 'Reached Level 8', iconName: '⚡', badgeColor: '#F39C12', requirement: { type: 'level', level: 8 }, sortOrder: 8 },
  { id: 'level_9', badgeType: 'level', title: 'City Icon', description: 'Reached Level 9', iconName: '💎', badgeColor: '#D4930D', requirement: { type: 'level', level: 9 }, sortOrder: 9 },
  { id: 'level_10', badgeType: 'level', title: 'Te Whanganui-a-Tara Master', description: 'Reached Level 10', iconName: '👑', badgeColor: '#FFD700', requirement: { type: 'level', level: 10 }, sortOrder: 10 },

  // Activity Badges (8)
  { id: 'first_post', badgeType: 'activity', title: 'First Post', description: 'Create your first post', iconName: '📝', badgeColor: '#3498DB', requirement: { type: 'action_count', actionType: 'post_photo', count: 1 }, sortOrder: 11 },
  { id: 'storyteller', badgeType: 'activity', title: 'Storyteller', description: 'Create 10 posts', iconName: '📖', badgeColor: '#2980B9', requirement: { type: 'action_count', actionType: 'post_photo', count: 10 }, sortOrder: 12 },
  { id: 'crowd_favorite', badgeType: 'activity', title: 'Crowd Favorite', description: 'Receive 50 likes total', iconName: '❤️', badgeColor: '#E0245E', requirement: { type: 'action_count', actionType: 'like_received', count: 50 }, sortOrder: 13 },
  { id: 'social_connector', badgeType: 'activity', title: 'Social Connector', description: 'Follow 10 people', iconName: '🤝', badgeColor: '#8E44AD', requirement: { type: 'action_count', actionType: 'follow', count: 10 }, sortOrder: 14 },
  { id: 'commentator', badgeType: 'activity', title: 'Commentator', description: 'Write 25 comments', iconName: '💬', badgeColor: '#16A085', requirement: { type: 'action_count', actionType: 'comment', count: 25 }, sortOrder: 15 },
  { id: 'event_goer', badgeType: 'activity', title: 'Event Goer', description: 'Attend 5 events', iconName: '🎉', badgeColor: '#E67E22', requirement: { type: 'action_count', actionType: 'event_attend', count: 5 }, sortOrder: 16 },
  { id: 'pioneer', badgeType: 'activity', title: 'Pioneer', description: 'Be first to discover 3 places', iconName: '🚩', badgeColor: '#E74C3C', requirement: { type: 'action_count', actionType: 'first_discover', count: 3 }, sortOrder: 17 },
  { id: 'content_creator', badgeType: 'activity', title: 'Content Creator', description: 'Create 5 events', iconName: '🎪', badgeColor: '#9B59B6', requirement: { type: 'action_count', actionType: 'event_create', count: 5 }, sortOrder: 18 },

  // Wellington Badges (6)
  { id: 'cafe_culture', badgeType: 'wellington', title: 'Cafe Culture', description: 'Explore 5 cafes', iconName: '☕', badgeColor: '#8B4513', requirement: { type: 'category_explore', category: 'cafe', count: 5 }, sortOrder: 19 },
  { id: 'night_owl', badgeType: 'wellington', title: 'Night Owl', description: 'Explore 5 bars', iconName: '🦉', badgeColor: '#9B59B6', requirement: { type: 'category_explore', category: 'bar', count: 5 }, sortOrder: 20 },
  { id: 'nature_walker', badgeType: 'wellington', title: 'Nature Walker', description: 'Explore 5 parks or trails', iconName: '🌿', badgeColor: '#27AE60', requirement: { type: 'category_explore', category: 'park', count: 5 }, sortOrder: 21 },
  { id: 'foodie_badge', badgeType: 'wellington', title: 'Foodie', description: 'Explore 5 restaurants', iconName: '🍽️', badgeColor: '#E85D04', requirement: { type: 'category_explore', category: 'restaurant', count: 5 }, sortOrder: 22 },
  { id: 'culture_vulture', badgeType: 'wellington', title: 'Culture Vulture', description: 'Attend 5 cultural, art, or music events', iconName: '🎭', badgeColor: '#B91C1C', requirement: { type: 'event_category', eventCategories: ['cultural', 'art', 'music'], count: 5 }, sortOrder: 23 },
  { id: 'all_rounder', badgeType: 'wellington', title: 'All-Rounder', description: 'Earn points from all action types', iconName: '🏆', badgeColor: '#FFD700', requirement: { type: 'all_actions' }, sortOrder: 24 },
];

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

export function getBadgesByType(type: BadgeDefinition['badgeType']): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.badgeType === type);
}
