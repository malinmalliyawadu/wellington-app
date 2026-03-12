import { SupabaseClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a venue name for comparison:
 * - Lowercase
 * - Strip trailing ", Wellington" (and variants)
 * - Strip leading articles (The, A, An)
 * - Normalize "&" → "and"
 * - Normalize apostrophes
 * - Collapse whitespace
 *
 * Examples:
 *   "The Rogue and Vagabond"      → "rogue and vagabond"
 *   "Rogue & Vagabond"            → "rogue and vagabond"
 *   "Rogue and Vagabond, Wellington" → "rogue and vagabond"
 */
export function normalizePlaceName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/,\s*wellington(\s*(city|central|cbd|nz|new\s*zealand))?$/i, "")
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/['\u2018\u2019\u0060]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Place category inference (shared across all sync functions)
// ---------------------------------------------------------------------------

export function inferPlaceCategory(venueName: string): string {
  const name = venueName.toLowerCase();
  if (/\bcaf[eé]\b/.test(name) || name.includes("coffee")) return "cafe";
  if (
    name.includes("restaurant") ||
    name.includes("kitchen") ||
    name.includes("bistro") ||
    name.includes("eatery") ||
    name.includes("diner")
  )
    return "restaurant";
  if (
    name.includes(" bar") ||
    name.startsWith("bar ") ||
    name.includes("pub") ||
    name.includes("tavern") ||
    name.includes("brewery") ||
    name.includes("taproom")
  )
    return "bar";
  if (
    name.includes("park") ||
    name.includes("reserve") ||
    name.includes("garden") ||
    name.includes("botanical")
  )
    return "park";
  if (
    name.includes("museum") ||
    name.includes("gallery") ||
    name.includes("library") ||
    name.includes("zoo") ||
    name.includes("stadium") ||
    name.includes("cinema")
  )
    return "attraction";
  return "venue";
}

// ---------------------------------------------------------------------------
// Geocoding via OpenStreetMap Nominatim
// ---------------------------------------------------------------------------

const WELLINGTON_FALLBACK = { lat: -41.2924, lng: 174.7787 };

async function geocodeAddress(
  address: string,
  venueName: string,
): Promise<{ lat: number; lng: number }> {
  const queries = [
    address.includes("Wellington")
      ? address
      : `${address}, Wellington, New Zealand`,
    `${venueName}, Wellington, New Zealand`,
  ];

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1` +
        `&viewbox=174.6131,-41.3624,174.8954,-41.1435&bounded=0`;

      const res = await fetch(url, {
        headers: { "User-Agent": "WellyApp/1.0 (event-sync)" },
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (lat < -41.5 || lat > -41.0 || lng < 174.5 || lng > 175.0) {
        console.warn(
          `  Geocoded outside Wellington: ${lat},${lng} for "${query}" — skipping`,
        );
        continue;
      }

      console.log(`  Geocoded "${query}" → ${lat},${lng}`);
      return { lat, lng };
    } catch (err) {
      console.error(`  Geocoding error for "${query}":`, err);
    }
  }

  console.warn(
    `  Could not geocode "${venueName}" — using Wellington center`,
  );
  return WELLINGTON_FALLBACK;
}

// ---------------------------------------------------------------------------
// Venue input / resolver
// ---------------------------------------------------------------------------

export interface VenueInput {
  /** Raw venue name from the source API */
  name: string;
  /** Street address (optional) */
  address?: string;
  /** Latitude (optional — will geocode if missing when creating) */
  latitude?: number;
  /** Longitude (optional — will geocode if missing when creating) */
  longitude?: number;
}

interface CachedPlace {
  id: string;
  name: string;
  normalized: string;
  address: string | null;
  latitude: number;
  longitude: number;
}

export interface PlaceResolver {
  /**
   * Resolve a venue to an existing place or create a new one.
   * Returns the place ID, or null if creation failed.
   */
  resolve(venue: VenueInput): Promise<string | null>;
  /** Number of new places created so far */
  readonly placesCreated: number;
}

/**
 * Load existing event→place mappings for a given source.
 * Returns a map of sourceId → placeId so we can skip place resolution
 * for events that already have a place assigned.
 */
export async function loadExistingEventPlaces(
  supabase: SupabaseClient,
  sourceIdField: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("events")
    .select(`${sourceIdField}, place_id`)
    .not(sourceIdField, "is", null)
    .not("place_id", "is", null);

  if (error) {
    console.error(
      `[resolvePlace] Failed to load existing event places: ${error.message}`,
    );
    return new Map();
  }

  const map = new Map<string, string>();
  // deno-lint-ignore no-explicit-any
  for (const row of (data ?? []) as any[]) {
    map.set(String(row[sourceIdField]), row.place_id);
  }

  console.log(
    `[resolvePlace] Loaded ${map.size} existing ${sourceIdField} → place_id mappings`,
  );
  return map;
}

/**
 * Create a PlaceResolver that caches all existing places on first use
 * and uses normalized name matching to avoid duplicates.
 *
 * Usage:
 *   const resolver = createPlaceResolver(supabase);
 *   const placeId = await resolver.resolve({ name: "The Rogue & Vagabond", address: "..." });
 */
export function createPlaceResolver(supabase: SupabaseClient): PlaceResolver {
  let cache: CachedPlace[] | null = null;
  let nameIndex: Map<string, CachedPlace> | null = null;
  let created = 0;

  async function ensureCache(): Promise<void> {
    if (cache) return;

    const { data: places, error } = await supabase
      .from("places")
      .select("id, name, address, latitude, longitude");

    if (error) {
      console.error(`[resolvePlace] Failed to load places: ${error.message}`);
      cache = [];
      nameIndex = new Map();
      return;
    }

    cache = (places ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      normalized: normalizePlaceName(p.name),
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    nameIndex = new Map();
    for (const p of cache) {
      if (!nameIndex.has(p.normalized)) {
        nameIndex.set(p.normalized, p);
      }
    }

    console.log(
      `[resolvePlace] Loaded ${cache.length} places (${nameIndex.size} unique normalized names)`,
    );
  }

  function findMatch(venue: VenueInput): CachedPlace | null {
    const normalizedInput = normalizePlaceName(venue.name);

    // 1. Exact normalized name match
    const exactMatch = nameIndex!.get(normalizedInput);
    if (exactMatch) return exactMatch;

    // 2. Containment match: one name contains the other
    //    (e.g., "San Fran" matches "San Fran Live Music Venue")
    if (normalizedInput.length > 4) {
      for (const [cachedNorm, place] of nameIndex!) {
        if (cachedNorm.length <= 4) continue;
        if (
          normalizedInput.includes(cachedNorm) ||
          cachedNorm.includes(normalizedInput)
        ) {
          return place;
        }
      }
    }

    // 3. Address match — compare street portion
    if (venue.address && venue.address.length > 10) {
      const addressStart = venue.address.split(",")[0].trim().toLowerCase();
      if (addressStart.length > 5) {
        for (const place of cache!) {
          if (
            place.address &&
            place.address.toLowerCase().includes(addressStart)
          ) {
            return place;
          }
        }
      }
    }

    // 4. Coordinate proximity — within ~100m
    if (venue.latitude && venue.longitude) {
      const THRESHOLD = 0.001; // ~111m
      for (const place of cache!) {
        const latDiff = Math.abs(place.latitude - venue.latitude);
        const lngDiff = Math.abs(place.longitude - venue.longitude);
        if (latDiff < THRESHOLD && lngDiff < THRESHOLD) {
          return place;
        }
      }
    }

    return null;
  }

  async function resolve(venue: VenueInput): Promise<string | null> {
    await ensureCache();

    const match = findMatch(venue);
    if (match) {
      return match.id;
    }

    // No match — create new place
    let cleanName = venue.name
      .replace(/,\s*Wellington(\s*(City|Central|CBD|NZ|New\s*Zealand))?$/i, "")
      .trim();
    if (cleanName.length > 60) {
      const dashIdx = cleanName.indexOf(" - ");
      if (dashIdx > 0 && dashIdx <= 60) {
        cleanName = cleanName.substring(0, dashIdx).trim();
      } else {
        const commaIdx = cleanName.indexOf(",");
        if (commaIdx > 0 && commaIdx <= 60) {
          cleanName = cleanName.substring(0, commaIdx).trim();
        } else {
          cleanName = cleanName.substring(0, 60).trim();
        }
      }
    }

    const address = venue.address || `${cleanName}, Wellington`;
    let lat = venue.latitude ?? 0;
    let lng = venue.longitude ?? 0;

    // Geocode if no coordinates or outside Wellington
    const needsGeocode =
      (lat === 0 && lng === 0) ||
      lat < -41.5 ||
      lat > -41.0 ||
      lng < 174.5 ||
      lng > 175.0;

    if (needsGeocode) {
      await new Promise((r) => setTimeout(r, 1100));
      const coords = await geocodeAddress(address, cleanName);
      lat = coords.lat;
      lng = coords.lng;
    }

    const { data: newPlace, error: placeErr } = await supabase
      .from("places")
      .insert({
        name: cleanName,
        category: inferPlaceCategory(cleanName),
        address,
        latitude: lat,
        longitude: lng,
      })
      .select("id")
      .single();

    if (placeErr) {
      console.error(
        `[resolvePlace] Failed to create place "${cleanName}": ${placeErr.message}`,
      );
      return null;
    }

    // Add to cache for subsequent calls
    const newCached: CachedPlace = {
      id: newPlace.id,
      name: cleanName,
      normalized: normalizePlaceName(cleanName),
      address,
      latitude: lat,
      longitude: lng,
    };
    cache!.push(newCached);
    if (!nameIndex!.has(newCached.normalized)) {
      nameIndex!.set(newCached.normalized, newCached);
    }

    created++;
    console.log(
      `[resolvePlace] Created place: "${cleanName}" at ${lat},${lng}`,
    );

    return newPlace.id;
  }

  return {
    resolve,
    get placesCreated() {
      return created;
    },
  };
}
