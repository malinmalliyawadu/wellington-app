import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Description scraping
// ---------------------------------------------------------------------------

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
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCharCode(parseInt(dec, 10))
    )
    .replace(
      /&([a-zA-Z]+);/g,
      (match, name: string) =>
        NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? match
    );
}

function stripHtmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function scrapeEventfindaDescription(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WellyApp/1.0; +https://wellyapp.nz)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const descMatch = html.match(
      /<div[^>]*id="eventDescription"[^>]*>([\s\S]*?)<\/div>/
    );
    if (!descMatch) return null;

    return stripHtmlToText(descMatch[1]) || null;
  } catch (err) {
    console.error(`Failed to scrape Eventfinda ${url}: ${err}`);
    return null;
  }
}

export async function scrapeHumanitixDescription(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WellyApp/1.0; +https://wellyapp.nz)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ldMatch = html.match(
      /<script type="application\/ld\+json">(\{.*?\})<\/script>/s
    );
    if (!ldMatch) return null;

    const ld = JSON.parse(ldMatch[1]);
    return ld.description || null;
  } catch (err) {
    console.error(`Failed to scrape Humanitix ${url}: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// AI description generation
// ---------------------------------------------------------------------------

async function generateAIDescription(
  anthropic: Anthropic,
  event: {
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string | null;
    category: string;
    price: number | null;
  },
  placeName: string
): Promise<string | null> {
  const priceText =
    event.price != null && event.price > 0
      ? `$${event.price.toFixed(2)}`
      : "Free";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are writing an event description for a Wellington, New Zealand local discovery app called Welly.

Rewrite the following event description into clean, well-formatted markdown. Make it informative, engaging, and easy to scan. Keep it concise (2-4 short paragraphs max). Do NOT invent details that aren't in the original — only restructure and improve the writing.

Use markdown formatting:
- Use ### headings to organize sections after the initial preamble
- **Bold** for emphasis on key details
- Bullet points for practical info if appropriate
- Keep paragraphs short
- Separate paragraphs with a blank line
- Use emojis where appropriate to make it feel friendly and fun

Event details:
- Title: ${event.title}
- Date: ${event.date}
- Time: ${event.start_time}${event.end_time ? ` – ${event.end_time}` : ""}
- Category: ${event.category}
- Price: ${priceText}
${placeName ? `- Venue: ${placeName}` : ""}

Original description:
${event.description}

Write ONLY the improved markdown description. No title, no preamble.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "";
  return text || null;
}

// ---------------------------------------------------------------------------
// Detect placeholder / truncated descriptions that need scraping
// ---------------------------------------------------------------------------

function needsEventfindaScrape(description: string): boolean {
  return description.trimEnd().endsWith("...");
}

function needsHumanitixScrape(description: string, title: string): boolean {
  return (
    description.startsWith(title + " at ") &&
    !description.includes("\n") &&
    description.length < 200
  );
}

// ---------------------------------------------------------------------------
// Main enrichment pipeline — source-agnostic
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Enrich all upcoming events that are missing an ai_description.
 * For each event: scrape full description if needed, then generate AI description.
 * Call this from any sync function after upserting events.
 */
export async function enrichEvents(
  supabase: SupabaseClient,
  options?: { limit?: number }
): Promise<{ enriched: number; errors: number }> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    console.log("Skipping AI enrichment: ANTHROPIC_API_KEY not set");
    return { enriched: 0, errors: 0 };
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Pacific/Auckland",
  });
  const limit = options?.limit ?? 50;

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, end_time, category, price, place_id, eventfinda_url, humanitix_url"
    )
    .is("ai_description", null)
    .is("creator_id", null)
    .gte("date", today)
    .order("ai_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!events || events.length === 0) {
    console.log("No events to enrich");
    return { enriched: 0, errors: 0 };
  }

  console.log(`Enriching ${events.length} events with AI descriptions...`);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  let enriched = 0;
  let errors = 0;

  for (const ev of events) {
    try {
      let description = ev.description as string;

      // Scrape full description if truncated/placeholder
      if (ev.eventfinda_url && needsEventfindaScrape(description)) {
        const scraped = await scrapeEventfindaDescription(ev.eventfinda_url);
        if (scraped) {
          description = scraped;
          await supabase
            .from("events")
            .update({ description })
            .eq("id", ev.id);
        }
      } else if (
        ev.humanitix_url &&
        needsHumanitixScrape(description, ev.title as string)
      ) {
        const scraped = await scrapeHumanitixDescription(ev.humanitix_url);
        if (scraped) {
          description = scraped;
          await supabase
            .from("events")
            .update({ description })
            .eq("id", ev.id);
        }
      }

      // Get place name for context
      let placeName = "";
      if (ev.place_id) {
        const { data: place } = await supabase
          .from("places")
          .select("name")
          .eq("id", ev.place_id)
          .single();
        if (place) placeName = place.name;
      }

      // Generate AI description
      const aiDesc = await generateAIDescription(
        anthropic,
        { ...ev, description, end_time: ev.end_time ?? null },
        placeName
      );

      if (aiDesc) {
        await supabase
          .from("events")
          .update({ ai_description: aiDesc })
          .eq("id", ev.id);
        enriched++;
      }

      // Brief pause between API calls
      await sleep(300);
    } catch (err) {
      console.error(`Failed to enrich event ${ev.id}: ${err}`);
      errors++;
    }
  }

  console.log(`Enrichment done: ${enriched} enriched, ${errors} errors`);
  return { enriched, errors };
}

/**
 * Enrich a single event by ID. Used by the enrich-event-description edge function.
 * If regenerate is true, re-generates even if ai_description already exists.
 */
export async function enrichSingleEvent(
  supabase: SupabaseClient,
  eventId: string,
  regenerate = false
): Promise<string | null> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, end_time, category, price, place_id, eventfinda_url, humanitix_url, ai_description"
    )
    .eq("id", eventId)
    .single();

  if (error || !event) return null;

  // Return cached if exists and not regenerating
  if (event.ai_description && !regenerate) {
    return event.ai_description;
  }

  let description = event.description as string;

  // Scrape full description if needed
  if (event.eventfinda_url && needsEventfindaScrape(description)) {
    const scraped = await scrapeEventfindaDescription(event.eventfinda_url);
    if (scraped) {
      description = scraped;
      await supabase
        .from("events")
        .update({ description })
        .eq("id", eventId);
    }
  } else if (
    event.humanitix_url &&
    needsHumanitixScrape(description, event.title)
  ) {
    const scraped = await scrapeHumanitixDescription(event.humanitix_url);
    if (scraped) {
      description = scraped;
      await supabase
        .from("events")
        .update({ description })
        .eq("id", eventId);
    }
  }

  // Get place name
  let placeName = "";
  if (event.place_id) {
    const { data: place } = await supabase
      .from("places")
      .select("name")
      .eq("id", event.place_id)
      .single();
    if (place) placeName = place.name;
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const aiDescription = await generateAIDescription(
    anthropic,
    { ...event, description, end_time: event.end_time ?? null },
    placeName
  );

  if (aiDescription) {
    await supabase
      .from("events")
      .update({ ai_description: aiDescription })
      .eq("id", eventId);
  }

  return aiDescription;
}
