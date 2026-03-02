import AsyncStorage from "@react-native-async-storage/async-storage";
import { updatePlaceRating } from "./places";

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "";

const FETCH_TIMEOUT = 10000;
const CACHE_TTL = 1000 * 60 * 60 * 48; // 48 hours
const CACHE_PREFIX = "place_details:";

function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

interface PlaceDetails {
  rating?: number;
  userRatingsTotal?: number;
}

// In-memory cache (fast path), backed by AsyncStorage (persistent)
const memoryCache = new Map<string, { data: PlaceDetails; timestamp: number }>();

async function getCached(key: string): Promise<PlaceDetails | null> {
  // Check memory first
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL) {
    return mem.data;
  }

  // Check AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      const parsed = JSON.parse(stored) as { data: PlaceDetails; timestamp: number };
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      // Expired — clean up
      AsyncStorage.removeItem(CACHE_PREFIX + key);
    }
  } catch {}

  return null;
}

function setCache(key: string, data: PlaceDetails): void {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry)).catch(() => {});
}

/**
 * Fetches Google Places rating and review count for a place.
 * First uses Nearby Search to find the place and get its place_id,
 * then uses Place Details API to get complete information.
 */
export async function fetchPlaceDetails(
  latitude: number,
  longitude: number,
  name: string,
  placeId?: string
): Promise<PlaceDetails> {
  const cacheKey = `${latitude},${longitude},${name}`;

  // Check cache first (memory → AsyncStorage)
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("[PlaceDetails] Google Places API key not configured");
    return {};
  }

  try {
    // Step 1: Use Nearby Search to find the place and get its place_id
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=100&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await fetchWithTimeout(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      console.error("[PlaceDetails] Search error:", searchData.status, searchData.error_message);
      return {};
    }

    if (!searchData.results || searchData.results.length === 0) {
      return {};
    }

    // Filter out irrelevant types
    const excludedTypes = ['parking', 'atm', 'finance', 'locality', 'political', 'sublocality'];
    const validCandidates = searchData.results.filter((result: any) => {
      return !result.types?.some((type: string) => excludedTypes.includes(type)) &&
             result.user_ratings_total; // Must have reviews
    });

    // Score each candidate
    const scoredCandidates = validCandidates.map((result: any) => {
      const resultName = result.name.toLowerCase();
      const searchName = name.toLowerCase();

      let score = 0;

      // Exact match gets highest score
      if (resultName === searchName) score += 100;

      // Contains all words from search name
      const searchWords = searchName.split(' ');
      const matchedWords = searchWords.filter(word => resultName.includes(word));
      score += (matchedWords.length / searchWords.length) * 50;

      // Prefer places with more reviews (log scale to prevent domination)
      score += Math.min(Math.log10(result.user_ratings_total || 1) * 10, 30);

      // Bonus for relevant types
      const relevantTypes = ['museum', 'tourist_attraction', 'restaurant', 'cafe', 'bar', 'park', 'establishment'];
      if (result.types?.some((type: string) => relevantTypes.includes(type))) {
        score += 10;
      }

      return { ...result, score };
    });

    // Sort by score descending
    scoredCandidates.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    const matchedPlace = scoredCandidates[0];

    if (!matchedPlace) {
      return {};
    }

    // Use rating data already returned by Nearby Search (no extra API call needed)
    const details: PlaceDetails = {
      rating: matchedPlace.rating,
      userRatingsTotal: matchedPlace.user_ratings_total,
    };

    // Cache the result (memory + AsyncStorage)
    setCache(cacheKey, details);

    // Persist to DB so future loads skip Google entirely
    if (placeId && details.rating) {
      updatePlaceRating(placeId, details.rating, details.userRatingsTotal).catch(() => {});
    }

    return details;
  } catch (error) {
    console.error("[PlaceDetails] Error:", error);
    return {};
  }
}
