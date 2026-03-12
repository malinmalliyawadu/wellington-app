import type { PlaceCategory } from '../types';

/**
 * Suggested hashtag names for each place category.
 * Used to generate chip recommendations when a place is selected in post creation.
 */
export const categoryHashtags: Record<PlaceCategory, string[]> = {
  cafe: ['coffee', 'flatwhite', 'brunch', 'cafelife', 'coffeelover'],
  restaurant: ['foodie', 'dinner', 'eats', 'wellingtoneats', 'dining'],
  bar: ['drinks', 'cocktails', 'nightout', 'happyhour', 'craftbeer'],
  attraction: ['explore', 'sightseeing', 'mustvisit', 'wanderlust', 'daytripnz'],
  park: ['outdoors', 'nature', 'greenspace', 'walks', 'picnic'],
  venue: ['livemusic', 'gig', 'nightlife', 'performance', 'entertainment'],
  trail: ['hiking', 'trailrunning', 'tramping', 'walksnz', 'getoutside'],
  shop: ['shopping', 'shoplocal', 'wellingtonshops', 'retail', 'supportlocal'],
};
