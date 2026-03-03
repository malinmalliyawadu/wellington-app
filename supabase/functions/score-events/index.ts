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
      .select("id, title, description, date, start_time, end_time, image_url, category, price")
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

    // Batch events into groups of 50
    const BATCH_SIZE = 50;
    const batches: EventRow[][] = [];
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      batches.push(events.slice(i, i + BATCH_SIZE) as EventRow[]);
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Score a single batch — returns scores in same order as input batch.
    // We use a positional array (no IDs) so Claude can't mangle UUIDs.
    async function scoreBatch(
      batch: EventRow[],
      batchIndex: number
    ): Promise<{ eventId: string; score: number; reason: string }[]> {
      console.log(
        `Scoring batch ${batchIndex + 1}/${batches.length} (${batch.length} events)`
      );

      // Send events as a numbered list — Claude returns scores in same order
      const eventsForPrompt = batch.map((e, idx) => ({
        index: idx,
        title: e.title,
        description: e.description?.substring(0, 300) || "",
        date: e.date,
        startTime: e.start_time,
        endTime: e.end_time,
        hasImage: !!e.image_url,
        category: e.category,
        price: e.price,
      }));

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are scoring Wellington, New Zealand events for a local discovery app. Score each event from 0-100 based on how appealing and worth attending it would be for a typical Wellington resident.

Scoring criteria:
- Title clarity and appeal: Is it descriptive? Intriguing? (0-15 points)
- Description quality: Is it well-written and informative? (0-15 points)
- Has image: Events with images are more engaging (+10 points if true)
- Category appeal: Some categories (music, food, cultural) tend to draw more interest (0-10 points)
- Price value: Free events or reasonably priced events score higher (0-10 points)
- Time appeal: Evening and weekend events tend to be more popular (0-10 points)
- Uniqueness: One-off special events score higher than routine/recurring ones (0-15 points)
- Overall "would someone want to attend this?": General gut feeling (0-15 points)

Here are the events to score:

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
