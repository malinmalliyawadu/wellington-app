import { createClient } from "npm:@supabase/supabase-js@2";
import { deduplicateEvents } from "../_shared/deduplicateEvents.ts";
import { createPlaceResolver, loadExistingEventPlaces } from "../_shared/resolvePlace.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Category mapping (ported from scripts/fetch-eventfinda-events.mjs)
// ---------------------------------------------------------------------------

const CATEGORY_SLUG_MAP: Record<string, string> = {
  // Music
  "concerts-gig-guide": "music",
  "classic-rock-gigs": "music",
  "rock-gigs": "music",
  "pop-gigs": "music",
  "jazz-gigs": "music",
  "hip-hop-gigs": "music",
  "rnb-gigs": "music",
  "electronic-gigs": "music",
  "classical-concerts": "music",
  "folk-gigs": "music",
  "country-gigs": "music",
  "metal-gigs": "music",
  "punk-gigs": "music",
  "indie-gigs": "music",
  "soul-gigs": "music",
  "blues-gigs": "music",
  "reggae-gigs": "music",
  "dj-dance": "music",
  opera: "music",
  "world-music-gigs": "music",
  "alternative-gigs": "music",
  "singer-songwriter-gigs": "music",
  "latin-gigs": "music",
  "funk-gigs": "music",

  // Comedy
  comedy: "comedy",
  "stand-up-comedy": "comedy",
  "improv-comedy": "comedy",
  "comedy-shows": "comedy",

  // Art / Performing arts
  "performing-arts": "art",
  theatre: "art",
  dance: "art",
  ballet: "art",
  musicals: "art",
  "visual-arts": "art",
  exhibitions: "art",
  galleries: "art",
  film: "art",
  cinema: "art",
  photography: "art",
  literary: "art",
  poetry: "art",
  cabaret: "art",
  circus: "art",
  fringe: "art",

  // Food
  "food-drink": "food",
  "food-wine": "food",
  "beer-festivals": "food",
  "wine-events": "food",
  "cooking-classes": "food",
  dining: "food",
  "food-festivals": "food",

  // Market
  markets: "market",
  "craft-markets": "market",
  "farmers-markets": "market",
  "night-markets": "market",

  // Community
  community: "community",
  "charity-fundraisers": "community",
  social: "community",
  networking: "community",
  workshops: "community",
  seminars: "community",
  conferences: "community",
  lectures: "community",
  talks: "community",
  tours: "community",
  sports: "community",
  fitness: "community",
  "wellness-health": "community",
  dating: "community",
  singles: "community",
  socials: "community",
  "speed-dating": "community",
  lifestyle: "community",
  "nature-outdoors": "community",
  walks: "community",

  // Quiz
  "quiz-nights": "quiz",
  trivia: "quiz",

  // Craft
  craft: "craft",
  pottery: "craft",
  diy: "craft",
  maker: "craft",

  // Kids
  "kids-family": "kids",
  family: "kids",
  children: "kids",
  kids: "kids",

  // Cultural
  cultural: "cultural",
  "festivals-lifestyle": "cultural",
  heritage: "cultural",
  maori: "cultural",
  pasifika: "cultural",
  "cultural-festivals": "cultural",
};

const KEYWORD_MAP: Record<string, string> = {
  concert: "music",
  gig: "music",
  music: "music",
  band: "music",
  dj: "music",
  comedy: "comedy",
  "stand-up": "comedy",
  improv: "comedy",
  comedian: "comedy",
  theatre: "art",
  theater: "art",
  exhibition: "art",
  gallery: "art",
  dance: "art",
  ballet: "art",
  fringe: "art",
  film: "art",
  food: "food",
  wine: "food",
  beer: "food",
  dining: "food",
  cooking: "food",
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

function mapCategory(
  categoryData: { slug?: string; name?: string } | undefined,
  eventName: string
): string {
  // Eventfinda API returns category as an object with id, name, slug
  if (categoryData?.slug) {
    const slug = categoryData.slug;
    if (CATEGORY_SLUG_MAP[slug]) return CATEGORY_SLUG_MAP[slug];
    // Try partial slug matching
    for (const [key, value] of Object.entries(CATEGORY_SLUG_MAP)) {
      if (slug.includes(key) || key.includes(slug)) return value;
    }
  }

  // Fall back to keyword matching on event name + category name
  const text = (
    (categoryData?.name || "") +
    " " +
    (categoryData?.slug || "") +
    " " +
    (eventName || "")
  ).toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category;
  }

  return "community"; // default
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


function stripHtml(html: string): string {
  const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "\u2013",
    mdash: "\u2014",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201C",
    rdquo: "\u201D",
    bull: "\u2022",
    hellip: "\u2026",
    copy: "\u00A9",
    reg: "\u00AE",
    trade: "\u2122",
    frac12: "\u00BD",
    frac14: "\u00BC",
    frac34: "\u00BE",
    deg: "\u00B0",
    times: "\u00D7",
    divide: "\u00F7",
    plusmn: "\u00B1",
    cent: "\u00A2",
    pound: "\u00A3",
    euro: "\u20AC",
    laquo: "\u00AB",
    raquo: "\u00BB",
  };

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(
      /&([a-zA-Z]+);/g,
      (match, name) => NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? match
    )
    .trim();
}

// deno-lint-ignore no-explicit-any
function extractImageUrl(images: any): string | null {
  if (!images) return null;
  // API returns { "@attributes": {...}, "images": [...] }
  const imageArr = images?.images ?? (Array.isArray(images) ? images : null);
  if (!imageArr || !Array.isArray(imageArr) || imageArr.length === 0)
    return null;
  const img = imageArr[0];
  const transforms = img?.transforms?.transforms;
  if (!transforms || !Array.isArray(transforms) || transforms.length === 0)
    return null;

  // Pick the largest transform (highest width)
  let best = transforms[0];
  for (const t of transforms) {
    if ((t.width ?? 0) > (best.width ?? 0)) best = t;
  }
  return best.url ?? null;
}

function extractPrice(
  isFree: boolean,
  ticketTypes: Array<{ price?: string | number }> | unknown | undefined
): number | null {
  if (isFree) return 0;
  if (!ticketTypes) return null;

  // API returns { "@attributes": {...}, "ticket_types": [...] }
  // deno-lint-ignore no-explicit-any
  const raw = (ticketTypes as any)?.ticket_types ?? ticketTypes;
  const types = Array.isArray(raw) ? raw : [raw];
  if (types.length === 0) return null;

  let lowest: number | null = null;
  for (const tt of types) {
    const p = typeof tt.price === "string" ? parseFloat(tt.price) : tt.price;
    if (p != null && !isNaN(p) && (lowest === null || p < lowest)) {
      lowest = p;
    }
  }
  return lowest;
}

function extractTicketUrl(
  webSites: Array<{ url?: string }> | unknown | undefined,
  eventUrl: string
): string {
  if (!webSites) return eventUrl;
  // API returns { "@attributes": {...}, "web_sites": [...] }
  // deno-lint-ignore no-explicit-any
  const raw = (webSites as any)?.web_sites ?? webSites;
  const sites = Array.isArray(raw) ? raw : [raw];
  if (sites.length > 0 && sites[0]?.url) {
    return sites[0].url;
  }
  return eventUrl;
}

// ---------------------------------------------------------------------------
// Eventfinda API types
// ---------------------------------------------------------------------------

interface EventfindaEvent {
  id: number;
  name: string;
  description?: string;
  url: string;
  datetime_start: string;
  datetime_end?: string;
  location_summary?: string;
  address?: string;
  point?: { lat: number; lng: number };
  category?: { id: number; name: string; slug: string };
  is_free?: boolean;
  is_cancelled?: boolean;
  images?: unknown;
  ticket_types?: unknown;
  restrictions?: string;
  web_sites?: unknown;
}

interface EventfindaResponse {
  events: EventfindaEvent[];
  "@attributes"?: { count?: number; total_count?: number };
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
          return new Response(JSON.stringify({ error: "Unauthorized: requires service_role" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized: missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const efUsername = Deno.env.get("EVENTFINDA_USERNAME");
    const efPassword = Deno.env.get("EVENTFINDA_PASSWORD");
    if (!efUsername || !efPassword) {
      return new Response(
        JSON.stringify({ error: "Missing EVENTFINDA_USERNAME or EVENTFINDA_PASSWORD secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const basicAuth = btoa(`${efUsername}:${efPassword}`);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });

    // Fetch events from Eventfinda API with pagination
    const allEvents: EventfindaEvent[] = [];
    const ROWS_PER_PAGE = 20;
    const MAX_PAGES = 20;

    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * ROWS_PER_PAGE;
      const params = new URLSearchParams({
        location_slug: "wellington",
        start_date: today,
        rows: String(ROWS_PER_PAGE),
        offset: String(offset),
        order: "date",
        fields:
          "event:(id,name,description,url,datetime_start,datetime_end,location_summary,address,point,category,is_free,images,ticket_types,is_cancelled,restrictions,web_sites)",
      });

      const apiUrl = `https://api.eventfinda.co.nz/v2/events.json?${params}`;
      console.log(`Fetching page ${page + 1}: offset=${offset}`);

      const res = await fetch(apiUrl, {
        headers: { Authorization: `Basic ${basicAuth}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`API error ${res.status}: ${errText}`);
        break;
      }

      const data: EventfindaResponse = await res.json();
      const events = data.events ?? [];
      console.log(`  Got ${events.length} events`);

      allEvents.push(...events);

      // Stop if we got fewer than requested (last page)
      if (events.length < ROWS_PER_PAGE) break;

      // Rate limit: 1 req/sec
      if (page < MAX_PAGES - 1) await sleep(1100);
    }

    console.log(`Total events fetched: ${allEvents.length}`);

    // Process events
    const upsertRows: Record<string, unknown>[] = [];
    let skippedCancelled = 0;
    const placeResolver = createPlaceResolver(supabase);
    const existingPlaces = dryRun ? new Map() : await loadExistingEventPlaces(supabase, "eventfinda_id");

    for (const ef of allEvents) {
      // Skip cancelled events
      if (ef.is_cancelled) {
        skippedCancelled++;
        continue;
      }

      // Map category
      const category = mapCategory(ef.category, ef.name);

      // Parse dates — Eventfinda returns NZ local time (e.g. "2026-03-08 09:00:00")
      // so we extract date/time components directly to avoid timezone conversion issues
      const dateStr = ef.datetime_start.substring(0, 10); // "YYYY-MM-DD"
      const startTime = ef.datetime_start.substring(11, 16); // "HH:mm"
      let endTime: string | null = null;
      if (ef.datetime_end) {
        endTime = ef.datetime_end.substring(11, 16);
      }

      // Find or create place
      const venueName = ef.location_summary || "Wellington Venue";
      let placeId: string | null = null;

      if (!dryRun) {
        placeId = existingPlaces.get(String(ef.id)) ?? await placeResolver.resolve({
          name: venueName,
          address: ef.address || undefined,
          latitude: ef.point?.lat,
          longitude: ef.point?.lng,
        });
        if (!placeId) continue;
      }

      // Extract image URL (largest transform from Eventfinda CDN)
      const imageUrl = extractImageUrl(ef.images ?? []);

      // Extract price
      const price = extractPrice(ef.is_free ?? false, ef.ticket_types);

      // Extract ticket URL
      const ticketUrl = extractTicketUrl(ef.web_sites, ef.url);

      // Strip HTML from description
      const strippedVenueName = venueName.replace(/,\s*Wellington$/i, "").trim();
      const description = ef.description
        ? stripHtml(ef.description)
        : `${ef.name} at ${strippedVenueName}`;

      const row: Record<string, unknown> = {
        eventfinda_id: ef.id,
        title: stripHtml(ef.name),
        description,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        image_url: imageUrl,
        category,
        ticket_url: ticketUrl,
        price,
        eventfinda_url: ef.url,
      };

      if (!dryRun) {
        row.place_id = placeId;
      }

      upsertRows.push(row);
    }

    console.log(
      `Processed: ${upsertRows.length} events to upsert, ${skippedCancelled} cancelled`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEvents.length,
          toUpsert: upsertRows.length,
          skippedCancelled,
          events: upsertRows.map((r) => ({
            eventfindaId: r.eventfinda_id,
            title: r.title,
            date: r.date,
            category: r.category,
            price: r.price,
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
      "eventfinda",
    );

    // Upsert in batches
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
      const batch = dedupedRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "eventfinda_id" });

      if (error) {
        console.error(`Upsert batch error: ${error.message}`);
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup: delete old Eventfinda-synced events (past by N days)
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("eventfinda_id", "is", null)
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
        skippedCancelled,
        placesCreated: placeResolver.placesCreated,
        deletedOld: deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-eventfinda-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
