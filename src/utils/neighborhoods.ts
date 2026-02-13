export interface NeighborhoodBounds {
  id: string;
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Wellington neighborhood definitions - NON-OVERLAPPING
// To update these with Google API data, run: node scripts/fetch-neighborhood-boundaries.mjs
// These are manually defined fallbacks that cover the main areas of Wellington city
export const NEIGHBORHOODS: NeighborhoodBounds[] = [
  {
    id: 'thorndon',
    name: 'Thorndon',
    // North of CBD - historic suburb
    minLat: -41.2750,
    maxLat: -41.2650,
    minLng: 174.7730,
    maxLng: 174.7850,
  },
  {
    id: 'cbd',
    name: 'CBD',
    // Central business district
    minLat: -41.2885,
    maxLat: -41.2750,
    minLng: 174.7730,
    maxLng: 174.7810,
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    // Harbor-side area - east of CBD
    minLat: -41.2900,
    maxLat: -41.2750,
    minLng: 174.7810,
    maxLng: 174.7900,
  },
  {
    id: 'te_aro',
    name: 'Te Aro',
    // South of CBD - arts/cultural district
    minLat: -41.2970,
    maxLat: -41.2885,
    minLng: 174.7700,
    maxLng: 174.7840,
  },
  {
    id: 'mount_victoria',
    name: 'Mount Victoria',
    // East - residential hill suburb
    minLat: -41.2970,
    maxLat: -41.2850,
    minLng: 174.7840,
    maxLng: 174.8000,
  },
];

// Try to load cached boundaries from Google API if available
let cachedBoundaries: NeighborhoodBounds[] | null = null;
try {
  // This will be populated if you run the fetch script
  const boundaries = require('../data/neighborhoodBoundaries.json');
  if (Object.keys(boundaries).length > 0) {
    cachedBoundaries = Object.values(boundaries);
  }
} catch (e) {
  // File doesn't exist or is empty, use manual fallbacks
}

const ACTIVE_NEIGHBORHOODS = cachedBoundaries || NEIGHBORHOODS;

/**
 * Determines which neighborhood a place belongs to based on its coordinates
 */
export function getNeighborhood(latitude: number, longitude: number): string | null {
  for (const neighborhood of ACTIVE_NEIGHBORHOODS) {
    if (
      latitude >= neighborhood.minLat &&
      latitude <= neighborhood.maxLat &&
      longitude >= neighborhood.minLng &&
      longitude <= neighborhood.maxLng
    ) {
      return neighborhood.id;
    }
  }
  return null;
}

/**
 * Get all neighborhood IDs
 */
export function getAllNeighborhoodIds(): string[] {
  return ACTIVE_NEIGHBORHOODS.map((n) => n.id);
}

/**
 * Get neighborhood name by ID
 */
export function getNeighborhoodName(id: string): string | null {
  const neighborhood = ACTIVE_NEIGHBORHOODS.find((n) => n.id === id);
  return neighborhood?.name ?? null;
}
