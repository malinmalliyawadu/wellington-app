import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Category mapping: Ticketmaster classifications → app categories
// ---------------------------------------------------------------------------

// Ticketmaster uses segment > genre > subGenre hierarchy
// Segments: Music, Sports, Arts & Theatre, Film, Miscellaneous
const SEGMENT_MAP: Record<string, string> = {
  Music: "music",
  Sports: "community",
  "Arts & Theatre": "art",
  Film: "art",
};

const GENRE_MAP: Record<string, string> = {
  // Music genres → music
  Rock: "music",
  Pop: "music",
  "Hip-Hop/Rap": "music",
  "R&B": "music",
  Country: "music",
  Jazz: "music",
  Classical: "music",
  Electronic: "music",
  Alternative: "music",
  Folk: "music",
  Metal: "music",
  Reggae: "music",
  Blues: "music",
  Latin: "music",
  World: "music",

  // Arts & Theatre genres
  Comedy: "comedy",
  Theatre: "art",
  Dance: "art",
  Opera: "music",
  Musical: "art",
  Cabaret: "art",
  Circus: "art",
  Magic: "art",

  // Family / Kids
  "Children's Theatre": "kids",
  Family: "kids",
  "Childrens Music": "kids",

  // Cultural / Community
  Cultural: "cultural",
  Festival: "cultural",
  Community: "community",
  Lecture: "community",
  Seminar: "community",

  // Food & Drink
  "Food & Drink": "food",
};

const KEYWORD_MAP: Record<string, string> = {
  concert: "music",
  gig: "music",
  music: "music",
  band: "music",
  dj: "music",
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
  food: "food",
  wine: "food",
  beer: "food",
  dining: "food",
  market: "market",
  quiz: "quiz",
  trivia: "quiz",
  craft: "craft",
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
  classifications: TicketmasterClassification[] | undefined,
  eventName: string
): string {
  if (classifications && classifications.length > 0) {
    const c = classifications[0];

    // Try genre first (more specific)
    if (c.genre?.name && GENRE_MAP[c.genre.name]) {
      return GENRE_MAP[c.genre.name];
    }

    // Try subGenre
    if (c.subGenre?.name && GENRE_MAP[c.subGenre.name]) {
      return GENRE_MAP[c.subGenre.name];
    }

    // Try segment (broadest)
    if (c.segment?.name && SEGMENT_MAP[c.segment.name]) {
      return SEGMENT_MAP[c.segment.name];
    }
  }

  // Fall back to keyword matching on event name
  const text = eventName.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category;
  }

  return "community"; // default
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      (match, name) =>
        NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? match
    )
    .trim();
}

// ---------------------------------------------------------------------------
// Ticketmaster API types
// ---------------------------------------------------------------------------

interface TicketmasterClassification {
  segment?: { name: string };
  genre?: { name: string };
  subGenre?: { name: string };
}

interface TicketmasterVenue {
  name?: string;
  address?: { line1?: string };
  city?: { name?: string };
  location?: { latitude?: string; longitude?: string };
}

interface TicketmasterImage {
  url: string;
  width?: number;
  height?: number;
  ratio?: string;
}

interface TicketmasterPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

interface TicketmasterDate {
  start?: {
    localDate?: string;
    localTime?: string;
  };
  end?: {
    localDate?: string;
    localTime?: string;
  };
  status?: { code?: string };
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  info?: string;
  pleaseNote?: string;
  dates?: TicketmasterDate;
  classifications?: TicketmasterClassification[];
  priceRanges?: TicketmasterPriceRange[];
  images?: TicketmasterImage[];
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function extractImageUrl(images: TicketmasterImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;

  // Prefer 16:9 ratio images, then pick largest
  const preferred = images.filter((img) => img.ratio === "16_9");
  const pool = preferred.length > 0 ? preferred : images;

  let best = pool[0];
  for (const img of pool) {
    if ((img.width ?? 0) > (best.width ?? 0)) best = img;
  }
  return best.url ?? null;
}

function extractPrice(priceRanges: TicketmasterPriceRange[] | undefined): number | null {
  if (!priceRanges || priceRanges.length === 0) return null;

  let lowest: number | null = null;
  for (const pr of priceRanges) {
    if (pr.min != null && (lowest === null || pr.min < lowest)) {
      lowest = pr.min;
    }
  }
  return lowest;
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

    const apiKey = Deno.env.get("TICKETMASTER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing TICKETMASTER_API_KEY secret",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Fetch events from Ticketmaster Discovery API with pagination
    const allEvents: TicketmasterEvent[] = [];
    const PAGE_SIZE = 50;
    const MAX_PAGES = 10; // 50 * 10 = 500 events max

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({
        apikey: apiKey,
        countryCode: "NZ",
        city: "Wellington",
        startDateTime: `${today}T00:00:00Z`,
        size: String(PAGE_SIZE),
        page: String(page),
        sort: "date,asc",
      });

      const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
      console.log(`Fetching page ${page + 1}`);

      const res = await fetch(apiUrl);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`API error ${res.status}: ${errText}`);
        break;
      }

      const data: TicketmasterResponse = await res.json();
      const events = data._embedded?.events ?? [];
      console.log(`  Got ${events.length} events`);

      allEvents.push(...events);

      // Stop if we've fetched all pages
      const totalPages = data.page?.totalPages ?? 0;
      if (page + 1 >= totalPages) break;

      // Stop if no events returned
      if (events.length === 0) break;

      // Rate limit: be polite (5 req/sec allowed, but be conservative)
      if (page < MAX_PAGES - 1) await sleep(300);
    }

    console.log(`Total events fetched: ${allEvents.length}`);

    // Process events
    const upsertRows: Record<string, unknown>[] = [];
    let skippedCancelled = 0;
    let skippedDuplicate = 0;
    let placesCreated = 0;

    for (const tm of allEvents) {
      // Skip cancelled/postponed events
      const statusCode = tm.dates?.status?.code;
      if (statusCode === "cancelled" || statusCode === "postponed") {
        skippedCancelled++;
        continue;
      }

      // Parse dates
      const localDate = tm.dates?.start?.localDate;
      if (!localDate) continue; // Skip events without a date

      const startTime = tm.dates?.start?.localTime ?? "19:00:00";
      // Format as HH:MM
      const startTimeFormatted = startTime.substring(0, 5);

      let endTime: string | null = null;
      if (tm.dates?.end?.localTime) {
        endTime = tm.dates.end.localTime.substring(0, 5);
      }

      // Map category
      const category = mapCategory(tm.classifications, tm.name);

      // Extract venue info
      const venue = tm._embedded?.venues?.[0];
      const venueName = venue?.name || "Wellington Venue";

      // Cross-source dedup: check if Eventfinda already has this event
      // Match on same title + date + venue name
      if (!dryRun) {
        const { data: existingEvent } = await supabase
          .from("events")
          .select("id, eventfinda_id, humanitix_id, eventbrite_id")
          .eq("date", localDate)
          .ilike("title", stripHtml(tm.name))
          .or("eventfinda_id.not.is.null,humanitix_id.not.is.null,eventbrite_id.not.is.null")
          .limit(1);

        if (existingEvent && existingEvent.length > 0) {
          // Event already exists from Eventfinda — link ticketmaster_id to it
          await supabase
            .from("events")
            .update({
              ticketmaster_id: tm.id,
              ticketmaster_url: tm.url,
            })
            .eq("id", existingEvent[0].id);
          skippedDuplicate++;
          console.log(`  Linked to existing Eventfinda event: ${tm.name}`);
          continue;
        }
      }

      // Find or create place
      let placeId: string | null = null;

      if (!dryRun) {
        // Case-insensitive name match
        const { data: match } = await supabase
          .from("places")
          .select("id")
          .ilike("name", venueName)
          .limit(1);

        if (match && match.length > 0) {
          placeId = match[0].id;
        } else {
          // Create new place
          const lat = venue?.location?.latitude
            ? parseFloat(venue.location.latitude)
            : -41.2924;
          const lng = venue?.location?.longitude
            ? parseFloat(venue.location.longitude)
            : 174.7787;
          const address =
            venue?.address?.line1 || `${venueName}, Wellington`;

          const { data: newPlace, error: placeErr } = await supabase
            .from("places")
            .insert({
              name: venueName,
              category: inferPlaceCategory(venueName),
              address,
              latitude: lat,
              longitude: lng,
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
          console.log(`  Created place: ${venueName}`);
        }
      }

      // Extract image URL
      const imageUrl = extractImageUrl(tm.images);

      // Extract price
      const price = extractPrice(tm.priceRanges);

      // Build description from info + pleaseNote
      const infoParts: string[] = [];
      if (tm.info) infoParts.push(stripHtml(tm.info));
      if (tm.pleaseNote) infoParts.push(stripHtml(tm.pleaseNote));
      const description =
        infoParts.length > 0
          ? infoParts.join("\n\n")
          : `${tm.name} at ${venueName}`;

      const row: Record<string, unknown> = {
        ticketmaster_id: tm.id,
        title: stripHtml(tm.name),
        description,
        date: localDate,
        start_time: startTimeFormatted,
        end_time: endTime,
        image_url: imageUrl,
        category,
        ticket_url: tm.url,
        price,
        ticketmaster_url: tm.url,
      };

      if (!dryRun) {
        row.place_id = placeId;
      }

      upsertRows.push(row);
    }

    console.log(
      `Processed: ${upsertRows.length} events to upsert, ${skippedCancelled} cancelled, ${skippedDuplicate} linked to Eventfinda`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEvents.length,
          toUpsert: upsertRows.length,
          skippedCancelled,
          skippedDuplicate,
          events: upsertRows.map((r) => ({
            ticketmasterId: r.ticketmaster_id,
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

    // Upsert in batches
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
      const batch = upsertRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "ticketmaster_id" });

      if (error) {
        console.error(`Upsert batch error: ${error.message}`);
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup: delete old Ticketmaster-synced events (past by N days)
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("ticketmaster_id", "is", null)
      .is("eventfinda_id", null) // Only delete pure-Ticketmaster events (not linked ones)
      .is("humanitix_id", null)
      .is("eventbrite_id", null)
      .lt("date", cutoffStr)
      .select("id");

    if (deleteErr) {
      console.error(`Cleanup error: ${deleteErr.message}`);
    } else {
      deletedCount = deletedRows?.length ?? 0;
    }

    console.log(
      `Done: ${upserted} upserted, ${upsertErrors} errors, ${deletedCount} old events cleaned up, ${placesCreated} places created, ${skippedDuplicate} linked to Eventfinda`
    );

    return new Response(
      JSON.stringify({
        totalFetched: allEvents.length,
        upserted,
        upsertErrors,
        skippedCancelled,
        skippedDuplicate,
        placesCreated,
        deletedOld: deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-ticketmaster-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
