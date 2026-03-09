import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Under the Radar genre → app category mapping
// ---------------------------------------------------------------------------

const GENRE_MAP: Record<string, string> = {
  rock: "music",
  "rock/pop": "music",
  pop: "music",
  "indie/alternative": "music",
  alternative: "music",
  indie: "music",
  metal: "music",
  "heavy metal": "music",
  punk: "music",
  "punk/hardcore": "music",
  hardcore: "music",
  "hip hop": "music",
  "hip-hop": "music",
  rap: "music",
  electronic: "music",
  electronica: "music",
  "drum & bass": "music",
  house: "music",
  techno: "music",
  jazz: "music",
  blues: "music",
  soul: "music",
  funk: "music",
  reggae: "music",
  dub: "music",
  "r&b": "music",
  country: "music",
  "country/folk": "music",
  folk: "music",
  "acoustic/solo": "music",
  acoustic: "music",
  "singer/songwriter": "music",
  classical: "music",
  experimental: "music",
  noise: "music",
  psychedelic: "music",
  garage: "music",
  "post-punk": "music",
  shoegaze: "music",
  ska: "music",
  latin: "music",
  "world music": "music",
  roots: "music",
  ambient: "music",
  "lo-fi": "music",
  comedy: "comedy",
  "stand-up": "comedy",
  "stand up": "comedy",
  improv: "comedy",
  theatre: "art",
  theater: "art",
  dance: "art",
  "spoken word": "art",
  poetry: "art",
  cabaret: "art",
  circus: "art",
  burlesque: "art",
  film: "art",
  cinema: "art",
};

const KEYWORD_MAP: Record<string, string> = {
  comedy: "comedy",
  "stand-up": "comedy",
  comedian: "comedy",
  improv: "comedy",
  quiz: "quiz",
  trivia: "quiz",
  market: "market",
  food: "food",
  wine: "food",
  beer: "food",
  craft: "craft",
  kids: "kids",
  family: "kids",
  festival: "cultural",
  cultural: "cultural",
};

function mapCategory(genres: string[], eventTitle: string): string {
  for (const genre of genres) {
    const lower = genre.toLowerCase().trim();
    if (GENRE_MAP[lower]) return GENRE_MAP[lower];
    for (const [key, value] of Object.entries(GENRE_MAP)) {
      if (lower.includes(key) || key.includes(lower)) return value;
    }
  }
  const titleLower = eventTitle.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (titleLower.includes(keyword)) return category;
  }
  return "music"; // UTR is primarily a music site
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
    name.includes("bistro")
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
  if (name.includes("park") || name.includes("reserve") || name.includes("garden"))
    return "park";
  if (
    name.includes("museum") ||
    name.includes("gallery") ||
    name.includes("library") ||
    name.includes("stadium")
  )
    return "attraction";
  return "venue";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .trim();
}

function parseTime(text: string): string | null {
  const m = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  let hours = parseInt(m[1]);
  const minutes = m[2];
  const ampm = m[3].toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UTRListEntry {
  id: number;
  title: string;
  url: string;
  date: string;
  startTime: string;
  venueName: string;
  imageUrl: string | null;
  ticketUrl: string | null;
}

// ---------------------------------------------------------------------------
// Scraping: list page (regex-based, no DOM parser needed)
// ---------------------------------------------------------------------------

const UTR_BASE = "https://www.undertheradar.co.nz";
const UTR_LIST_URL =
  `${UTR_BASE}/panels/shows/showPanelListAjax.php?regionID=18`;

// Regex to extract each vevent block
const VEVENT_RE = /class="vevent"[\s\S]*?<!--\s*close vevent\s*-->/g;

// Regexes for fields within a vevent block
const GIG_LINK_RE = /class="gig-title"[^>]*>\s*<a\s+href="(\/gig\/(\d+)\/[^"]+)"\s+class="summary url"\s+title="([^"]*)">/;
const DATE_RE = /class="dtstart"[^>]*>(\d{4}-\d{2}-\d{2})<\/span>/;
const VENUE_RE = /class="fn org"[^>]*>([^<]+)<\/span>/;
const IMAGE_RE = /data-original="(https:\/\/www\.undertheradar\.co\.nz\/images\/[^"]+)"/;
const TICKET_RE = /class="buybuttonsm"[^>]*href="([^"]+)"/;
// Also try href before class
const TICKET_RE2 = /href="([^"]*\/ticket\/[^"]+)"[^>]*class="buybuttonsm"/;

function parseListHtml(html: string): UTRListEntry[] {
  const entries: UTRListEntry[] = [];
  let match;

  while ((match = VEVENT_RE.exec(html)) !== null) {
    const block = match[0];

    const gigMatch = GIG_LINK_RE.exec(block);
    if (!gigMatch) continue;

    const href = gigMatch[1];
    const gigId = parseInt(gigMatch[2]);
    const title = stripHtml(gigMatch[3]);
    if (!title) continue;

    const dateMatch = DATE_RE.exec(block);
    if (!dateMatch) continue;
    const dateStr = dateMatch[1];

    // Time from the lite span text
    const startTime = parseTime(block) ?? "19:00";

    // Venue
    const venueMatch = VENUE_RE.exec(block);
    const venueName = venueMatch ? stripHtml(venueMatch[1]) : "Wellington Venue";

    // Image from data-original
    const imgMatch = IMAGE_RE.exec(block);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    // Ticket URL
    const ticketMatch = TICKET_RE.exec(block) || TICKET_RE2.exec(block);
    let ticketUrl: string | null = null;
    if (ticketMatch) {
      const ticketHref = ticketMatch[1];
      ticketUrl = ticketHref.startsWith("http")
        ? ticketHref
        : `${UTR_BASE}${ticketHref}`;
    }

    entries.push({
      id: gigId,
      title,
      url: `${UTR_BASE}${href}`,
      date: dateStr,
      startTime,
      venueName,
      imageUrl,
      ticketUrl,
    });
  }

  return entries;
}

async function fetchListPage(
  offset: number,
  limit: number
): Promise<UTRListEntry[]> {
  const url = `${UTR_LIST_URL}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "WellyApp/1.0 (event-sync)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    console.error(`List page error ${res.status}`);
    return [];
  }

  const html = await res.text();
  return parseListHtml(html);
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

    // -----------------------------------------------------------------------
    // Step 1: Fetch event listings from AJAX endpoint
    // -----------------------------------------------------------------------
    const allEntries: UTRListEntry[] = [];
    const LIMIT = 50;
    const MAX_PAGES = 6; // Up to 300 events

    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * LIMIT;
      console.log(`Fetching UTR list page ${page + 1}: offset=${offset}`);
      const entries = await fetchListPage(offset, LIMIT);
      console.log(`  Got ${entries.length} entries`);
      allEntries.push(...entries);

      if (entries.length < LIMIT) break;
      if (page < MAX_PAGES - 1) await sleep(500);
    }

    console.log(`Total UTR listings: ${allEntries.length}`);

    // -----------------------------------------------------------------------
    // Step 2: Build place cache (batch lookup, then create missing)
    // -----------------------------------------------------------------------
    // Collect unique venue names
    const venueNames = [
      ...new Set(
        allEntries.map((e) =>
          e.venueName.replace(/,\s*Wellington$/i, "").trim()
        )
      ),
    ];

    // placeId cache: venueName (lowercase) → place UUID
    const placeCache = new Map<string, string>();
    let placesCreated = 0;

    if (!dryRun) {
      // Batch fetch all existing places
      const { data: existingPlaces } = await supabase
        .from("places")
        .select("id, name");

      if (existingPlaces) {
        for (const p of existingPlaces) {
          placeCache.set(p.name.toLowerCase(), p.id);
        }
      }

      // Create missing places
      const missingVenues = venueNames.filter(
        (v) => !placeCache.has(v.toLowerCase())
      );

      if (missingVenues.length > 0) {
        const newPlaces = missingVenues.map((name) => ({
          name,
          category: inferPlaceCategory(name),
          address: `${name}, Wellington`,
          latitude: -41.2924,
          longitude: 174.7787,
        }));

        const { data: created, error: placeErr } = await supabase
          .from("places")
          .insert(newPlaces)
          .select("id, name");

        if (placeErr) {
          console.error(`Batch place creation error: ${placeErr.message}`);
        } else if (created) {
          for (const p of created) {
            placeCache.set(p.name.toLowerCase(), p.id);
          }
          placesCreated = created.length;
          console.log(`  Created ${placesCreated} new places`);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Step 3: Process events into upsert rows
    // -----------------------------------------------------------------------
    const upsertRows: Record<string, unknown>[] = [];

    for (const entry of allEntries) {
      const category = mapCategory([], entry.title);
      const description = `${entry.title} at ${entry.venueName}`;

      const venueName = entry.venueName
        .replace(/,\s*Wellington$/i, "")
        .trim();
      const placeId = placeCache.get(venueName.toLowerCase());

      const row: Record<string, unknown> = {
        undertheradar_id: entry.id,
        title: entry.title,
        description,
        date: entry.date,
        start_time: entry.startTime,
        image_url: entry.imageUrl,
        category,
        ticket_url: entry.ticketUrl,
        undertheradar_url: entry.url,
      };

      if (!dryRun && placeId) {
        row.place_id = placeId;
      }

      upsertRows.push(row);
    }

    console.log(`Processed: ${upsertRows.length} events to upsert`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalFetched: allEntries.length,
          toUpsert: upsertRows.length,
          events: upsertRows.map((r) => ({
            undertheradarId: r.undertheradar_id,
            title: r.title,
            date: r.date,
            category: r.category,
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
        .upsert(batch, { onConflict: "undertheradar_id" });

      if (error) {
        console.error(`Upsert batch error: ${error.message}`);
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup old UTR-synced events
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toLocaleDateString("en-CA", {
      timeZone: "Pacific/Auckland",
    });

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("undertheradar_id", "is", null)
      .lt("date", cutoffStr)
      .select("id");

    if (deleteErr) {
      console.error(`Cleanup error: ${deleteErr.message}`);
    } else {
      deletedCount = deletedRows?.length ?? 0;
    }

    console.log(
      `Done: ${upserted} upserted, ${upsertErrors} errors, ${deletedCount} old events cleaned up, ${placesCreated} places created`
    );

    return new Response(
      JSON.stringify({
        totalFetched: allEntries.length,
        upserted,
        upsertErrors,
        placesCreated,
        deletedOld: deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("sync-undertheradar-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
