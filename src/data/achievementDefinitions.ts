import { AchievementDefinition } from '../types/Exploration';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Category achievements (6 total)
  {
    id: 'cafe_explorer',
    type: 'category',
    title: 'Cafe Connoisseur',
    description: 'Visited all cafes in Wellington',
    iconName: '☕',
    requirement: { category: 'cafe' },
    badgeColor: '#8B4513',
    sortOrder: 1,
  },
  {
    id: 'restaurant_explorer',
    type: 'category',
    title: 'Foodie',
    description: 'Visited all restaurants in Wellington',
    iconName: '🍽️',
    requirement: { category: 'restaurant' },
    badgeColor: '#FF6B35',
    sortOrder: 2,
  },
  {
    id: 'bar_explorer',
    type: 'category',
    title: 'Bar Hopper',
    description: 'Visited all bars in Wellington',
    iconName: '🍷',
    requirement: { category: 'bar' },
    badgeColor: '#9B59B6',
    sortOrder: 3,
  },
  {
    id: 'attraction_explorer',
    type: 'category',
    title: 'Tourist',
    description: 'Visited all attractions in Wellington',
    iconName: '🎡',
    requirement: { category: 'attraction' },
    badgeColor: '#3498DB',
    sortOrder: 4,
  },
  {
    id: 'park_explorer',
    type: 'category',
    title: 'Nature Lover',
    description: 'Visited all parks in Wellington',
    iconName: '🌿',
    requirement: { category: 'park' },
    badgeColor: '#27AE60',
    sortOrder: 5,
  },
  {
    id: 'venue_explorer',
    type: 'category',
    title: 'Event Enthusiast',
    description: 'Visited all event venues in Wellington',
    iconName: '🎭',
    requirement: { category: 'venue' },
    badgeColor: '#E74C3C',
    sortOrder: 6,
  },

  // Milestone achievements (4 total)
  {
    id: 'explorer_5',
    type: 'milestone',
    title: 'Getting Started',
    description: 'Explored 5 places in Wellington',
    iconName: '⭐',
    requirement: { count: 5 },
    badgeColor: '#95A5A6',
    sortOrder: 7,
  },
  {
    id: 'explorer_10',
    type: 'milestone',
    title: 'Explorer',
    description: 'Explored 10 places in Wellington',
    iconName: '🌟',
    requirement: { count: 10 },
    badgeColor: '#E67E22',
    sortOrder: 8,
  },
  {
    id: 'explorer_15',
    type: 'milestone',
    title: 'Adventurer',
    description: 'Explored 15 places in Wellington',
    iconName: '🏅',
    requirement: { count: 15 },
    badgeColor: '#F39C12',
    sortOrder: 9,
  },
  {
    id: 'local_legend_22',
    type: 'milestone',
    title: 'Local Legend',
    description: 'Explored all 22 places in Wellington',
    iconName: '👑',
    requirement: { count: 22 },
    badgeColor: '#FFD700',
    sortOrder: 10,
  },

  // Neighborhood achievements (5 total)
  {
    id: 'cbd_explorer',
    type: 'neighborhood',
    title: 'CBD Explorer',
    description: 'Visited all places in the CBD',
    iconName: '🏙️',
    requirement: { neighborhood: 'cbd' },
    badgeColor: '#34495E',
    sortOrder: 11,
  },
  {
    id: 'te_aro_explorer',
    type: 'neighborhood',
    title: 'Te Aro Local',
    description: 'Visited all places in Te Aro',
    iconName: '🏘️',
    requirement: { neighborhood: 'te_aro' },
    badgeColor: '#16A085',
    sortOrder: 12,
  },
  {
    id: 'mount_victoria_explorer',
    type: 'neighborhood',
    title: 'Mount Victoria Climber',
    description: 'Visited all places in Mount Victoria',
    iconName: '⛰️',
    requirement: { neighborhood: 'mount_victoria' },
    badgeColor: '#27AE60',
    sortOrder: 13,
  },
  {
    id: 'waterfront_explorer',
    type: 'neighborhood',
    title: 'Waterfront Wanderer',
    description: 'Visited all places on the Waterfront',
    iconName: '🌊',
    requirement: { neighborhood: 'waterfront' },
    badgeColor: '#3498DB',
    sortOrder: 14,
  },
  {
    id: 'thorndon_explorer',
    type: 'neighborhood',
    title: 'Thorndon Trekker',
    description: 'Visited all places in Thorndon',
    iconName: '🏛️',
    requirement: { neighborhood: 'thorndon' },
    badgeColor: '#8E44AD',
    sortOrder: 15,
  },

  // Social achievements (3 total)
  {
    id: 'first_explorer',
    type: 'social',
    title: 'First Explorer',
    description: 'Be the first among your friends to discover a place',
    iconName: '🚩',
    requirement: { type: 'first_to_discover' },
    badgeColor: '#E74C3C',
    sortOrder: 16,
  },
  {
    id: 'social_butterfly',
    type: 'social',
    title: 'Social Butterfly',
    description: 'Visit 5 places where friends have posted',
    iconName: '🦋',
    requirement: { type: 'visit_friend_places', count: 5 },
    badgeColor: '#F39C12',
    sortOrder: 17,
  },
  {
    id: 'friend_tracker',
    type: 'social',
    title: 'Friend Tracker',
    description: 'Visit a place within 24 hours of a friend',
    iconName: '📍',
    requirement: { type: 'visit_within_24h' },
    badgeColor: '#9B59B6',
    sortOrder: 18,
  },
];

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

/**
 * Get all achievements of a specific type
 */
export function getAchievementsByType(type: string): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === type);
}
