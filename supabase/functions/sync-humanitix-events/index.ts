import { createClient } from "npm:@supabase/supabase-js@2";
import { deduplicateEvents } from "../_shared/deduplicateEvents.ts";
import { createPlaceResolver, loadExistingEventPlaces } from "../_shared/resolvePlace.ts";

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
    const placeResolver = createPlaceResolver(supabase);
    const existingPlaces = dryRun ? new Map() : await loadExistingEventPlaces(supabase, "humanitix_id");

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
      const venueName = hx.eventLocation?.venueName || "Wellington Venue";
      const venueAddress =
        hx.eventLocation?.address || `${venueName}, Wellington`;

      // Find or create place
      let placeId: string | null = null;

      if (!dryRun) {
        placeId = existingPlaces.get(hx._id) ?? await placeResolver.resolve({
          name: venueName,
          address: venueAddress,
        });
        if (!placeId) continue;
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
      `Processed: ${upsertRows.length} events to upsert, ${skippedPast} past`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEvents.length,
          toUpsert: upsertRows.length,
          skippedPast,
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

    // Cross-source dedup: link to existing events from other sources
    const { rows: dedupedRows, linked: linkedCount } = await deduplicateEvents(
      supabase,
      upsertRows,
      "humanitix",
    );

    // Upsert in batches
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
      const batch = dedupedRows.slice(i, i + BATCH_SIZE);
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
      .is("eventbrite_id", null)
      .lt("date", cutoffStr)
      .select("id");

    if (deleteErr) {
      console.error(`Cleanup error: ${deleteErr.message}`);
    } else {
      deletedCount = deletedRows?.length ?? 0;
    }

    console.log(
      `Done: ${upserted} upserted, ${linkedCount} linked to existing, ${upsertErrors} errors, ${deletedCount} old events cleaned up, ${placeResolver.placesCreated} places created`
    );

    return new Response(
      JSON.stringify({
        totalFetched: allEvents.length,
        upserted,
        linkedToExisting: linkedCount,
        upsertErrors,
        skippedPast,
        placesCreated: placeResolver.placesCreated,
        deletedOld: deletedCount,
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
