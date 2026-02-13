export interface NeighborhoodBounds {
  id: string;
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Wellington neighborhood definitions using manual bounding boxes
// These cover the main areas of Wellington city
export const NEIGHBORHOODS: NeighborhoodBounds[] = [
  {
    id: 'cbd',
    name: 'CBD',
    minLat: -41.2895,
    maxLat: -41.2775,
    minLng: 174.7720,
    maxLng: 174.7810,
  },
  {
    id: 'te_aro',
    name: 'Te Aro',
    minLat: -41.2960,
    maxLat: -41.2860,
    minLng: 174.7720,
    maxLng: 174.7840,
  },
  {
    id: 'mount_victoria',
    name: 'Mount Victoria',
    minLat: -41.2970,
    maxLat: -41.2850,
    minLng: 174.7840,
    maxLng: 174.7980,
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    minLat: -41.2900,
    maxLat: -41.2780,
    minLng: 174.7750,
    maxLng: 174.7850,
  },
  {
    id: 'thorndon',
    name: 'Thorndon',
    minLat: -41.2800,
    maxLat: -41.2700,
    minLng: 174.7720,
    maxLng: 174.7820,
  },
];

/**
 * Determines which neighborhood a place belongs to based on its coordinates
 */
export function getNeighborhood(latitude: number, longitude: number): string | null {
  for (const neighborhood of NEIGHBORHOODS) {
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
  return NEIGHBORHOODS.map((n) => n.id);
}

/**
 * Get neighborhood name by ID
 */
export function getNeighborhoodName(id: string): string | null {
  const neighborhood = NEIGHBORHOODS.find((n) => n.id === id);
  return neighborhood?.name ?? null;
}
