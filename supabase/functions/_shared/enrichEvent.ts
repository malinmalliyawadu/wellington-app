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
    console.log(`  [scrape] Fetching Eventfinda page: ${url}`);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WellyApp/1.0; +https://wellyapp.nz)",
      },
    });
    if (!res.ok) {
      console.warn(`  [scrape] Eventfinda returned ${res.status} for ${url}`);
      return null;
    }
    const html = await res.text();
    console.log(`  [scrape] Got ${html.length} chars of HTML`);

    const descMatch = html.match(
      /<div[^>]*id="eventDescription"[^>]*>([\s\S]*?)<\/div>/
    );
    if (!descMatch) {
      console.warn(`  [scrape] No #eventDescription div found`);
      return null;
    }

    const result = stripHtmlToText(descMatch[1]) || null;
    console.log(
      `  [scrape] Extracted ${result ? result.length : 0} chars of description`
    );
    return result;
  } catch (err) {
    console.error(`  [scrape] Failed to scrape Eventfinda ${url}: ${err}`);
    return null;
  }
}

export async function scrapeHumanitixDescription(
  url: string
): Promise<string | null> {
  try {
    console.log(`  [scrape] Fetching Humanitix page: ${url}`);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WellyApp/1.0; +https://wellyapp.nz)",
      },
    });
    if (!res.ok) {
      console.warn(`  [scrape] Humanitix returned ${res.status} for ${url}`);
      return null;
    }
    const html = await res.text();
    console.log(`  [scrape] Got ${html.length} chars of HTML`);

    const ldMatch = html.match(
      /<script type="application\/ld\+json">(\{.*?\})<\/script>/s
    );
    if (!ldMatch) {
      console.warn(`  [scrape] No JSON-LD found on page`);
      return null;
    }

    const ld = JSON.parse(ldMatch[1]);
    const desc = ld.description || null;
    console.log(
      `  [scrape] Extracted ${desc ? desc.length : 0} chars from JSON-LD`
    );
    return desc;
  } catch (err) {
    console.error(`  [scrape] Failed to scrape Humanitix ${url}: ${err}`);
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

  console.log(
    `  [ai] Calling Claude Haiku (input: ${event.description.length} chars)`
  );
  const startMs = Date.now();

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

  const elapsedMs = Date.now() - startMs;
  const text =
    response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "";

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  console.log(
    `  [ai] Response: ${text.length} chars in ${elapsedMs}ms (${inputTokens} in / ${outputTokens} out tokens)`
  );

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
 * Called by the standalone enrich-events edge function.
 */
export async function enrichEvents(
  supabase: SupabaseClient,
  options?: { limit?: number }
): Promise<{ enriched: number; errors: number }> {
  const startTime = Date.now();
  console.log("=== enrichEvents START ===");

  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    console.log("Skipping AI enrichment: ANTHROPIC_API_KEY not set");
    return { enriched: 0, errors: 0 };
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Pacific/Auckland",
  });
  const limit = options?.limit ?? 50;
  console.log(`Config: limit=${limit}, today=${today}`);

  const { data: events, error: queryError } = await supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, end_time, category, price, place_id, eventfinda_url, humanitix_url, ai_score"
    )
    .is("ai_description", null)
    .is("creator_id", null)
    .gte("date", today)
    .order("ai_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (queryError) {
    console.error(`Query error: ${queryError.message}`);
    return { enriched: 0, errors: 0 };
  }

  if (!events || events.length === 0) {
    console.log("No events to enrich — all caught up!");
    console.log(`=== enrichEvents END (${Date.now() - startTime}ms) ===`);
    return { enriched: 0, errors: 0 };
  }

  // Count total remaining (beyond this batch)
  const { count: totalRemaining } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .is("ai_description", null)
    .is("creator_id", null)
    .gte("date", today);

  console.log(
    `Found ${events.length} events to enrich (${totalRemaining ?? "?"} total remaining)`
  );
  console.log(
    `Score range: ${events[0].ai_score ?? "null"} → ${events[events.length - 1].ai_score ?? "null"}`
  );

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  let enriched = 0;
  let errors = 0;
  let scraped = 0;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const eventStart = Date.now();
    const source = ev.eventfinda_url
      ? "eventfinda"
      : ev.humanitix_url
        ? "humanitix"
        : "other";

    console.log(
      `\n[${i + 1}/${events.length}] "${ev.title}" (${ev.date}, score=${ev.ai_score ?? "null"}, source=${source})`
    );

    try {
      let description = ev.description as string;
      const originalDescLen = description.length;

      // Scrape full description if truncated/placeholder
      if (ev.eventfinda_url && needsEventfindaScrape(description)) {
        console.log(
          `  [scrape] Description truncated (${originalDescLen} chars, ends with "...") — scraping full text`
        );
        const scrapeStart = Date.now();
        const scrapeResult = await scrapeEventfindaDescription(
          ev.eventfinda_url
        );
        console.log(`  [scrape] Took ${Date.now() - scrapeStart}ms`);
        if (scrapeResult) {
          description = scrapeResult;
          scraped++;
          console.log(
            `  [scrape] Updated description: ${originalDescLen} → ${description.length} chars`
          );
          const { error: updateErr } = await supabase
            .from("events")
            .update({ description })
            .eq("id", ev.id);
          if (updateErr)
            console.warn(`  [scrape] DB update failed: ${updateErr.message}`);
        } else {
          console.warn(
            `  [scrape] Scraping failed — using truncated description`
          );
        }
      } else if (
        ev.humanitix_url &&
        needsHumanitixScrape(description, ev.title as string)
      ) {
        console.log(
          `  [scrape] Placeholder description detected — scraping from Humanitix`
        );
        const scrapeStart = Date.now();
        const scrapeResult = await scrapeHumanitixDescription(
          ev.humanitix_url
        );
        console.log(`  [scrape] Took ${Date.now() - scrapeStart}ms`);
        if (scrapeResult) {
          description = scrapeResult;
          scraped++;
          console.log(
            `  [scrape] Updated description: ${originalDescLen} → ${description.length} chars`
          );
          const { error: updateErr } = await supabase
            .from("events")
            .update({ description })
            .eq("id", ev.id);
          if (updateErr)
            console.warn(`  [scrape] DB update failed: ${updateErr.message}`);
        } else {
          console.warn(
            `  [scrape] Scraping failed — using placeholder description`
          );
        }
      } else {
        console.log(
          `  [scrape] Description OK (${originalDescLen} chars) — no scraping needed`
        );
      }

      // Get place name for context
      let placeName = "";
      if (ev.place_id) {
        const { data: place } = await supabase
          .from("places")
          .select("name")
          .eq("id", ev.place_id)
          .single();
        if (place) {
          placeName = place.name;
          console.log(`  [place] Venue: ${placeName}`);
        } else {
          console.log(`  [place] No place found for id=${ev.place_id}`);
        }
      }

      // Generate AI description
      const aiDesc = await generateAIDescription(
        anthropic,
        { ...ev, description, end_time: ev.end_time ?? null },
        placeName
      );

      if (aiDesc) {
        const { error: saveErr } = await supabase
          .from("events")
          .update({ ai_description: aiDesc })
          .eq("id", ev.id);
        if (saveErr) {
          console.error(`  [save] Failed to save ai_description: ${saveErr.message}`);
          errors++;
        } else {
          enriched++;
          console.log(`  [save] Saved ai_description (${aiDesc.length} chars)`);
        }
      } else {
        console.warn(`  [ai] Empty response — skipping`);
        errors++;
      }

      const eventElapsed = Date.now() - eventStart;
      console.log(`  [done] ${eventElapsed}ms total for this event`);

      // Brief pause between API calls
      await sleep(300);
    } catch (err) {
      console.error(`  [error] Failed to enrich: ${err}`);
      errors++;
    }
  }

  const totalElapsed = Date.now() - startTime;
  console.log(`\n=== enrichEvents END ===`);
  console.log(
    `Results: ${enriched} enriched, ${scraped} scraped, ${errors} errors`
  );
  console.log(`Total time: ${totalElapsed}ms (${(totalElapsed / 1000).toFixed(1)}s)`);
  if (enriched > 0) {
    console.log(
      `Avg per event: ${Math.round(totalElapsed / events.length)}ms`
    );
  }
  console.log(
    `Remaining after this batch: ${(totalRemaining ?? events.length) - enriched}`
  );

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
  console.log(
    `enrichSingleEvent: eventId=${eventId}, regenerate=${regenerate}`
  );

  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, end_time, category, price, place_id, eventfinda_url, humanitix_url, ai_description"
    )
    .eq("id", eventId)
    .single();

  if (error || !event) {
    console.error(`Event not found: ${error?.message ?? "null"}`);
    return null;
  }

  console.log(`Event: "${event.title}" (${event.date})`);

  // Return cached if exists and not regenerating
  if (event.ai_description && !regenerate) {
    console.log(
      `Returning cached ai_description (${event.ai_description.length} chars)`
    );
    return event.ai_description;
  }

  let description = event.description as string;

  // Scrape full description if needed
  if (event.eventfinda_url && needsEventfindaScrape(description)) {
    console.log(`Scraping full description from Eventfinda`);
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
    console.log(`Scraping full description from Humanitix`);
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

  console.log(`Generating AI description (venue: ${placeName || "unknown"})`);
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
    console.log(`Saved ai_description (${aiDescription.length} chars)`);
  } else {
    console.warn(`AI returned empty response`);
  }

  return aiDescription;
}
