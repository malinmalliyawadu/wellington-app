const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface GeocodeGeometry {
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  viewport: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  location: {
    lat: number;
    lng: number };
}

export interface GeocodeResult {
  place_id: string;
  formatted_address: string;
  geometry: GeocodeGeometry;
  types: string[];
}

/**
 * Fetch geocoding data for a location from Google Maps Geocoding API
 */
export async function geocodeLocation(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_API_KEY) {
    console.warn('[Geocoding] Google API key not configured');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('[Geocoding] No results for:', address, data.status);
      return null;
    }

    return data.results[0];
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return null;
  }
}

/**
 * Fetch neighborhood boundaries for Wellington suburbs
 */
export async function fetchNeighborhoodBoundaries(neighborhood: string): Promise<GeocodeGeometry | null> {
  const result = await geocodeLocation(`${neighborhood}, Wellington, New Zealand`);
  return result?.geometry ?? null;
}
