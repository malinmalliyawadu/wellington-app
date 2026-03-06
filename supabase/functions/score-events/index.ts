import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  category: string;
  price: number | null;
  place_id: string;
  attendee_count?: number;
  venue_name?: string;
}

interface ScoreEntry {
  score: number;
  reason: string;
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
        JSON.stringify({ error: "Unauthorized: missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    let rescore = false;
    let dryRun = false;
    try {
      const body = await req.json();
      rescore = body.rescore === true;
      dryRun = body.dryRun === true;
    } catch {
      // No body or invalid JSON — use defaults
    }

    // Fetch upcoming events to score
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Pacific/Auckland",
    });

    let query = supabase
      .from("events")
      .select("id, title, description, date, start_time, end_time, image_url, category, price, place_id")
      .gte("date", today)
      .order("date", { ascending: true });

    if (!rescore) {
      query = query.is("ai_score", null);
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ scored: 0, message: "No events to score" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${events.length} events to score`);

    // Fetch attendee counts for all events
    const eventIds = events.map((e) => e.id);
    const { data: attendeeCounts } = await supabase
      .from("event_attendees")
      .select("event_id")
      .in("event_id", eventIds);

    const attendeeMap = new Map<string, number>();
    if (attendeeCounts) {
      for (const row of attendeeCounts) {
        attendeeMap.set(row.event_id, (attendeeMap.get(row.event_id) || 0) + 1);
      }
    }

    // Fetch venue names for all events
    const placeIds = [...new Set(events.map((e) => e.place_id).filter(Boolean))];
    const { data: places } = await supabase
      .from("places")
      .select("id, name")
      .in("id", placeIds);

    const placeMap = new Map<string, string>();
    if (places) {
      for (const p of places) {
        placeMap.set(p.id, p.name);
      }
    }

    // Enrich events with attendee counts and venue names
    for (const event of events as EventRow[]) {
      event.attendee_count = attendeeMap.get(event.id) || 0;
      event.venue_name = placeMap.get(event.place_id) || undefined;
    }

    // Batch events into groups of 50
    const BATCH_SIZE = 50;
    const batches: EventRow[][] = [];
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      batches.push(events.slice(i, i + BATCH_SIZE) as EventRow[]);
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Score a single batch — returns scores in same order as input batch.
    // We use a positional array (no IDs) so Claude can't mangle UUIDs.
    const scoreBatch = async (
      batch: EventRow[],
      batchIndex: number
    ): Promise<{ eventId: string; score: number; reason: string }[]> => {
      console.log(
        `Scoring batch ${batchIndex + 1}/${batches.length} (${batch.length} events)`
      );

      // Send events as a numbered list — Claude returns scores in same order
      const eventsForPrompt = batch.map((e, idx) => ({
        index: idx,
        title: e.title,
        description: e.description?.substring(0, 200) || "",
        date: e.date,
        startTime: e.start_time,
        endTime: e.end_time,
        hasImage: !!e.image_url,
        category: e.category,
        price: e.price,
        attendees: e.attendee_count || 0,
        venue: e.venue_name || null,
      }));

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are scoring Wellington, New Zealand events for a local discovery app. Score each event from 0-100 based on how popular and broadly appealing it would be. Focus on predicting which events will draw the most people.

USE THE FULL 0-100 RANGE. Most events should score between 20-60. Only truly exceptional events should score 80+. Boring or niche events should score below 30.

Score calibration examples (do not output these, just use as reference):
- 95-100: Major city-wide events (e.g. Wellington sevens, Matariki festival, major civic openings/reopenings, NZ International Arts Festival)
- 80-94: Popular headline acts, big food/music festivals, major comedy shows, significant cultural events
- 60-79: Good local gigs, popular markets, well-known venue events, interesting community events
- 40-59: Average events — regular pub gigs, standard workshops, recurring meetups
- 20-39: Niche interest — small group meetings, internal org events, specialized classes
- 0-19: Very low appeal — admin meetings, private functions listed publicly

Scoring factors (by importance):
1. Event type & broad appeal (most important): City-wide events, major openings/launches, festivals, headline concerts, and large-scale community events score highest. Regular weekly events, niche workshops, or small org meetings score low.
2. Attendee count: Real popularity signal. 10+ is good, 50+ is very popular, 100+ is a major event.
3. Venue & scale: Well-known Wellington venues (San Fran, Meow, Te Papa, TSB Arena, Michael Fowler Centre, Valhalla, BATS) suggest bigger events.
4. Uniqueness: One-off special events (festivals, launches, headline acts, openings) score much higher than routine recurring ones (weekly trivia, regular classes).
5. Price: Free or low-cost events appeal to more people.
6. Has image: +5 if true.
7. Timing: Evening/weekend events slightly preferred.

DO NOT score based on description quality or writing style.

Events to score:

${JSON.stringify(eventsForPrompt, null, 2)}

Respond with ONLY a JSON array with exactly ${batch.length} objects in the SAME ORDER as the input. Each object has "index" (the event index from input), "score" (integer 0-100), and "reason" (1 short sentence). No other text.`,
          },
        ],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "";

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error(
            `Batch ${batchIndex + 1}: no JSON array found in response`
          );
          return [];
        }
        const parsed: ScoreEntry[] = JSON.parse(jsonMatch[0]);

        // Map scores back to event IDs using position
        const results: { eventId: string; score: number; reason: string }[] = [];
        for (let i = 0; i < parsed.length && i < batch.length; i++) {
          results.push({
            eventId: batch[i].id,
            score: parsed[i].score,
            reason: parsed[i].reason,
          });
        }

        console.log(`Batch ${batchIndex + 1} done: ${results.length} scores`);
        return results;
      } catch (parseErr) {
        console.error(`Batch ${batchIndex + 1} parse error:`, parseErr);
        return [];
      }
    }

    // Run batches with limited concurrency (3 at a time)
    const CONCURRENCY = 3;
    const allScores: { eventId: string; score: number; reason: string }[] = [];

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const chunk = batches.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map((batch, j) => scoreBatch(batch, i + j))
      );
      for (const scores of results) {
        allScores.push(...scores);
      }
    }

    console.log(`Scored ${allScores.length}/${events.length} events`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalEvents: events.length,
          scored: allScores.length,
          scores: allScores,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Batch-update events with scores using upsert-style updates
    let updated = 0;
    let updateErrors = 0;

    // Update in small DB batches to avoid too many sequential calls
    const DB_BATCH = 20;
    for (let i = 0; i < allScores.length; i += DB_BATCH) {
      const batch = allScores.slice(i, i + DB_BATCH);
      const promises = batch.map((s) => {
        const clampedScore = Math.max(0, Math.min(100, Math.round(s.score)));
        return supabase
          .from("events")
          .update({
            ai_score: clampedScore,
            ai_score_reason: s.reason?.substring(0, 500) || null,
          })
          .eq("id", s.eventId)
          .select("id");
      });

      const results = await Promise.all(promises);
      for (const { data, error } of results) {
        if (error) {
          updateErrors++;
        } else if (!data || data.length === 0) {
          updateErrors++; // no row matched — should not happen
        } else {
          updated++;
        }
      }
    }

    console.log(
      `Done: ${updated} updated, ${updateErrors} errors out of ${allScores.length} scored`
    );

    return new Response(
      JSON.stringify({
        totalEvents: events.length,
        scored: allScores.length,
        updated,
        updateErrors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("score-events error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
