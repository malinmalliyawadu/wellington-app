import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EVERYBODY_EATS_API =
  "https://volunteers.everybodyeats.nz/api/shifts";
const EVERYBODY_EATS_PORTAL =
  "https://volunteers.everybodyeats.nz";

// Wellington venue — hardcoded since the API only returns "Wellington" as location
const WELLINGTON_VENUE = {
  name: "Everybody Eats",
  address: "60 Dixon Street, Te Aro, Wellington, New Zealand",
  latitude: -41.2920,
  longitude: 174.7740,
};

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

interface EEShift {
  id: string;
  start: string; // UTC ISO 8601
  end: string; // UTC ISO 8601
  location: string | null;
  notes: string | null;
  capacity: number;
  remaining: number;
  shiftType: {
    id: string;
    name: string;
  };
  url?: string | null;
  image?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a UTC ISO string to { date, time, hour } in NZ timezone */
function toNZDateTime(iso: string): { date: string; time: string; hour: number } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Pacific/Auckland",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hour = parseInt(
    d.toLocaleTimeString("en-GB", {
      timeZone: "Pacific/Auckland",
      hour: "2-digit",
      hour12: false,
    }),
    10,
  );
  return { date, time, hour };
}

interface GroupedShift {
  date: string;
  period: "am" | "pm";
  startTime: string; // earliest start
  endTime: string; // latest end
  location: string | null;
  roles: { name: string; remaining: number; capacity: number; url?: string | null }[];
  notes: string[];
  imageUrl: string | null;
}

/** Group shifts by date + AM/PM into consolidated events */
function groupShifts(shifts: EEShift[]): GroupedShift[] {
  const groups = new Map<string, GroupedShift>();

  for (const shift of shifts) {
    const start = toNZDateTime(shift.start);
    const end = toNZDateTime(shift.end);
    const period = start.hour < 16 ? "am" : "pm";
    const key = `${start.date}-${period}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        date: start.date,
        period,
        startTime: start.time,
        endTime: end.time,
        location: shift.location,
        roles: [],
        notes: [],
        imageUrl: shift.image ?? null,
      };
      groups.set(key, group);
    }

    // Expand time window to cover all shifts in the group
    if (start.time < group.startTime) group.startTime = start.time;
    if (end.time > group.endTime) group.endTime = end.time;

    // Use first non-null location
    if (!group.location && shift.location) {
      group.location = shift.location;
    }

    // Use first non-null image
    if (!group.imageUrl && shift.image) {
      group.imageUrl = shift.image;
    }

    group.roles.push({
      name: shift.shiftType.name,
      remaining: shift.remaining,
      capacity: shift.capacity,
      url: shift.url,
    });

    if (shift.notes && !group.notes.includes(shift.notes)) {
      group.notes.push(shift.notes);
    }
  }

  return Array.from(groups.values());
}

function buildDescription(group: GroupedShift): string {
  const parts: string[] = [];

  parts.push("Volunteer with Everybody Eats!");

  const totalRemaining = group.roles.reduce((sum, r) => sum + r.remaining, 0);
  const totalCapacity = group.roles.reduce((sum, r) => sum + r.capacity, 0);

  // List roles with availability
  const roleLines = group.roles.map((r) =>
    r.remaining > 0
      ? `• ${r.name} — ${r.remaining} of ${r.capacity} spots available`
      : `• ${r.name} — full`
  );
  parts.push(roleLines.join("\n"));

  if (totalRemaining > 0) {
    parts.push(`${totalRemaining} of ${totalCapacity} total spots available.`);
  } else {
    parts.push("All roles are currently full.");
  }

  if (group.notes.length > 0) {
    parts.push(group.notes.join("\n"));
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify service_role JWT
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
            },
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Unauthorized: invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized: missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    // Fetch shifts from Everybody Eats API
    const today = new Date().toISOString().split("T")[0];
    const apiUrl = `${EVERYBODY_EATS_API}?from=${today}`;
    console.log(`[sync-everybody-eats] Fetching shifts from ${apiUrl}`);

    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[sync-everybody-eats] API error ${res.status}: ${errText}`,
      );
      return new Response(
        JSON.stringify({ error: `API returned ${res.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const allShifts: EEShift[] = await res.json();
    // Only sync Wellington shifts
    const shifts = allShifts.filter(
      (s) => s.location?.toLowerCase() === "wellington",
    );
    const groups = groupShifts(shifts);
    console.log(
      `[sync-everybody-eats] Fetched ${allShifts.length} shifts, ${shifts.length} Wellington → ${groups.length} events (AM/PM grouped)${dryRun ? " (dry run)" : ""}`,
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          shiftCount: shifts.length,
          eventCount: groups.length,
          events: groups.map((g) => ({
            key: `${g.date}-${g.period}`,
            date: g.date,
            period: g.period,
            startTime: g.startTime,
            endTime: g.endTime,
            location: g.location,
            roles: g.roles,
          })),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Process grouped shifts into event rows
    const upsertRows: Record<string, unknown>[] = [];
    let placesCreated = 0;

    // Resolve the Wellington venue once (find or create)
    let wellingtonPlaceId: string | null = null;
    {
      const { data: existingPlace } = await supabase
        .from("places")
        .select("id")
        .ilike("name", WELLINGTON_VENUE.name)
        .limit(1)
        .maybeSingle();

      if (existingPlace) {
        wellingtonPlaceId = existingPlace.id;
      } else {
        const { data: newPlace, error: placeError } = await supabase
          .from("places")
          .insert({
            name: WELLINGTON_VENUE.name,
            category: "restaurant",
            address: WELLINGTON_VENUE.address,
            latitude: WELLINGTON_VENUE.latitude,
            longitude: WELLINGTON_VENUE.longitude,
          })
          .select("id")
          .single();

        if (placeError) {
          console.error(
            `[sync-everybody-eats] Failed to create place:`,
            placeError.message,
          );
          return new Response(
            JSON.stringify({ error: "Failed to create venue" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        wellingtonPlaceId = newPlace.id;
        placesCreated++;
        console.log(`[sync-everybody-eats] Created place: ${WELLINGTON_VENUE.name}`);
      }
    }

    for (const group of groups) {

      const periodLabel = group.period === "am" ? "Morning" : "Afternoon";
      upsertRows.push({
        title: `Everybody Eats – ${periodLabel} Shift`,
        description: buildDescription(group),
        place_id: wellingtonPlaceId,
        date: group.date,
        start_time: group.startTime,
        end_time: group.endTime,
        image_url: group.imageUrl,
        category: "volunteering",
        ticket_url: null,
        price: 0,
        // Stable composite key: one event per date + AM/PM
        everybody_eats_id: `${group.date}-${group.period}`,
        everybody_eats_url: `${EVERYBODY_EATS_PORTAL}/shifts/details?date=${group.date}&location=Wellington`,
      });
    }

    // Upsert in batches of 50
    let upserted = 0;
    let upsertErrors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
      const batch = upsertRows.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await supabase
        .from("events")
        .upsert(batch, { onConflict: "everybody_eats_id" });

      if (upsertError) {
        console.error(
          `[sync-everybody-eats] Upsert error:`,
          upsertError.message,
        );
        upsertErrors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    // Cleanup: delete old Everybody Eats events past by N days
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    const cutoffStr = cutoffDate.toLocaleDateString("en-CA", {
      timeZone: "Pacific/Auckland",
    });

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("events")
      .delete()
      .not("everybody_eats_id", "is", null)
      .lt("date", cutoffStr)
      .select("id");

    if (deleteErr) {
      console.error(`[sync-everybody-eats] Cleanup error:`, deleteErr.message);
    } else {
      deletedCount = deletedRows?.length ?? 0;
    }

    console.log(
      `[sync-everybody-eats] Done: ${upserted} upserted, ${upsertErrors} errors, ${deletedCount} cleaned up, ${placesCreated} places created`,
    );

    return new Response(
      JSON.stringify({
        totalShifts: allShifts.length,
        wellingtonShifts: shifts.length,
        totalEvents: groups.length,
        upserted,
        upsertErrors,
        placesCreated,
        deletedOld: deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[sync-everybody-eats] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
