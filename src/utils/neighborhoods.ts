export interface Neighborhood {
  id: string;
  name: string;
  polygon: { latitude: number; longitude: number }[];
}

// Compute centroid for label placement
export function getNeighborhoodCenter(neighborhood: Neighborhood): {
  latitude: number;
  longitude: number;
} {
  const { polygon } = neighborhood;
  const lat =
    polygon.reduce((sum, p) => sum + p.latitude, 0) / polygon.length;
  const lng =
    polygon.reduce((sum, p) => sum + p.longitude, 0) / polygon.length;
  return { latitude: lat, longitude: lng };
}

// Point-in-polygon test using ray casting algorithm
function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: { latitude: number; longitude: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].latitude;
    const xi = polygon[i].longitude;
    const yj = polygon[j].latitude;
    const xj = polygon[j].longitude;

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Wellington region neighborhoods with polygon boundaries
export const NEIGHBORHOODS: Neighborhood[] = [
  // === INNER WELLINGTON ===
  {
    id: 'thorndon',
    name: 'Thorndon',
    polygon: [
      { latitude: -41.2640, longitude: 174.7700 },
      { latitude: -41.2630, longitude: 174.7790 },
      { latitude: -41.2700, longitude: 174.7850 },
      { latitude: -41.2770, longitude: 174.7810 },
      { latitude: -41.2760, longitude: 174.7740 },
      { latitude: -41.2690, longitude: 174.7700 },
    ],
  },
  {
    id: 'cbd',
    name: 'CBD',
    polygon: [
      { latitude: -41.2770, longitude: 174.7730 },
      { latitude: -41.2770, longitude: 174.7810 },
      { latitude: -41.2850, longitude: 174.7830 },
      { latitude: -41.2900, longitude: 174.7790 },
      { latitude: -41.2900, longitude: 174.7730 },
    ],
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    polygon: [
      { latitude: -41.2770, longitude: 174.7810 },
      { latitude: -41.2750, longitude: 174.7870 },
      { latitude: -41.2810, longitude: 174.7910 },
      { latitude: -41.2900, longitude: 174.7880 },
      { latitude: -41.2900, longitude: 174.7790 },
      { latitude: -41.2850, longitude: 174.7830 },
    ],
  },
  {
    id: 'te_aro',
    name: 'Te Aro',
    polygon: [
      { latitude: -41.2900, longitude: 174.7680 },
      { latitude: -41.2900, longitude: 174.7860 },
      { latitude: -41.2960, longitude: 174.7880 },
      { latitude: -41.2980, longitude: 174.7860 },
      { latitude: -41.2980, longitude: 174.7680 },
    ],
  },
  {
    id: 'mount_victoria',
    name: 'Mount Victoria',
    polygon: [
      { latitude: -41.2850, longitude: 174.7860 },
      { latitude: -41.2850, longitude: 174.8000 },
      { latitude: -41.2950, longitude: 174.8020 },
      { latitude: -41.3000, longitude: 174.7960 },
      { latitude: -41.2980, longitude: 174.7860 },
    ],
  },

  // === WELLINGTON CITY - WEST ===
  {
    id: 'kelburn',
    name: 'Kelburn',
    polygon: [
      { latitude: -41.2760, longitude: 174.7620 },
      { latitude: -41.2760, longitude: 174.7730 },
      { latitude: -41.2900, longitude: 174.7730 },
      { latitude: -41.2900, longitude: 174.7640 },
      { latitude: -41.2830, longitude: 174.7600 },
    ],
  },
  {
    id: 'aro_valley',
    name: 'Aro Valley',
    polygon: [
      { latitude: -41.2900, longitude: 174.7540 },
      { latitude: -41.2900, longitude: 174.7680 },
      { latitude: -41.2980, longitude: 174.7680 },
      { latitude: -41.2980, longitude: 174.7560 },
      { latitude: -41.2950, longitude: 174.7540 },
    ],
  },
  {
    id: 'northland',
    name: 'Northland',
    polygon: [
      { latitude: -41.2690, longitude: 174.7540 },
      { latitude: -41.2690, longitude: 174.7700 },
      { latitude: -41.2760, longitude: 174.7700 },
      { latitude: -41.2800, longitude: 174.7620 },
      { latitude: -41.2800, longitude: 174.7540 },
    ],
  },
  {
    id: 'wadestown',
    name: 'Wadestown',
    polygon: [
      { latitude: -41.2560, longitude: 174.7560 },
      { latitude: -41.2560, longitude: 174.7700 },
      { latitude: -41.2640, longitude: 174.7700 },
      { latitude: -41.2690, longitude: 174.7680 },
      { latitude: -41.2690, longitude: 174.7560 },
    ],
  },
  {
    id: 'karori',
    name: 'Karori',
    polygon: [
      { latitude: -41.2700, longitude: 174.7200 },
      { latitude: -41.2680, longitude: 174.7540 },
      { latitude: -41.2800, longitude: 174.7540 },
      { latitude: -41.2900, longitude: 174.7540 },
      { latitude: -41.3020, longitude: 174.7480 },
      { latitude: -41.3020, longitude: 174.7200 },
    ],
  },

  // === WELLINGTON CITY - SOUTH ===
  {
    id: 'brooklyn',
    name: 'Brooklyn',
    polygon: [
      { latitude: -41.2980, longitude: 174.7440 },
      { latitude: -41.2980, longitude: 174.7680 },
      { latitude: -41.3060, longitude: 174.7700 },
      { latitude: -41.3120, longitude: 174.7680 },
      { latitude: -41.3120, longitude: 174.7440 },
    ],
  },
  {
    id: 'newtown',
    name: 'Newtown',
    polygon: [
      { latitude: -41.2980, longitude: 174.7680 },
      { latitude: -41.2980, longitude: 174.7880 },
      { latitude: -41.3080, longitude: 174.7920 },
      { latitude: -41.3150, longitude: 174.7900 },
      { latitude: -41.3150, longitude: 174.7680 },
    ],
  },
  {
    id: 'berhampore',
    name: 'Berhampore',
    polygon: [
      { latitude: -41.3150, longitude: 174.7680 },
      { latitude: -41.3150, longitude: 174.7880 },
      { latitude: -41.3260, longitude: 174.7860 },
      { latitude: -41.3260, longitude: 174.7700 },
      { latitude: -41.3200, longitude: 174.7680 },
    ],
  },
  {
    id: 'island_bay',
    name: 'Island Bay',
    polygon: [
      { latitude: -41.3260, longitude: 174.7560 },
      { latitude: -41.3260, longitude: 174.7860 },
      { latitude: -41.3400, longitude: 174.7900 },
      { latitude: -41.3480, longitude: 174.7760 },
      { latitude: -41.3450, longitude: 174.7560 },
    ],
  },

  // === WELLINGTON CITY - EAST ===
  {
    id: 'hataitai',
    name: 'Hataitai',
    polygon: [
      { latitude: -41.2930, longitude: 174.7980 },
      { latitude: -41.2920, longitude: 174.8150 },
      { latitude: -41.3000, longitude: 174.8180 },
      { latitude: -41.3060, longitude: 174.8150 },
      { latitude: -41.3060, longitude: 174.7960 },
      { latitude: -41.3000, longitude: 174.7960 },
    ],
  },
  {
    id: 'kilbirnie',
    name: 'Kilbirnie',
    polygon: [
      { latitude: -41.3060, longitude: 174.7880 },
      { latitude: -41.3060, longitude: 174.8120 },
      { latitude: -41.3140, longitude: 174.8150 },
      { latitude: -41.3220, longitude: 174.8120 },
      { latitude: -41.3220, longitude: 174.7880 },
    ],
  },
  {
    id: 'lyall_bay',
    name: 'Lyall Bay',
    polygon: [
      { latitude: -41.3220, longitude: 174.7880 },
      { latitude: -41.3220, longitude: 174.8100 },
      { latitude: -41.3350, longitude: 174.8080 },
      { latitude: -41.3400, longitude: 174.7950 },
      { latitude: -41.3380, longitude: 174.7880 },
    ],
  },
  {
    id: 'miramar',
    name: 'Miramar',
    polygon: [
      { latitude: -41.2980, longitude: 174.8150 },
      { latitude: -41.2960, longitude: 174.8350 },
      { latitude: -41.3050, longitude: 174.8420 },
      { latitude: -41.3220, longitude: 174.8420 },
      { latitude: -41.3240, longitude: 174.8150 },
      { latitude: -41.3060, longitude: 174.8150 },
    ],
  },
  {
    id: 'seatoun',
    name: 'Seatoun',
    polygon: [
      { latitude: -41.3220, longitude: 174.8200 },
      { latitude: -41.3220, longitude: 174.8480 },
      { latitude: -41.3380, longitude: 174.8500 },
      { latitude: -41.3420, longitude: 174.8350 },
      { latitude: -41.3400, longitude: 174.8200 },
    ],
  },

  // === NORTHERN WELLINGTON ===
  {
    id: 'ngaio',
    name: 'Ngaio',
    polygon: [
      { latitude: -41.2440, longitude: 174.7620 },
      { latitude: -41.2440, longitude: 174.7790 },
      { latitude: -41.2520, longitude: 174.7810 },
      { latitude: -41.2560, longitude: 174.7800 },
      { latitude: -41.2600, longitude: 174.7720 },
      { latitude: -41.2600, longitude: 174.7620 },
    ],
  },
  {
    id: 'crofton_downs',
    name: 'Crofton Downs',
    polygon: [
      { latitude: -41.2350, longitude: 174.7620 },
      { latitude: -41.2350, longitude: 174.7780 },
      { latitude: -41.2440, longitude: 174.7790 },
      { latitude: -41.2440, longitude: 174.7620 },
    ],
  },
  {
    id: 'khandallah',
    name: 'Khandallah',
    polygon: [
      { latitude: -41.2250, longitude: 174.7720 },
      { latitude: -41.2250, longitude: 174.7950 },
      { latitude: -41.2380, longitude: 174.7950 },
      { latitude: -41.2400, longitude: 174.7800 },
      { latitude: -41.2350, longitude: 174.7720 },
    ],
  },
  {
    id: 'johnsonville',
    name: 'Johnsonville',
    polygon: [
      { latitude: -41.2100, longitude: 174.7800 },
      { latitude: -41.2100, longitude: 174.8050 },
      { latitude: -41.2200, longitude: 174.8080 },
      { latitude: -41.2280, longitude: 174.8050 },
      { latitude: -41.2300, longitude: 174.7920 },
      { latitude: -41.2250, longitude: 174.7800 },
    ],
  },
  {
    id: 'newlands',
    name: 'Newlands',
    polygon: [
      { latitude: -41.2050, longitude: 174.8050 },
      { latitude: -41.2050, longitude: 174.8300 },
      { latitude: -41.2150, longitude: 174.8320 },
      { latitude: -41.2220, longitude: 174.8300 },
      { latitude: -41.2280, longitude: 174.8050 },
    ],
  },
  {
    id: 'tawa',
    name: 'Tawa',
    polygon: [
      { latitude: -41.1680, longitude: 174.8100 },
      { latitude: -41.1680, longitude: 174.8350 },
      { latitude: -41.1800, longitude: 174.8400 },
      { latitude: -41.1960, longitude: 174.8400 },
      { latitude: -41.1960, longitude: 174.8150 },
      { latitude: -41.1850, longitude: 174.8100 },
    ],
  },

  // === PORIRUA ===
  {
    id: 'porirua',
    name: 'Porirua',
    polygon: [
      { latitude: -41.1200, longitude: 174.8200 },
      { latitude: -41.1150, longitude: 174.8500 },
      { latitude: -41.1250, longitude: 174.8650 },
      { latitude: -41.1480, longitude: 174.8600 },
      { latitude: -41.1500, longitude: 174.8350 },
      { latitude: -41.1400, longitude: 174.8200 },
    ],
  },
  {
    id: 'titahi_bay',
    name: 'Titahi Bay',
    polygon: [
      { latitude: -41.1000, longitude: 174.8200 },
      { latitude: -41.0980, longitude: 174.8450 },
      { latitude: -41.1100, longitude: 174.8500 },
      { latitude: -41.1200, longitude: 174.8400 },
      { latitude: -41.1200, longitude: 174.8200 },
    ],
  },
  {
    id: 'plimmerton',
    name: 'Plimmerton',
    polygon: [
      { latitude: -41.0700, longitude: 174.8500 },
      { latitude: -41.0680, longitude: 174.8750 },
      { latitude: -41.0800, longitude: 174.8800 },
      { latitude: -41.0920, longitude: 174.8750 },
      { latitude: -41.0920, longitude: 174.8500 },
    ],
  },

  // === HUTT VALLEY ===
  {
    id: 'petone',
    name: 'Petone',
    polygon: [
      { latitude: -41.2180, longitude: 174.8550 },
      { latitude: -41.2150, longitude: 174.8800 },
      { latitude: -41.2280, longitude: 174.8900 },
      { latitude: -41.2380, longitude: 174.8750 },
      { latitude: -41.2350, longitude: 174.8550 },
    ],
  },
  {
    id: 'lower_hutt',
    name: 'Lower Hutt',
    polygon: [
      { latitude: -41.1950, longitude: 174.8900 },
      { latitude: -41.1900, longitude: 174.9150 },
      { latitude: -41.2000, longitude: 174.9280 },
      { latitude: -41.2180, longitude: 174.9250 },
      { latitude: -41.2200, longitude: 174.8950 },
    ],
  },
  {
    id: 'eastbourne',
    name: 'Eastbourne',
    polygon: [
      { latitude: -41.2800, longitude: 174.8800 },
      { latitude: -41.2780, longitude: 174.9050 },
      { latitude: -41.2950, longitude: 174.9100 },
      { latitude: -41.3050, longitude: 174.9000 },
      { latitude: -41.3050, longitude: 174.8850 },
    ],
  },
  {
    id: 'naenae',
    name: 'Naenae',
    polygon: [
      { latitude: -41.1850, longitude: 174.9300 },
      { latitude: -41.1830, longitude: 174.9550 },
      { latitude: -41.1950, longitude: 174.9580 },
      { latitude: -41.2020, longitude: 174.9500 },
      { latitude: -41.2020, longitude: 174.9350 },
    ],
  },
  {
    id: 'stokes_valley',
    name: 'Stokes Valley',
    polygon: [
      { latitude: -41.1730, longitude: 174.9550 },
      { latitude: -41.1700, longitude: 174.9800 },
      { latitude: -41.1850, longitude: 174.9850 },
      { latitude: -41.1960, longitude: 174.9800 },
      { latitude: -41.1960, longitude: 174.9580 },
    ],
  },
  {
    id: 'wainuiomata',
    name: 'Wainuiomata',
    polygon: [
      { latitude: -41.2480, longitude: 174.9380 },
      { latitude: -41.2460, longitude: 174.9650 },
      { latitude: -41.2600, longitude: 174.9720 },
      { latitude: -41.2720, longitude: 174.9650 },
      { latitude: -41.2750, longitude: 174.9420 },
    ],
  },
  {
    id: 'upper_hutt',
    name: 'Upper Hutt',
    polygon: [
      { latitude: -41.1100, longitude: 175.0500 },
      { latitude: -41.1080, longitude: 175.0800 },
      { latitude: -41.1200, longitude: 175.0900 },
      { latitude: -41.1380, longitude: 175.0850 },
      { latitude: -41.1400, longitude: 175.0550 },
    ],
  },
  {
    id: 'silverstream',
    name: 'Silverstream',
    polygon: [
      { latitude: -41.1400, longitude: 175.0150 },
      { latitude: -41.1380, longitude: 175.0400 },
      { latitude: -41.1500, longitude: 175.0480 },
      { latitude: -41.1620, longitude: 175.0400 },
      { latitude: -41.1620, longitude: 175.0200 },
    ],
  },

  // === KAPITI COAST ===
  {
    id: 'paraparaumu',
    name: 'Paraparaumu',
    polygon: [
      { latitude: -40.8900, longitude: 174.9700 },
      { latitude: -40.8880, longitude: 175.0000 },
      { latitude: -40.9050, longitude: 175.0100 },
      { latitude: -40.9250, longitude: 175.0000 },
      { latitude: -40.9250, longitude: 174.9750 },
    ],
  },
  {
    id: 'waikanae',
    name: 'Waikanae',
    polygon: [
      { latitude: -40.8550, longitude: 174.9850 },
      { latitude: -40.8530, longitude: 175.0150 },
      { latitude: -40.8700, longitude: 175.0250 },
      { latitude: -40.8850, longitude: 175.0150 },
      { latitude: -40.8850, longitude: 174.9900 },
    ],
  },
];

/**
 * Determines which neighborhood a place belongs to based on its coordinates
 */
export function getNeighborhood(
  latitude: number,
  longitude: number
): string | null {
  for (const neighborhood of NEIGHBORHOODS) {
    if (isPointInPolygon(latitude, longitude, neighborhood.polygon)) {
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
