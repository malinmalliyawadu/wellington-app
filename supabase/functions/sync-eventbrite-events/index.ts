import { createClient } from "npm:@supabase/supabase-js@2";
import { deduplicateEvents } from "../_shared/deduplicateEvents.ts";
import { createPlaceResolver, loadExistingEventPlaces } from "../_shared/resolvePlace.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_ID_MAP: Record<string, string> = {
  "103": "music",
  "105": "art",
  "104": "art",
  "108": "community",
  "107": "community",
  "109": "community",
  "110": "food",
  "113": "cultural",
  "101": "community",
  "102": "community",
  "111": "community",
  "112": "community",
  "114": "cultural",
  "115": "kids",
  "199": "community",
  "106": "community",
  "116": "cultural",
  "117": "community",
  "119": "craft",
};

const KEYWORD_MAP: Record<string, string> = {
  concert: "music",
  gig: "music",
  music: "music",
  band: "music",
  dj: "music",
  jazz: "music",
  comedy: "comedy",
  "stand-up": "comedy",
  standup: "comedy",
  improv: "comedy",
  comedian: "comedy",
  theatre: "art",
  theater: "art",
  exhibition: "art",
  gallery: "art",
  dance: "art",
  ballet: "art",
  film: "art",
  art: "art",
  poetry: "art",
  cabaret: "art",
  food: "food",
  wine: "food",
  beer: "food",
  dining: "food",
  cooking: "food",
  brunch: "food",
  tasting: "food",
  market: "market",
  bazaar: "market",
  quiz: "quiz",
  trivia: "quiz",
  craft: "craft",
  pottery: "craft",
  kids: "kids",
  family: "kids",
  children: "kids",
  festival: "cultural",
  cultural: "cultural",
  heritage: "cultural",
  matariki: "cultural",
  pasifika: "cultural",
};

function mapCategory(categoryId: string | null, eventName: string): string {
  if (categoryId && CATEGORY_ID_MAP[categoryId]) {
    return CATEGORY_ID_MAP[categoryId];
  }
  const text = eventName.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category;
  }
  return "community";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Eventbrite API
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type EventbriteEvent = Record<string, any>;

const EVENTBRITE_API_BASE = "https://www.eventbriteapi.com/v3";
const PAGE_SIZE = 50;
const MAX_PAGES = 3;

function isWellingtonEvent(event: EventbriteEvent): boolean {
  const locations: Array<{ type?: string; name?: string }> = event.locations ?? [];
  // Check locality/localadmin level — not region (which includes Carterton, Wairarapa etc.)
  for (const loc of locations) {
    if (loc.type !== "locality" && loc.type !== "localadmin") continue;
    const name = (loc.name ?? "").toLowerCase();
    if (WELLINGTON_LOCALITY_NAMES.some((w) => name.includes(w))) {
      return true;
    }
  }
  return false;
}

// Wellington region names for filtering results
const WELLINGTON_LOCALITY_NAMES = [
  "wellington",
  "lower hutt",
  "upper hutt",
  "porirua",
  "petone",
  "kapiti",
  "paraparaumu",
  "waikanae",
  "johnsonville",
  "kilbirnie",
  "miramar",
  "karori",
  "newtown",
  "island bay",
  "tawa",
];

async function fetchEventsPage(
  token: string,
  page: number
): Promise<{ events: EventbriteEvent[]; hasMore: boolean }> {
  const url = `${EVENTBRITE_API_BASE}/destination/search/`;
  console.log(`Fetching page ${page}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_search: {
        q: "",
        dates: ["current_future"],
        page: page,
        page_size: PAGE_SIZE,
        places: ["101914285"],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Eventbrite API error ${res.status}: ${errText}`);
    return { events: [], hasMore: false };
  }

  const data = await res.json();

  // Results are in data.events.results, pagination in data.events.pagination
  const eventsContainer = data.events ?? {};
  const rawEvents: EventbriteEvent[] = eventsContainer.results ?? [];
  const pagination = eventsContainer.pagination ?? {};

  console.log(`  Found ${rawEvents.length} events (total: ${pagination.object_count ?? "?"})`);


  const hasMore = pagination.page_count > page;

  return { events: rawEvents, hasMore };
}

async function _fetchEventDetails(
  token: string,
  eventId: string
): Promise<EventbriteEvent | null> {
  const url = `${EVENTBRITE_API_BASE}/events/${eventId}/?expand=venue,ticket_availability,category`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) {
      console.warn(`  Event ${eventId} not found (404)`);
    } else {
      const errText = await res.text();
      console.error(`  API error ${res.status} for ${eventId}: ${errText}`);
    }
    return null;
  }

  return await res.json();
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

    const eventbriteToken = Deno.env.get("EVENTBRITE_API_TOKEN");
    if (!eventbriteToken) {
      return new Response(
        JSON.stringify({ error: "Missing EVENTBRITE_API_TOKEN secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch events from Eventbrite destination search API
    const allEvents: EventbriteEvent[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { events, hasMore } = await fetchEventsPage(eventbriteToken, page);
      console.log(`  Got ${events.length} events`);

      for (const ev of events) {
        if (!isWellingtonEvent(ev)) continue;
        allEvents.push(ev);
      }

      if (!hasMore || events.length === 0) break;
      if (page < MAX_PAGES) await sleep(500);
    }

    console.log(`Total Wellington events: ${allEvents.length}`);

    // Step 3: Batch-fetch venue details for all events
    const venueMap = new Map<string, EventbriteEvent>();
    const venueIds = [
      ...new Set(
        allEvents
          .map((ev) => ev.primary_venue_id as string | undefined)
          .filter((id): id is string => !!id)
      ),
    ];
    console.log(`Fetching ${venueIds.length} unique venues`);

    // Fetch venues in parallel batches of 5
    for (let i = 0; i < venueIds.length; i += 5) {
      const batch = venueIds.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (vid) => {
          const res = await fetch(
            `${EVENTBRITE_API_BASE}/venues/${vid}/`,
            { headers: { Authorization: `Bearer ${eventbriteToken}` } }
          );
          if (res.ok) {
            const data = await res.json();
            return { id: vid, data };
          }
          return null;
        })
      );
      for (const r of results) {
        if (r) venueMap.set(r.id, r.data);
      }
      if (i + 5 < venueIds.length) await sleep(200);
    }
    console.log(`Fetched ${venueMap.size} venues`);

    // Step 4: Batch-fetch images for events with image_id
    const imageMap = new Map<string, string>();
    const imageIds = [
      ...new Set(
        allEvents
          .map((ev) => ev.image_id as string | undefined)
          .filter((id): id is string => !!id)
      ),
    ];
    console.log(`Fetching ${imageIds.length} unique images`);

    for (let i = 0; i < imageIds.length; i += 5) {
      const batch = imageIds.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (imgId) => {
          const res = await fetch(
            `${EVENTBRITE_API_BASE}/media/${imgId}/`,
            { headers: { Authorization: `Bearer ${eventbriteToken}` } }
          );
          if (res.ok) {
            const data = await res.json();
            const url = data.original?.url ?? data.url ?? null;
            return url ? { id: imgId, url } : null;
          }
          return null;
        })
      );
      for (const r of results) {
        if (r) imageMap.set(r.id, r.url);
      }
      if (i + 5 < imageIds.length) await sleep(200);
    }
    console.log(`Fetched ${imageMap.size} image URLs`);

    // Step 5: Process events
    const upsertRows: Record<string, unknown>[] = [];
    let skippedNonLive = 0;
    const placeResolver = createPlaceResolver(supabase);
    const existingPlaces = dryRun ? new Map() : await loadExistingEventPlaces(supabase, "eventbrite_id");

    for (const eb of allEvents) {
      // Skip non-live events
      if (eb.status && eb.status !== "live") {
        skippedNonLive++;
        continue;
      }

      // Parse dates — destination search uses start_date/start_time fields
      // API detail uses start.local format
      let dateStr: string;
      let startTime: string;
      let endTime: string | null = null;

      if (eb.start_date) {
        // Destination search format: start_date "2026-03-15", start_time "19:00"
        dateStr = eb.start_date;
        startTime = eb.start_time ?? "00:00";
        if (eb.end_time) endTime = eb.end_time;
      } else if (eb.start?.local) {
        // API detail format: start.local "2026-03-15T19:00:00"
        dateStr = (eb.start.local as string).substring(0, 10);
        startTime = (eb.start.local as string).substring(11, 16);
        if (eb.end?.local) endTime = (eb.end.local as string).substring(11, 16);
      } else {
        continue;
      }

      const eventName: string =
        typeof eb.name === "string" ? eb.name : eb.name?.text ?? "";
      if (!eventName) continue;

      const eventUrl: string =
        eb.url ?? eb.tickets_url ?? `https://www.eventbrite.com/e/${eb.id}`;

      // Map category
      const category = mapCategory(
        eb.category_id ?? eb.category?.id ?? null,
        eventName
      );

      // Venue info — use venue map lookup
      const venue = eb.primary_venue_id
        ? venueMap.get(eb.primary_venue_id) ?? eb.venue ?? null
        : eb.venue ?? null;
      const rawVenueName: string = venue?.name || "";
      const hasRealVenueName = rawVenueName.length > 0 &&
        rawVenueName.toLowerCase() !== "online";
      const venueName = hasRealVenueName ? rawVenueName : "Wellington Venue";

      // Find or create place
      let placeId: string | null = null;
      const addr = venue?.address ?? null;
      const venueAddress: string =
        addr?.localized_address_display ??
        (addr ? [addr.address_1, addr.city].filter(Boolean).join(", ") : null) ??
        `${venueName}, Wellington`;

      if (!dryRun) {
        placeId = existingPlaces.get(String(eb.id)) ?? await placeResolver.resolve({
          name: venueName,
          address: venueAddress,
          latitude: addr?.latitude ? parseFloat(addr.latitude) : undefined,
          longitude: addr?.longitude ? parseFloat(addr.longitude) : undefined,
        });
        if (!placeId) continue;
      }

      // Image — use logo from API detail or image map from batch fetch
      const imageUrl: string | null =
        eb.logo?.original?.url ??
        eb.logo?.url ??
        (eb.image_id ? imageMap.get(eb.image_id) ?? null : null);

      // Price
      let price: number | null = null;
      if (eb.is_free === true) {
        price = 0;
      } else if (eb.ticket_availability?.minimum_ticket_price?.value != null) {
        // Eventbrite API returns price in minor units (cents)
        price = eb.ticket_availability.minimum_ticket_price.value / 100;
      }

      // Description — destination search has summary/full_description, API has description.text
      const rawDesc: string =
        eb.full_description ??
        eb.summary ??
        (typeof eb.description === "string"
          ? eb.description
          : eb.description?.text ?? "");
      const description = rawDesc
        ? rawDesc.substring(0, 2000)
        : `${eventName} at ${venueName}`;

      const row: Record<string, unknown> = {
        eventbrite_id: String(eb.id),
        title: eventName,
        description,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        image_url: imageUrl,
        category,
        ticket_url: eventUrl,
        price,
        eventbrite_url: eventUrl,
      };

      if (!dryRun) {
        row.place_id = placeId;
      }

      upsertRows.push(row);
    }

    console.log(
      `Processed: ${upsertRows.length} events to upsert, ${skippedNonLive} non-live`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEvents.length,
          toUpsert: upsertRows.length,
          skippedNonLive,
          events: upsertRows.map((r) => ({
            eventbriteId: r.eventbrite_id,
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

    // Dedup by eventbrite_id (recurring events can appear multiple times)
    const dedupMap = new Map<string, Record<string, unknown>>();
    for (const row of upsertRows) {
      dedupMap.set(row.eventbrite_id as string, row);
    }
    const localDedupedRows = [...dedupMap.values()];
    console.log(`Deduped: ${upsertRows.length} → ${localDedupedRows.length} unique events`);

    // Cross-source dedup: link to existing events from other sources
    const { rows: dedupedRows, linked: linkedCount } = await deduplicateEvents(
      supabase,
      localDedupedRows,
      "eventbrite",
    );

    // Upsert in batches
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
      const batch = dedupedRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "eventbrite_id" });

      if (error) {
        console.error(`Upsert batch error: ${error.message}`);
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup: delete old pure-Eventbrite events
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("eventbrite_id", "is", null)
      .is("eventfinda_id", null)
      .is("ticketmaster_id", null)
      .is("humanitix_id", null)
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
        skippedNonLive,
        placesCreated: placeResolver.placesCreated,
        deletedOld: deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-eventbrite-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
