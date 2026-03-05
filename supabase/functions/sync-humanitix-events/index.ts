import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichEvents } from "../_shared/enrichEvent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Category mapping: keyword-based (Humanitix API doesn't return categories)
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Record<string, string> = {
  concert: "music",
  gig: "music",
  music: "music",
  band: "music",
  dj: "music",
  disco: "music",
  karaoke: "music",
  jazz: "music",
  rock: "music",
  pop: "music",
  hip: "music",
  boogie: "music",
  rave: "music",
  comedy: "comedy",
  "stand-up": "comedy",
  standup: "comedy",
  improv: "comedy",
  comedian: "comedy",
  funny: "comedy",
  theatre: "art",
  theater: "art",
  exhibition: "art",
  gallery: "art",
  dance: "art",
  ballet: "art",
  film: "art",
  art: "art",
  paint: "art",
  poetry: "art",
  literary: "art",
  cabaret: "art",
  circus: "art",
  fringe: "art",
  food: "food",
  wine: "food",
  beer: "food",
  dining: "food",
  cooking: "food",
  brunch: "food",
  breakfast: "food",
  lunch: "food",
  dinner: "food",
  tasting: "food",
  flavour: "food",
  market: "market",
  bazaar: "market",
  quiz: "quiz",
  trivia: "quiz",
  craft: "craft",
  pottery: "craft",
  knit: "craft",
  sew: "craft",
  kids: "kids",
  family: "kids",
  children: "kids",
  festival: "cultural",
  cultural: "cultural",
  heritage: "cultural",
  matariki: "cultural",
  pasifika: "cultural",
  pride: "cultural",
  latin: "cultural",
  fiesta: "cultural",
};

function mapCategory(eventName: string): string {
  const text = eventName.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category;
  }
  return "community"; // default
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferPlaceCategory(venueName: string): string {
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
// Humanitix API types
// ---------------------------------------------------------------------------

interface HumanitixEvent {
  _id: string;
  name: string;
  slug: string;
  hostname: string;
  timezone: string;
  location: string;
  isRecurring: boolean;
  displayDate: string | null;
  occurrenceLabel: string | null;
  date: {
    startDate: string; // GMT date string
    endDate: string;
  };
  dates: Array<{
    startDate: string;
    endDate: string;
  }>;
  bannerImage: {
    handle: string;
  } | null;
  eventLocation: {
    type: string;
    address: string;
    venueName: string;
  };
  pricing: {
    minimumPrice: number;
    maximumPrice: number;
    plusBuyerFee: boolean;
  };
  organiser: {
    _id: string;
    name: string;
    followerCount: number;
  };
  accessibilityFeatures: unknown;
  hostTotalFollowers: string | null;
}

// ---------------------------------------------------------------------------
// Humanitix API request
// ---------------------------------------------------------------------------

const HUMANITIX_API_URL = "https://humanitix.com/api/recommendations";
const PAGE_SIZE = 32; // Humanitix returns 32 per page
const MAX_PAGES = 10;

// Wellington geobox
const WELLINGTON_GEOBOX = {
  slug: "nz--wellington-region--wellington",
  countryCode: "nz",
  name: "Wellington",
  address: "Wellington, New Zealand",
  latLng: { lat: -41.2923814, lng: 174.7787463 },
  northeast: { lat: -41.1435402, lng: 174.8954091 },
  southwest: { lat: -41.3623801, lng: 174.6131062 },
  placeId: "ChIJy3TpSfyxOG0RcLQTomPvAAo",
};

async function fetchHumanitixPage(page: number): Promise<HumanitixEvent[]> {
  const body = {
    query: "",
    locationQuery: "",
    locationType: "",
    types: [],
    categories: [],
    subcategories: [],
    interests: [],
    prices: "all",
    dates: "",
    startDate: "",
    endDate: "",
    accessibility: [],
    page,
    safeSearch: true,
    modifier: "recommended",
    geobox: WELLINGTON_GEOBOX,
  };

  const res = await fetch(HUMANITIX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Safari/605.1.15",
      Origin: "https://humanitix.com",
      Referer:
        "https://humanitix.com/nz/events/nz--wellington-region--wellington/recommended",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Humanitix API error ${res.status}: ${errText}`);
    return [];
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error("Unexpected response format:", typeof data);
    return [];
  }

  return data as HumanitixEvent[];
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function extractImageUrl(
  bannerImage: { handle: string } | null
): string | null {
  if (!bannerImage?.handle) return null;
  // Humanitix uses Filestack CDN for images
  return `https://cdn.filestackcontent.com/${bannerImage.handle}`;
}

function extractEventUrl(hostname: string, slug: string): string {
  // hostname is like "https://events.humanitix.com/"
  const base = hostname.endsWith("/") ? hostname : hostname + "/";
  return `${base}${slug}`;
}

function parseGmtDate(gmtStr: string): Date {
  // Format: "Fri Mar 13 2026 07:00:00 GMT+0000 (Coordinated Universal Time)"
  // JavaScript Date constructor handles this format
  return new Date(gmtStr);
}

function formatTimeNZ(date: Date): string {
  return date.toLocaleTimeString("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  });
}

function formatDateNZ(date: Date): string {
  // Get the date components in NZ timezone
  const year = date.toLocaleString("en-NZ", {
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
  const month = date.toLocaleString("en-NZ", {
    month: "2-digit",
    timeZone: "Pacific/Auckland",
  });
  const day = date.toLocaleString("en-NZ", {
    day: "2-digit",
    timeZone: "Pacific/Auckland",
  });
  return `${year}-${month}-${day}`;
}

function cleanVenueName(raw: string): string {
  // Some Humanitix venues have very long names with full addresses
  // e.g., "Talent Army, Cyber Team and Propagator Office - Level 4, Featherston House..."
  // Truncate at first comma or dash if the name is very long
  if (raw.length <= 60) return raw;

  // Try splitting at " - " first (common separator)
  const dashIdx = raw.indexOf(" - ");
  if (dashIdx > 0 && dashIdx <= 60) return raw.substring(0, dashIdx).trim();

  // Try splitting at comma
  const commaIdx = raw.indexOf(",");
  if (commaIdx > 0 && commaIdx <= 60) return raw.substring(0, commaIdx).trim();

  // Just truncate
  return raw.substring(0, 60).trim();
}

// ---------------------------------------------------------------------------
// Geocoding via OpenStreetMap Nominatim (free, no API key needed)
// ---------------------------------------------------------------------------

const WELLINGTON_FALLBACK = { lat: -41.2924, lng: 174.7787 };

// Nominatim usage policy: max 1 request/second
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(
  address: string,
  venueName: string
): Promise<{ lat: number; lng: number }> {
  // Try address first, then venue name as fallback query
  const queries = [
    address.includes("Wellington")
      ? address
      : `${address}, Wellington, New Zealand`,
    `${venueName}, Wellington, New Zealand`,
  ];

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      // Use viewbox to bias results toward Wellington region
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1` +
        `&viewbox=174.6131,-41.3624,174.8954,-41.1435&bounded=0`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "WellyApp/1.0 (event-sync)",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      // Sanity check: must be roughly within Wellington region
      if (lat < -41.5 || lat > -41.0 || lng < 174.5 || lng > 175.0) {
        console.warn(
          `  Geocoded outside Wellington: ${lat},${lng} for "${query}" — skipping`
        );
        continue;
      }

      console.log(`  Geocoded "${query}" → ${lat},${lng}`);
      return { lat, lng };
    } catch (err) {
      console.error(`  Geocoding error for "${query}":`, err);
    }
  }

  console.warn(`  Could not geocode "${venueName}" — using Wellington center`);
  return WELLINGTON_FALLBACK;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify the JWT role is service_role
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role !== "service_role") {
          return new Response(
            JSON.stringify({ error: "Unauthorized: requires service_role" }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Unauthorized: invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: missing Authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    let dryRun = false;
    let cleanupDays = 7;
    try {
      const body = await req.json();
      dryRun = body.dryRun === true;
      if (typeof body.cleanupDays === "number") cleanupDays = body.cleanupDays;
    } catch {
      // No body or invalid JSON — use defaults
    }

    // Fetch events from Humanitix with pagination
    const allEvents: HumanitixEvent[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      console.log(`Fetching page ${page}`);
      const events = await fetchHumanitixPage(page);
      console.log(`  Got ${events.length} events`);

      allEvents.push(...events);

      // Stop if we got fewer than a full page (last page)
      if (events.length < PAGE_SIZE) break;
    }

    console.log(`Total events fetched: ${allEvents.length}`);

    // Process events
    const upsertRows: Record<string, unknown>[] = [];
    let skippedPast = 0;
    let skippedDuplicate = 0;
    let placesCreated = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const hx of allEvents) {
      // Parse dates
      const startDate = parseGmtDate(hx.date.startDate);
      const endDate = parseGmtDate(hx.date.endDate);

      // Skip past events
      if (startDate < today) {
        skippedPast++;
        continue;
      }

      const dateStr = formatDateNZ(startDate);
      const startTime = formatTimeNZ(startDate);
      const endTime = formatTimeNZ(endDate);

      // Event URL
      const eventUrl = extractEventUrl(hx.hostname, hx.slug);

      // Map category via keyword matching
      const category = mapCategory(hx.name);

      // Venue info
      const rawVenueName = hx.eventLocation?.venueName || "Wellington Venue";
      const venueName = cleanVenueName(rawVenueName);

      // Cross-source dedup: check if Eventfinda or Ticketmaster already has this event
      if (!dryRun) {
        const { data: existingEvent } = await supabase
          .from("events")
          .select("id, eventfinda_id, ticketmaster_id")
          .eq("date", dateStr)
          .ilike("title", hx.name)
          .or("eventfinda_id.not.is.null,ticketmaster_id.not.is.null")
          .limit(1);

        if (existingEvent && existingEvent.length > 0) {
          // Event already exists from another source — link humanitix_id to it
          await supabase
            .from("events")
            .update({
              humanitix_id: hx._id,
              humanitix_url: eventUrl,
            })
            .eq("id", existingEvent[0].id);
          skippedDuplicate++;
          console.log(`  Linked to existing event: ${hx.name}`);
          continue;
        }
      }

      // Find or create place
      let placeId: string | null = null;
      const venueAddress =
        hx.eventLocation?.address || `${venueName}, Wellington`;

      if (!dryRun) {
        // 1. Exact name match
        const { data: exactMatch } = await supabase
          .from("places")
          .select("id")
          .ilike("name", venueName)
          .limit(1);

        if (exactMatch && exactMatch.length > 0) {
          placeId = exactMatch[0].id;
          console.log(`  Matched place by name: "${venueName}"`);
        }

        // 2. Partial/contains match (venue name appears in place name or vice versa)
        if (!placeId && venueName.length > 4) {
          const { data: partialMatch } = await supabase
            .from("places")
            .select("id, name")
            .ilike("name", `%${venueName}%`)
            .limit(1);

          if (partialMatch && partialMatch.length > 0) {
            placeId = partialMatch[0].id;
            console.log(
              `  Matched place by partial name: "${venueName}" → "${partialMatch[0].name}"`
            );
          }
        }

        // 3. Address match — compare street address portion
        if (!placeId && venueAddress.length > 10) {
          // Extract the first line / street number portion for matching
          const addressStart = venueAddress.split(",")[0].trim();
          if (addressStart.length > 5) {
            const { data: addrMatch } = await supabase
              .from("places")
              .select("id, name")
              .ilike("address", `%${addressStart}%`)
              .limit(1);

            if (addrMatch && addrMatch.length > 0) {
              placeId = addrMatch[0].id;
              console.log(
                `  Matched place by address: "${addressStart}" → "${addrMatch[0].name}"`
              );
            }
          }
        }

        // 4. No DB match — geocode and create new place
        if (!placeId) {
          // Respect Nominatim rate limit (1 req/sec)
          await sleep(1100);
          const coords = await geocodeAddress(venueAddress, venueName);

          const { data: newPlace, error: placeErr } = await supabase
            .from("places")
            .insert({
              name: venueName,
              category: inferPlaceCategory(venueName),
              address: venueAddress,
              latitude: coords.lat,
              longitude: coords.lng,
            })
            .select("id")
            .single();

          if (placeErr) {
            console.error(
              `Failed to create place "${venueName}": ${placeErr.message}`
            );
            continue;
          }
          placeId = newPlace.id;
          placesCreated++;
          console.log(
            `  Created place: ${venueName} at ${coords.lat},${coords.lng}`
          );
        }
      }

      // Extract image URL
      const imageUrl = extractImageUrl(hx.bannerImage);

      // Extract price
      const price =
        hx.pricing.minimumPrice === 0 && hx.pricing.maximumPrice === 0
          ? 0
          : hx.pricing.minimumPrice > 0
          ? hx.pricing.minimumPrice
          : null;

      // Placeholder description — real description fetched on-demand by client
      const description = `${hx.name} at ${venueName}`;

      const row: Record<string, unknown> = {
        humanitix_id: hx._id,
        title: hx.name,
        description,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        image_url: imageUrl,
        category,
        ticket_url: eventUrl,
        price,
        humanitix_url: eventUrl,
      };

      if (!dryRun) {
        row.place_id = placeId;
      }

      upsertRows.push(row);
    }

    console.log(
      `Processed: ${upsertRows.length} events to upsert, ${skippedPast} past, ${skippedDuplicate} linked to existing`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEvents.length,
          toUpsert: upsertRows.length,
          skippedPast,
          skippedDuplicate,
          events: upsertRows.map((r) => ({
            humanitixId: r.humanitix_id,
            title: r.title,
            date: r.date,
            category: r.category,
            price: r.price,
            imageUrl: r.image_url,
          })),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Upsert in batches
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
      const batch = upsertRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "humanitix_id" });

      if (error) {
        console.error(`Upsert batch error: ${error.message}`);
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup: delete old Humanitix-synced events (past by N days)
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("humanitix_id", "is", null)
      .is("eventfinda_id", null) // Only delete pure-Humanitix events
      .is("ticketmaster_id", null)
      .lt("date", cutoffStr)
      .select("id");

    if (deleteErr) {
      console.error(`Cleanup error: ${deleteErr.message}`);
    } else {
      deletedCount = deletedRows?.length ?? 0;
    }

    console.log(
      `Done: ${upserted} upserted, ${upsertErrors} errors, ${deletedCount} old events cleaned up, ${placesCreated} places created, ${skippedDuplicate} linked to existing`
    );

    // Enrich descriptions: scrape full text + AI rewrite for events missing ai_description
    const { enriched: enrichedCount, errors: enrichErrors } =
      await enrichEvents(supabase);

    return new Response(
      JSON.stringify({
        totalFetched: allEvents.length,
        upserted,
        upsertErrors,
        skippedPast,
        skippedDuplicate,
        placesCreated,
        deletedOld: deletedCount,
        enriched: enrichedCount,
        enrichErrors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-humanitix-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
