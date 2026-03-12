import { SupabaseClient } from "npm:@supabase/supabase-js@2";

// All external source ID fields on the events table
type SourceName =
  | "eventfinda"
  | "ticketmaster"
  | "humanitix"
  | "eventbrite"
  | "undertheradar"
  | "everybody_eats";

const ALL_SOURCES: SourceName[] = [
  "eventfinda",
  "ticketmaster",
  "humanitix",
  "eventbrite",
  "undertheradar",
  "everybody_eats",
];

/**
 * Normalize a title for fuzzy matching: collapse separators (~ – — −) to -,
 * strip extra whitespace, and lowercase.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u2013\u2014\u2015\u2212~]/g, "-") // en-dash, em-dash, horizontal bar, minus sign, tilde → hyphen
    .replace(/\s*-\s*/g, " - ") // normalize whitespace around hyphens
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Cross-source event deduplication.
 *
 * For each row, checks whether an event with the same title + date already
 * exists from a *different* source. If so, links the current source's ID/URL
 * to the existing row instead of creating a duplicate.
 *
 * Returns the filtered rows (non-duplicates) that should still be upserted,
 * plus a count of how many were linked to existing events.
 */
export async function deduplicateEvents(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
  source: SourceName,
): Promise<{ rows: Record<string, unknown>[]; linked: number }> {
  if (rows.length === 0) return { rows: [], linked: 0 };

  const sourceIdField = `${source}_id`;
  const sourceUrlField = `${source}_url`;
  const otherSources = ALL_SOURCES.filter((s) => s !== source);

  // Collect all unique dates in this batch
  const dates = [
    ...new Set(rows.map((r) => r.date as string).filter(Boolean)),
  ];

  if (dates.length === 0) return { rows, linked: 0 };

  // Bulk query: find all events from OTHER sources on these dates
  const orFilter = otherSources.map((s) => `${s}_id.not.is.null`).join(",");

  const { data: existingEvents, error } = await supabase
    .from("events")
    .select("id, title, date")
    .in("date", dates)
    .or(orFilter);

  if (error) {
    console.error(`[dedup] Query error: ${error.message}`);
    // On error, return all rows — better to risk a duplicate than lose events
    return { rows, linked: 0 };
  }

  // Build lookup map: lowercase title + date → event id
  const existingMap = new Map<string, string>();
  if (existingEvents) {
    for (const e of existingEvents) {
      const key = `${normalizeTitle(e.title as string)}|${e.date}`;
      existingMap.set(key, e.id);
    }
  }

  const toUpsert: Record<string, unknown>[] = [];
  const toLink: {
    eventId: string;
    sourceId: unknown;
    sourceUrl: unknown;
    title: string;
  }[] = [];

  for (const row of rows) {
    const title = row.title as string;
    const date = row.date as string;

    if (!title || !date) {
      toUpsert.push(row);
      continue;
    }

    const key = `${normalizeTitle(title)}|${date}`;
    const existingId = existingMap.get(key);

    if (existingId) {
      toLink.push({
        eventId: existingId,
        sourceId: row[sourceIdField],
        sourceUrl: row[sourceUrlField],
        title,
      });
    } else {
      toUpsert.push(row);
    }
  }

  // Link duplicates
  for (const link of toLink) {
    const { error: updateErr } = await supabase
      .from("events")
      .update({
        [sourceIdField]: link.sourceId,
        [sourceUrlField]: link.sourceUrl,
      })
      .eq("id", link.eventId);

    if (updateErr) {
      console.error(
        `[dedup] Failed to link ${source} event "${link.title}": ${updateErr.message}`,
      );
    }
  }

  if (toLink.length > 0) {
    console.log(
      `[dedup] Linked ${toLink.length} ${source} events to existing events from other sources`,
    );
  }

  return { rows: toUpsert, linked: toLink.length };
}
