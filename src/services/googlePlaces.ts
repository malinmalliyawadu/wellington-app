import type { Place } from "../types";

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Wellington coordinates as search center
const WELLINGTON_COORDS = {
  latitude: -41.2865,
  longitude: 174.7762,
};

// You'll need to add this to your .env file
const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "";

const FETCH_TIMEOUT = 10000; // 10 seconds

function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

// Calculate distance between two coordinates in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculatePopularityScore(
  rating: number = 0,
  ratingsTotal: number = 0,
  distance: number
): number {
  // Normalize rating (0-5) to 0-1
  const normalizedRating = rating / 5;

  // Log scale for ratings count (diminishing returns after ~100 ratings)
  const normalizedRatingsCount = Math.min(Math.log10(ratingsTotal + 1) / 3, 1);

  // Normalize distance (closer is better, within 2km)
  const normalizedDistance = Math.max(0, 1 - distance / 2000);

  // Weighted score: 40% rating quality, 30% number of ratings, 30% distance
  const popularityScore =
    normalizedRating * 0.4 +
    normalizedRatingsCount * 0.3 +
    normalizedDistance * 0.3;

  return popularityScore;
}

function shouldExcludePlace(types: string[]): boolean {
  const excludedTypes = [
    "locality",
    "political",
    "administrative_area_level_1",
    "administrative_area_level_2",
    "administrative_area_level_3",
    "country",
    "postal_code",
    "route",
    "street_address",
    "sublocality",
    "sublocality_level_1",
  ];

  return types.some((type) => excludedTypes.includes(type));
}

function mapGoogleCategory(types: string[]): Place["category"] {
  if (types.includes("cafe") || types.includes("bakery")) return "cafe";
  if (types.includes("restaurant") || types.includes("food"))
    return "restaurant";
  if (types.includes("bar") || types.includes("night_club")) return "bar";
  if (types.includes("park") || types.includes("natural_feature"))
    return "park";
  if (
    types.includes("museum") ||
    types.includes("tourist_attraction") ||
    types.includes("art_gallery") ||
    types.includes("zoo") ||
    types.includes("aquarium")
  )
    return "attraction";
  if (
    types.includes("stadium") ||
    types.includes("movie_theater") ||
    types.includes("bowling_alley")
  )
    return "venue";
  return "attraction";
}

export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 200
): Promise<Omit<Place, "id">[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return [];
  }

  try {
    // Use Nearby Search API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=establishment&key=${GOOGLE_PLACES_API_KEY}`;

    console.log(
      "Nearby search URL:",
      url.replace(GOOGLE_PLACES_API_KEY, "API_KEY")
    );

    const response = await fetchWithTimeout(url);
    const data = await response.json();

    console.log("Nearby search response:", {
      status: data.status,
      resultCount: data.results?.length,
    });

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(
        "Nearby search API error:",
        data.status,
        data.error_message
      );
      return [];
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    const mappedResults = data.results
      .filter(
        (result: GooglePlaceResult) => !shouldExcludePlace(result.types || [])
      )
      .map((result: GooglePlaceResult) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          result.geometry.location.lat,
          result.geometry.location.lng
        );
        const popularityScore = calculatePopularityScore(
          result.rating,
          result.user_ratings_total,
          distance
        );
        return {
          name: result.name,
          address: result.formatted_address || result.vicinity || "",
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          category: mapGoogleCategory(result.types || []),
          googlePlaceId: result.place_id,
          distance,
          rating: result.rating,
          ratingsTotal: result.user_ratings_total,
          popularityScore,
        };
      })
      .sort((a: { popularityScore: number }, b: { popularityScore: number }) => b.popularityScore - a.popularityScore) // Sort by popularity (highest first)
      .slice(0, 20);

    console.log(
      "Nearby places by popularity:",
      mappedResults.slice(0, 5).map((p: { name: string; distance: number; rating?: number; ratingsTotal?: number; popularityScore: number }) => ({
        name: p.name,
        distance: Math.round(p.distance) + "m",
        rating: p.rating?.toFixed(1),
        reviews: p.ratingsTotal,
        score: p.popularityScore.toFixed(2),
      }))
    );

    // Remove extra properties before returning (keep rating and ratingsTotal)
    return mappedResults.map(({ distance, popularityScore, ...place }: { distance: number; popularityScore: number; ratingsTotal?: number; [key: string]: unknown }) => ({
      ...place,
      userRatingsTotal: place.ratingsTotal,
    }));
  } catch (error) {
    console.error("Nearby search error:", error);
    return [];
  }
}

export async function searchGooglePlaces(
  query: string,
  latitude: number = WELLINGTON_COORDS.latitude,
  longitude: number = WELLINGTON_COORDS.longitude
): Promise<Omit<Place, "id">[]> {
  if (!query.trim() || query.trim().length < 2) {
    return [];
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return [];
  }

  try {
    // Step 1: Use Autocomplete API for prefix matching
    // Restrict to establishment type to exclude cities/regions
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&location=${latitude},${longitude}&radius=15000&strictbounds=true&types=establishment&components=country:nz&key=${GOOGLE_PLACES_API_KEY}`;

    console.log(
      "Autocomplete URL:",
      autocompleteUrl.replace(GOOGLE_PLACES_API_KEY, "API_KEY")
    );

    const autocompleteResponse = await fetchWithTimeout(autocompleteUrl);
    const autocompleteData = await autocompleteResponse.json();

    console.log("Autocomplete response:", {
      status: autocompleteData.status,
      predictionCount: autocompleteData.predictions?.length,
      query: query,
    });

    if (
      autocompleteData.status !== "OK" &&
      autocompleteData.status !== "ZERO_RESULTS"
    ) {
      console.error(
        "Autocomplete API error:",
        autocompleteData.status,
        autocompleteData.error_message
      );
      return [];
    }

    if (
      !autocompleteData.predictions ||
      autocompleteData.predictions.length === 0
    ) {
      return [];
    }

    // Step 2: Fetch details for each prediction (limit to first 10)
    const predictions = autocompleteData.predictions.slice(0, 10);
    const detailsPromises = predictions.map(
      async (prediction: AutocompletePrediction) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,formatted_address,geometry,types,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;

        const detailsResponse = await fetchWithTimeout(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status === "OK" && detailsData.result) {
          const result = detailsData.result;

          // Exclude if it's a city/region/etc
          if (shouldExcludePlace(result.types || [])) {
            return null;
          }

          return {
            name: result.name,
            address: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            category: mapGoogleCategory(result.types || []),
            googlePlaceId: prediction.place_id,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
          };
        }
        return null;
      }
    );

    const results = await Promise.all(detailsPromises);
    const mappedResults = results.filter((r) => r !== null) as Omit<Place, "id">[];

    console.log("Final mapped results count:", mappedResults.length);

    return mappedResults;
  } catch (error) {
    console.error("Google Places search error:", error);
    return [];
  }
}
