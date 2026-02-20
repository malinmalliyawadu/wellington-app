const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "";

const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

interface PlaceDetails {
  rating?: number;
  userRatingsTotal?: number;
}

// Simple in-memory cache to avoid repeated API calls for the same place
const detailsCache = new Map<string, { data: PlaceDetails; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetches Google Places rating and review count for a place.
 * First uses Nearby Search to find the place and get its place_id,
 * then uses Place Details API to get complete information.
 */
export async function fetchPlaceDetails(
  latitude: number,
  longitude: number,
  name: string
): Promise<PlaceDetails> {
  const cacheKey = `${latitude},${longitude},${name}`;

  // Check cache first
  const cached = detailsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
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

    if (!matchedPlace?.place_id) {
      return {};
    }

    // Step 2: Use Place Details API to get complete information
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${matchedPlace.place_id}&fields=rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;

    const detailsResponse = await fetchWithTimeout(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      console.error("[PlaceDetails] Details API error:", detailsData.status, detailsData.error_message);
      return {};
    }

    const result = detailsData.result;

    const details: PlaceDetails = {
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
    };

    // Cache the result
    detailsCache.set(cacheKey, { data: details, timestamp: Date.now() });

    return details;
  } catch (error) {
    console.error("[PlaceDetails] Error:", error);
    return {};
  }
}
