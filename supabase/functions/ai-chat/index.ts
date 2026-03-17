import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  message: string;
  places: {
    placeId: string;
    placeName: string;
    category: string;
    reason: string;
  }[];
  events: {
    eventId: string;
    eventTitle: string;
    date: string;
    startTime?: string;
    reason: string;
  }[];
  guides: {
    guideId: string;
    guideTitle: string;
    creatorName: string;
    placeCount: number;
    reason: string;
  }[];
  followUp?: string;
  followUpPrompts?: { label: string; prompt: string }[];
}

// New minimal context from client
interface AIContextNew {
  userName?: string;
  userId?: string;
  userLocation: { latitude: number; longitude: number } | null;
  eventContext?: { id?: string; title: string };
}

// Pre-fetched social context (loaded server-side to avoid a tool round-trip)
interface PrefetchedSocialContext {
  followingUsers: { id: string; name: string }[];
  feedPosts: { userName: string; placeName: string | null; content: string }[];
  userPosts: {
    placeName: string | null;
    placeCategory: string | null;
    content: string;
  }[];
  visitedPlaces: {
    placeName: string;
    placeCategory: string | null;
  }[];
  notInterestedEventIds: string[];
  notInterestedPlaceIds: string[];
}


// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

async function fetchWeather(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-41.2924&longitude=174.7787&current=temperature_2m,weather_code,wind_speed_10m,precipitation&timezone=Pacific%2FAuckland"
    );
    const data = await res.json();
    const current = data.current;
    const condition = WEATHER_CODES[current.weather_code] ?? "Unknown";
    return `Current weather in Wellington: ${condition}, ${
      current.temperature_2m
    }°C, wind ${current.wind_speed_10m} km/h${
      current.precipitation > 0
        ? `, ${current.precipitation}mm precipitation`
        : ""
    }.`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Eager social context prefetch (runs in parallel with auth)
// ---------------------------------------------------------------------------

async function prefetchSocialContext(
  supabase: SupabaseClient,
  userId: string
): Promise<PrefetchedSocialContext> {
  // Get who the user follows
  const { data: followRows } = await supabase
    .from("follows")
    .select(
      "following_id, profiles!follows_following_id_fkey(display_name, username)"
    )
    .eq("follower_id", userId);

  const followingUsers = (followRows ?? []).map(
    (r: Record<string, unknown>) => {
      const profile = r.profiles as Record<string, unknown> | null;
      return {
        id: r.following_id as string,
        name:
          (profile?.display_name as string) ??
          (profile?.username as string) ??
          "Unknown",
      };
    }
  );

  const followingIds = followingUsers.map((u) => u.id);

  // Fetch feed posts, user posts, and not-interested items in parallel
  const [feedResult, userPostsResult, notInterestedResult, visitedResult] = await Promise.all([
    followingIds.length > 0
      ? supabase
          .from("posts")
          .select("content, user_id, place_id, places(name)")
          .in("user_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
    supabase
      .from("posts")
      .select("content, place_id, places(name, category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("not_interested")
      .select("item_type, item_id")
      .eq("user_id", userId),
    supabase
      .from("user_explorations")
      .select("place_id, places(name, category)")
      .eq("user_id", userId)
      .order("explored_at", { ascending: false })
      .limit(100),
  ]);

  const followMap = new Map(followingUsers.map((u) => [u.id, u.name]));

  const feedPosts = (feedResult.data ?? []).map(
    (p: Record<string, unknown>) => {
      const place = p.places as Record<string, unknown> | null;
      return {
        userName: followMap.get(p.user_id as string) ?? "Someone",
        placeName: (place?.name as string) ?? null,
        content: (p.content as string)?.slice(0, 100) ?? "",
      };
    }
  );

  const userPosts = (userPostsResult.data ?? []).map(
    (p: Record<string, unknown>) => {
      const place = p.places as Record<string, unknown> | null;
      return {
        placeName: (place?.name as string) ?? null,
        placeCategory: (place?.category as string) ?? null,
        content: (p.content as string)?.slice(0, 100) ?? "",
      };
    }
  );

  const visitedPlaces = (visitedResult.data ?? []).map(
    (r: Record<string, unknown>) => {
      const place = r.places as Record<string, unknown> | null;
      return {
        placeName: (place?.name as string) ?? "Unknown",
        placeCategory: (place?.category as string) ?? null,
      };
    }
  );

  const notInterestedEventIds: string[] = [];
  const notInterestedPlaceIds: string[] = [];
  for (const row of (notInterestedResult.data ?? []) as Record<string, unknown>[]) {
    if (row.item_type === "event") notInterestedEventIds.push(row.item_id as string);
    else if (row.item_type === "place") notInterestedPlaceIds.push(row.item_id as string);
  }

  return { followingUsers, feedPosts, userPosts, visitedPlaces, notInterestedEventIds, notInterestedPlaceIds };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "search_events",
    description:
      "Search for upcoming events in Wellington. Use this when the user asks about events, things to do, what's happening, weekend plans, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        date_from: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD). Defaults to today.",
        },
        date_to: {
          type: "string",
          description:
            "End date filter (YYYY-MM-DD). Defaults to 2 weeks from today.",
        },
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "music",
              "comedy",
              "art",
              "food",
              "market",
              "community",
              "quiz",
              "craft",
              "kids",
              "cultural",
            ],
          },
          description: "Filter by event categories.",
        },
        free_only: {
          type: "boolean",
          description: "If true, only return free events (price is null or 0).",
        },
        keyword: {
          type: "string",
          description:
            "Search keyword to match against event title or description.",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 20, max 50).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_event_details",
    description:
      "Get full details for a specific event by ID. Use this when the user asks about a specific music event and you want to provide artist info, genre, top songs, etc. The full description often contains performer/artist details.",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "string",
          description: "The event ID to look up.",
        },
      },
      required: ["event_id"],
    },
  },
  {
    name: "search_places",
    description:
      "Search for places (cafes, restaurants, bars, parks, attractions, venues, trails) in Wellington. Use this when the user asks about food, drinks, activities, or specific types of places.",
    input_schema: {
      type: "object" as const,
      properties: {
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "cafe",
              "restaurant",
              "bar",
              "attraction",
              "park",
              "venue",
              "trail",
            ],
          },
          description: "Filter by place categories.",
        },
        keyword: {
          type: "string",
          description: "Search keyword to match against place name.",
        },
        neighborhood: {
          type: "string",
          description:
            "Filter by neighborhood/suburb name (e.g. 'Newtown', 'Te Aro', 'Cuba Street', 'Thorndon', 'Kelburn', 'Mt Victoria', 'Courtenay Place', 'Lambton Quay'). Matches against the place address.",
        },
        near_latitude: {
          type: "number",
          description: "Latitude for proximity sorting.",
        },
        near_longitude: {
          type: "number",
          description: "Longitude for proximity sorting.",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 15, max 30).",
        },
      },
      required: [],
    },
  },
  {
    name: "search_guides",
    description:
      "Search for curated place guides created by users. Use this when the user asks for recommendations lists, curated collections, or guides.",
    input_schema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description:
            "Search keyword to match against guide title or description.",
        },
        place_category: {
          type: "string",
          description: "Filter guides that contain places of this category.",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10, max 20).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_user_social_context",
    description:
      "Refresh the user's social context with more posts than the summary already in the system prompt. Only use this if you need MORE data than what's already provided (e.g. the user asks a very specific question about what their friends have been up to).",
    input_schema: {
      type: "object" as const,
      properties: {
        include_feed_posts: {
          type: "boolean",
          description:
            "Include recent posts from followed users (default true).",
        },
        include_user_posts: {
          type: "boolean",
          description: "Include the user's own posts (default true).",
        },
        feed_post_limit: {
          type: "number",
          description: "Max feed posts to return (default 30, max 50).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_weather",
    description:
      "Get the current weather in Wellington. Use this when the user asks about weather, or when weather is relevant to your recommendation (e.g. outdoor activities, what to wear).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_place_details",
    description:
      "Get detailed info about a place from Google Places: opening hours, phone number, website, price level, and rating. Use this when the user asks about opening hours, whether a place is open, contact info, or practical visit details.",
    input_schema: {
      type: "object" as const,
      properties: {
        place_id: {
          type: "string",
          description: "The Welly app place ID (UUID). The tool will look up the Google Place ID from the database.",
        },
      },
      required: ["place_id"],
    },
  },
  {
    name: "get_trending_content",
    description:
      "Get trending hashtags and popular recent posts. Use this when the user asks what's trending or popular.",
    input_schema: {
      type: "object" as const,
      properties: {
        hashtag_limit: {
          type: "number",
          description: "Max trending hashtags to return (default 15).",
        },
        popular_posts_limit: {
          type: "number",
          description: "Max popular posts to return (default 10).",
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution functions
// ---------------------------------------------------------------------------

async function executeSearchEvents(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
  userId: string,
  notInterestedEventIds: string[] = []
): Promise<unknown> {
  const now = new Date();
  const dateFrom =
    (input.date_from as string) || now.toISOString().slice(0, 10);
  const dateTo =
    (input.date_to as string) ||
    new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  const categories = input.categories as string[] | undefined;
  const freeOnly = input.free_only as boolean | undefined;
  const keyword = input.keyword as string | undefined;
  const limit = Math.min((input.limit as number) || 20, 50);

  let query = supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, category, price, ai_score, place_id, places(name)"
    )
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("ai_score", { ascending: false, nullsFirst: false })
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (notInterestedEventIds.length > 0) {
    query = query.not("id", "in", `(${notInterestedEventIds.join(",")})`);
  }
  if (categories && categories.length > 0) {
    query = query.in("category", categories);
  }
  if (freeOnly) {
    query = query.or("price.is.null,price.eq.0");
  }
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }

  const { data: events, error } = await query;
  if (error) {
    console.error("[ai-chat] search_events error:", error.message);
    return { error: error.message };
  }

  // Get attendees for these events who the user follows
  const eventIds = (events ?? []).map(
    (e: Record<string, unknown>) => e.id as string
  );
  const attendeeMap = new Map<string, string[]>();

  if (eventIds.length > 0) {
    // Get who the user follows
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = new Set(
      (followRows ?? []).map(
        (r: Record<string, unknown>) => r.following_id as string
      )
    );

    if (followingIds.size > 0) {
      const { data: attendeeRows } = await supabase
        .from("event_attendees")
        .select("event_id, user_id, profiles(display_name)")
        .in("event_id", eventIds)
        .in("user_id", [...followingIds]);

      for (const row of attendeeRows ?? []) {
        const r = row as Record<string, unknown>;
        const eid = r.event_id as string;
        const profile = r.profiles as Record<string, unknown> | null;
        const name = (profile?.display_name as string) ?? "Someone you follow";
        const existing = attendeeMap.get(eid) ?? [];
        existing.push(name);
        attendeeMap.set(eid, existing);
      }
    }
  }

  return (events ?? []).map((e: Record<string, unknown>) => {
    const place = e.places as Record<string, unknown> | null;
    const eid = e.id as string;
    const dayOfWeek = new Date(e.date as string).toLocaleDateString("en-NZ", {
      weekday: "short",
      timeZone: "Pacific/Auckland",
    });
    const attended = attendeeMap.get(eid);
    const desc = (e.description as string) ?? "";
    return {
      id: eid,
      title: e.title,
      description: desc.length > 200 ? desc.slice(0, 200) + "…" : desc,
      date: `${e.date} (${dayOfWeek})`,
      startTime: e.start_time,
      category: e.category,
      price: e.price ?? null,
      aiScore: e.ai_score ?? null,
      venue: place?.name ?? null,
      ...(attended?.length ? { followedAttendees: attended } : {}),
    };
  });
}

async function executeGetEventDetails(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<unknown> {
  const eventId = input.event_id as string;
  if (!eventId) return { error: "event_id is required" };

  console.log("[ai-chat] get_event_details for:", eventId);

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, description, date, start_time, end_time, category, price, image_url, ticket_url, eventfinda_url, ticketmaster_url, humanitix_url, eventbrite_url, ai_description, place_id, places(name, address)"
    )
    .eq("id", eventId)
    .single();

  if (error || !event) {
    console.error("[ai-chat] get_event_details error:", error?.message);
    return { error: error?.message ?? "Event not found" };
  }

  const e = event as Record<string, unknown>;
  const place = e.places as Record<string, unknown> | null;
  const desc = (e.description as string) ?? "";
  const aiDesc = (e.ai_description as string) ?? "";
  console.log(`[ai-chat] get_event_details found: "${e.title}" (${e.category}) at ${place?.name ?? "unknown venue"}`);
  console.log(`[ai-chat] get_event_details description (${desc.length} chars): ${desc.slice(0, 500)}`);
  if (aiDesc) console.log(`[ai-chat] get_event_details ai_description: ${aiDesc.slice(0, 300)}`);

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    aiDescription: e.ai_description ?? null,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time ?? null,
    category: e.category,
    price: e.price ?? null,
    venue: place?.name ?? null,
    venueAddress: place?.address ?? null,
    ticketUrl: e.ticket_url ?? e.eventfinda_url ?? e.ticketmaster_url ?? e.humanitix_url ?? e.eventbrite_url ?? null,
  };
}

async function executeSearchPlaces(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
  userId: string,
  notInterestedPlaceIds: string[] = []
): Promise<unknown> {
  const categories = input.categories as string[] | undefined;
  const keyword = input.keyword as string | undefined;
  const neighborhood = input.neighborhood as string | undefined;
  const nearLat = input.near_latitude as number | undefined;
  const nearLng = input.near_longitude as number | undefined;
  const limit = Math.min((input.limit as number) || 15, 30);

  let query = supabase
    .from("places")
    .select("id, name, category, address, latitude, longitude")
    .limit(limit);

  if (notInterestedPlaceIds.length > 0) {
    query = query.not("id", "in", `(${notInterestedPlaceIds.join(",")})`);
  }
  if (categories && categories.length > 0) {
    query = query.in("category", categories);
  }
  if (keyword) {
    query = query.ilike("name", `%${keyword}%`);
  }
  if (neighborhood) {
    query = query.ilike("address", `%${neighborhood}%`);
  }

  const { data: places, error } = await query;
  if (error) {
    console.error("[ai-chat] search_places error:", error.message);
    return { error: error.message };
  }

  const placeIds = (places ?? []).map(
    (p: Record<string, unknown>) => p.id as string
  );
  if (placeIds.length === 0) return [];

  // Get post counts per place + whether user has visited
  const { data: postRows } = await supabase
    .from("posts")
    .select("place_id, user_id")
    .in("place_id", placeIds)
    .limit(200);

  const placePostCounts = new Map<string, number>();
  const userVisited = new Set<string>();

  for (const row of postRows ?? []) {
    const r = row as Record<string, unknown>;
    const pid = r.place_id as string;
    placePostCounts.set(pid, (placePostCounts.get(pid) ?? 0) + 1);
    if ((r.user_id as string) === userId) {
      userVisited.add(pid);
    }
  }

  const results = (places ?? []).map((p: Record<string, unknown>) => {
    const pid = p.id as string;
    let distance: number | null = null;
    if (nearLat != null && nearLng != null) {
      const dlat = (p.latitude as number) - nearLat;
      const dlng = (p.longitude as number) - nearLng;
      distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111000; // rough meters
    }
    return {
      id: pid,
      name: p.name,
      category: p.category,
      posts: placePostCounts.get(pid) ?? 0,
      visited: userVisited.has(pid) || undefined,
      dist: distance != null ? Math.round(distance) : undefined,
    };
  });

  // Sort by proximity if coordinates provided, else by post count
  if (nearLat != null && nearLng != null) {
    results.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  } else {
    results.sort((a, b) => b.posts - a.posts);
  }

  return results;
}

async function executeSearchGuides(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<unknown> {
  const keyword = input.keyword as string | undefined;
  const placeCategory = input.place_category as string | undefined;
  const limit = Math.min((input.limit as number) || 10, 20);

  let query = supabase
    .from("guides")
    .select("id, title, description, user_id, likes")
    .order("likes", { ascending: false })
    .limit(limit);

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  }

  const { data: guides, error } = await query;
  if (error) {
    console.error("[ai-chat] search_guides error:", error.message);
    return { error: error.message };
  }
  if (!guides || guides.length === 0) return [];

  const guideIds = guides.map((g: Record<string, unknown>) => g.id as string);

  // Get guide places with place details
  const { data: gpRows } = await supabase
    .from("guide_places")
    .select("guide_id, place_id, note, sort_order, places(name, category)")
    .in("guide_id", guideIds)
    .order("sort_order", { ascending: true });

  // Get creator profiles
  const userIds = [
    ...new Set(guides.map((g: Record<string, unknown>) => g.user_id as string)),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", userIds);

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    const pr = p as Record<string, unknown>;
    profileMap.set(
      pr.id as string,
      (pr.display_name as string) ?? (pr.username as string) ?? "Unknown"
    );
  }

  // Build place lists per guide
  const guidePlaces = new Map<
    string,
    { name: string; category: string; note?: string }[]
  >();
  for (const row of gpRows ?? []) {
    const r = row as Record<string, unknown>;
    const gid = r.guide_id as string;
    const place = r.places as Record<string, unknown> | null;
    if (!place) continue;
    const existing = guidePlaces.get(gid) ?? [];
    existing.push({
      name: place.name as string,
      category: place.category as string,
      note: (r.note as string) || undefined,
    });
    guidePlaces.set(gid, existing);
  }

  // Filter by place category if requested, then map to lean shape
  let filtered = guides.map((g: Record<string, unknown>) => ({
    g,
    places: guidePlaces.get(g.id as string) ?? [],
  }));

  if (placeCategory) {
    filtered = filtered.filter((item) =>
      item.places.some((p) => p.category === placeCategory)
    );
  }

  return filtered.map(({ g, places }) => ({
    id: g.id as string,
    title: g.title,
    creatorName: profileMap.get(g.user_id as string) ?? "Unknown",
    placeCount: places.length,
    places: places.slice(0, 5).map((p) => p.name),
  }));
}

async function executeGetPlaceDetails(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<unknown> {
  const placeId = input.place_id as string;
  if (!placeId) return { error: "place_id is required" };

  const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!googleApiKey) {
    console.error("[ai-chat] GOOGLE_PLACES_API_KEY not set");
    return { error: "Google Places not configured" };
  }

  // Look up the Google Place ID from our database
  const { data: place, error } = await supabase
    .from("places")
    .select("name, google_place_id, address, category, latitude, longitude")
    .eq("id", placeId)
    .single();

  if (error || !place) {
    console.error("[ai-chat] get_place_details lookup error:", error?.message);
    return { error: "Place not found" };
  }

  const p = place as Record<string, unknown>;
  let googlePlaceId = p.google_place_id as string | null;

  // If no Google Place ID stored, try to find it via text search
  if (!googlePlaceId) {
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        (p.name as string) + " Wellington NZ"
      )}&inputtype=textquery&fields=place_id&key=${googleApiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      if (searchData.candidates?.length > 0) {
        googlePlaceId = searchData.candidates[0].place_id;
        console.log(`[ai-chat] Found Google Place ID via search: ${googlePlaceId}`);
      }
    } catch (e) {
      console.error("[ai-chat] Google Place search failed:", e);
    }
  }

  if (!googlePlaceId) {
    return {
      name: p.name,
      category: p.category,
      address: p.address,
      note: "No Google Place ID available — could not fetch detailed info.",
    };
  }

  console.log(`[ai-chat] get_place_details for "${p.name}" (google: ${googlePlaceId})`);

  try {
    const fields = "name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,url";
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=${fields}&key=${googleApiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK") {
      console.error("[ai-chat] Google Place Details error:", detailsData.status);
      return {
        name: p.name,
        category: p.category,
        address: p.address,
        error: `Google Places API error: ${detailsData.status}`,
      };
    }

    const result = detailsData.result;
    const priceLevelMap: Record<number, string> = {
      0: "Free",
      1: "Inexpensive",
      2: "Moderate",
      3: "Expensive",
      4: "Very Expensive",
    };

    console.log(
      `[ai-chat] get_place_details result: open=${result.opening_hours?.open_now}, rating=${result.rating}, reviews=${result.user_ratings_total}`
    );

    return {
      name: result.name ?? p.name,
      category: p.category,
      address: result.formatted_address ?? p.address,
      phone: result.formatted_phone_number ?? null,
      website: result.website ?? null,
      googleMapsUrl: result.url ?? null,
      rating: result.rating ?? null,
      totalReviews: result.user_ratings_total ?? null,
      priceLevel: result.price_level != null ? priceLevelMap[result.price_level] ?? null : null,
      openNow: result.opening_hours?.open_now ?? null,
      hours: result.opening_hours?.weekday_text ?? null,
    };
  } catch (e) {
    console.error("[ai-chat] Google Place Details fetch failed:", e);
    return {
      name: p.name,
      category: p.category,
      address: p.address,
      error: "Failed to fetch Google Places details",
    };
  }
}

async function executeGetUserSocialContext(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  const includeFeedPosts = (input.include_feed_posts as boolean) !== false;
  const includeUserPosts = (input.include_user_posts as boolean) !== false;
  const feedPostLimit = Math.min((input.feed_post_limit as number) || 30, 50);

  // Get who the user follows
  const { data: followRows } = await supabase
    .from("follows")
    .select(
      "following_id, profiles!follows_following_id_fkey(display_name, username)"
    )
    .eq("follower_id", userId);

  const followingUsers = (followRows ?? []).map(
    (r: Record<string, unknown>) => {
      const profile = r.profiles as Record<string, unknown> | null;
      return {
        id: r.following_id as string,
        name:
          (profile?.display_name as string) ??
          (profile?.username as string) ??
          "Unknown",
      };
    }
  );

  const followingIds = followingUsers.map((u) => u.id);
  const result: Record<string, unknown> = { followingUsers };

  // Get feed posts from followed users
  if (includeFeedPosts && followingIds.length > 0) {
    const { data: feedPosts } = await supabase
      .from("posts")
      .select("id, content, likes, user_id, place_id, created_at, places(name)")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(feedPostLimit);

    const followMap = new Map(followingUsers.map((u) => [u.id, u.name]));
    result.feedPosts = (feedPosts ?? []).map((p: Record<string, unknown>) => {
      const place = p.places as Record<string, unknown> | null;
      return {
        userName: followMap.get(p.user_id as string) ?? "Someone",
        placeName: (place?.name as string) ?? null,
        content: (p.content as string)?.slice(0, 100) ?? "",
      };
    });
  }

  // Get user's own posts (to understand their taste)
  if (includeUserPosts) {
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id, content, place_id, places(name, category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    result.userPosts = (userPosts ?? []).map((p: Record<string, unknown>) => {
      const place = p.places as Record<string, unknown> | null;
      return {
        placeName: (place?.name as string) ?? null,
        placeCategory: (place?.category as string) ?? null,
        content: (p.content as string)?.slice(0, 100) ?? "",
      };
    });
  }

  return result;
}

async function executeGetTrendingContent(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<unknown> {
  const hashtagLimit = Math.min((input.hashtag_limit as number) || 15, 30);
  const popularPostsLimit = Math.min(
    (input.popular_posts_limit as number) || 10,
    20
  );

  const [hashtagsResult, postsResult] = await Promise.all([
    supabase
      .from("hashtags")
      .select("id, name, post_count")
      .gt("post_count", 0)
      .order("post_count", { ascending: false })
      .limit(hashtagLimit),
    supabase
      .from("posts")
      .select(
        "id, content, likes, user_id, place_id, created_at, profiles(display_name), places(name, category)"
      )
      .order("likes", { ascending: false })
      .limit(popularPostsLimit),
  ]);

  return {
    trendingHashtags: (hashtagsResult.data ?? []).map(
      (h: Record<string, unknown>) => ({
        name: h.name,
        postCount: h.post_count,
      })
    ),
    popularPosts: (postsResult.data ?? []).map((p: Record<string, unknown>) => {
      const profile = p.profiles as Record<string, unknown> | null;
      const place = p.places as Record<string, unknown> | null;
      return {
        userName: (profile?.display_name as string) ?? "Someone",
        placeName: (place?.name as string) ?? null,
        placeCategory: (place?.category as string) ?? null,
        content: (p.content as string)?.slice(0, 100) ?? "",
        likes: p.likes,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Tool dispatcher
// ---------------------------------------------------------------------------

function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
  notInterested?: { eventIds: string[]; placeIds: string[] }
): Promise<unknown> {
  switch (name) {
    case "search_events":
      return executeSearchEvents(supabase, input, userId, notInterested?.eventIds);
    case "get_event_details":
      return executeGetEventDetails(supabase, input);
    case "search_places":
      return executeSearchPlaces(supabase, input, userId, notInterested?.placeIds);
    case "search_guides":
      return executeSearchGuides(supabase, input);
    case "get_user_social_context":
      return executeGetUserSocialContext(supabase, input, userId);
    case "get_weather":
      return fetchWeather();
    case "get_place_details":
      return executeGetPlaceDetails(supabase, input);
    case "get_trending_content":
      return executeGetTrendingContent(supabase, input);
    default:
      return Promise.resolve({ error: `Unknown tool: ${name}` });
  }
}

function getToolStatusText(name: string): string {
  switch (name) {
    case "search_events":
      return "Searching events...";
    case "get_event_details":
      return "Looking up event details...";
    case "search_places":
      return "Searching places...";
    case "search_guides":
      return "Searching guides...";
    case "get_user_social_context":
      return "Loading your social context...";
    case "get_weather":
      return "Checking the weather...";
    case "get_place_details":
      return "Looking up place details...";
    case "get_trending_content":
      return "Finding trending content...";
    default:
      return "Thinking...";
  }
}

// ---------------------------------------------------------------------------
// System prompt (lightweight — no embedded data)
// ---------------------------------------------------------------------------

function buildToolSystemPrompt(
  ctx: AIContextNew,
  social: PrefetchedSocialContext
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-NZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Pacific/Auckland",
  });
  const timeStr = now.toLocaleTimeString("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  });

  const locationStr = ctx.userLocation
    ? `User is near (${ctx.userLocation.latitude.toFixed(
        4
      )}, ${ctx.userLocation.longitude.toFixed(4)}) in Wellington.`
    : "User location unknown, assume they are in Wellington.";

  const userNameStr = ctx.userName
    ? `The user's name is ${ctx.userName}. Address them by name occasionally to keep the conversation personal and friendly — but don't overdo it, use it naturally (e.g. first message greeting, or when making a personal recommendation).`
    : "";

  const eventContextStr = ctx.eventContext
    ? `\nEVENT CONTEXT:\nThe user opened this chat from the event "${ctx.eventContext.title}"${ctx.eventContext.id ? ` (ID: ${ctx.eventContext.id})` : ""}. They are interested in this event. When they ask questions, relate your answers to this event when relevant (e.g. nearby food spots, what to expect, similar events).${ctx.eventContext.id ? ` Use get_event_details with event_id "${ctx.eventContext.id}" on their first question to get full details — do NOT use search_events for this.` : " Use search_events to find this event's details on their first question."}`
    : "";

  // Format pre-fetched social context
  const followingStr =
    social.followingUsers.length > 0
      ? social.followingUsers.map((u) => `${u.id}|${u.name}`).join("\n")
      : "Not following anyone yet.";

  const userPostsStr =
    social.userPosts.length > 0
      ? social.userPosts
          .map(
            (p) =>
              `${p.placeName ?? "unknown"}|${p.placeCategory ?? ""}|${
                p.content
              }`
          )
          .join("\n")
      : "No posts yet.";

  const visitedPlacesStr =
    social.visitedPlaces.length > 0
      ? social.visitedPlaces
          .map((p) => `${p.placeName}|${p.placeCategory ?? ""}`)
          .join("\n")
      : "No places visited yet.";

  const feedPostsStr =
    social.feedPosts.length > 0
      ? social.feedPosts
          .map((p) => `${p.userName}|${p.placeName ?? "unknown"}|${p.content}`)
          .join("\n")
      : "No recent posts.";

  return `You are Welly, a friendly AI assistant for the Welly app — a map-based social platform for discovering things to do in Wellington, New Zealand. You're a true local Wellingtonian with a warm Kiwi personality. Use natural New Zealand slang and expressions (e.g. "sweet as", "heaps good", "keen", "mate", "brekkie", "arvo", "choice", "chur") — but keep it natural, not over the top. You love Wellington and it comes through in how you talk about the city.

${userNameStr}
${eventContextStr}
Current date/time: ${dateStr}, ${timeStr}
${locationStr}

FOLLOWED USERS (id|name):
${followingStr}

USER'S OWN POSTS (place|category|content):
${userPostsStr}

VISITED PLACES (place|category) — places the user has ticked off as visited:
${visitedPlacesStr}

RECENT POSTS FROM FOLLOWED USERS (user|place|content):
${feedPostsStr}

${social.notInterestedEventIds.length > 0 || social.notInterestedPlaceIds.length > 0
    ? `NOT INTERESTED:
The user has marked certain items as "not interested". Do NOT recommend these.
${social.notInterestedEventIds.length > 0 ? `Hidden event IDs: ${social.notInterestedEventIds.join(", ")}` : ""}
${social.notInterestedPlaceIds.length > 0 ? `Hidden place IDs: ${social.notInterestedPlaceIds.join(", ")}` : ""}
These are already filtered from search results, but if you encounter them in other context, skip them.
`
    : ""}PREAMBLE:
- Before calling any tools, output a single short friendly line (max 10 words) acknowledging the user's question. This appears instantly while tools load. Match the tone to the question — e.g. "Ooh, let me find some cafes! ☕" or "Weekend plans — let me check! 🎉". Follow it with two newlines, then call your tools.
- For greetings or simple messages that won't need tools, skip the preamble and respond directly.

TOOL USAGE:
- You have tools to search the Welly app database. Use them to find real data before answering.
- For questions about events, things to do, or what's happening: use search_events with appropriate date filters.
  - "this weekend" = the upcoming Saturday and Sunday (check current day of week above)
  - "tonight" = today's date
  - "next week" = the Monday-to-Sunday after the current week
  - IMPORTANT: Prefer category filters over keyword search. Synonyms like "gigs", "shows", "live music", "concerts" → categories: ["music"]. "laughs", "standup" → categories: ["comedy"]. Only use keyword for specific event names or very specific searches.
- For questions about places (cafes, restaurants, bars, etc.): use search_places with category filters.
- After search_places, use get_place_details on your top 2-3 recommendations to enrich them with opening hours, ratings, price level, and whether they're currently open. This is especially important when:
  - The user asks for food/drink/cafe recommendations (they need to know what's open and price range)
  - The user asks about a specific place (opening hours, phone, website)
  - The user mentions "open now", "tonight", or time-sensitive queries
  Do NOT call get_place_details for every result — just the ones you plan to recommend. Call them in parallel to keep it fast.
- For questions about guides or curated lists: use search_guides.
- For trending or popular content: use get_trending_content.
- For general greetings or questions unrelated to Wellington activities, respond directly WITHOUT calling tools.
- You may call multiple tools in parallel if needed (e.g. search_events + search_places for "what should I do this weekend?").
- When the user's location is available, pass it to search_places for proximity sorting.
- Social context (followed users, user's posts, feed posts) is ALREADY provided above — do NOT call get_user_social_context unless you need to refresh this data.

WEB SEARCH & FETCH (web_search + web_fetch tools):
- You have web_search and web_fetch tools for looking up real-time info. Use them to enrich your answers with verified details — do NOT guess or rely on memory alone.
- Use web_search when the user asks about specific events, artists, performers, venues, restaurants, exhibitions, or anything where current/accurate details matter. Examples:
  - Music events: look up the artist's genre, top songs, what to expect at the show, similar artists
  - Comedy shows: look up the comedian, their style, notable specials
  - Restaurants/cafes: search for menus, reviews, opening hours, dietary options
  - Art exhibitions: look up the artist, the collection, reviews
  - General Wellington questions: transport, current affairs, weather forecasts
- Use web_fetch to get full details from a specific URL found via web_search or from event ticket URLs. Good for:
  - Restaurant/cafe websites: opening hours, menus, booking info
  - Event ticket pages: pricing, availability, lineup details
  - Venue websites: accessibility, parking, upcoming schedule
- Use get_event_details first to get the event description (which often contains artist/performer names), then web_search to look up those names. Use web_fetch if you need full details from a ticket URL.
- IMPORTANT: Do NOT use <cite> tags or source references in your response. Write naturally and incorporate the information directly into your message text.

RESPONSE FORMAT:
- Use emojis naturally throughout your responses to keep things fun and friendly (e.g. ☕ for cafes, 🍕 for restaurants, 🎶 for music events, 🌿 for parks, etc.)
- When mentioning places, events, or users in your message text, use inline markdown links with these URI schemes:
  - Places: [Place Name](place:placeId)
  - Events: [Event Title](event:eventId)
  - Users: [Display Name](user:userId)
  - Guides: [Guide Title](guide:guideId)
  For example: "Check out [Cafe Polo](place:abc-123) — [Sarah](user:def-456) posted about it recently!"
- Consider the time of day and day of week when suggesting activities. Use get_weather if outdoor activities are relevant.
- IMPORTANT: ONLY include places/events/guides that were returned by your tool calls. Never fabricate IDs or names. If a tool returns no results, say so honestly.
- Use the user's own posts and visited places list to understand their taste and preferences. Prefer recommending places they haven't visited yet. If they've visited a place, you can mention it positively ("Since you liked X, you might enjoy Y") but focus recommendations on new places to explore
- Prioritize places and events that the user's followed people have posted about or are attending
- When followed users are attending an event, mention them by name
- Keep your message to 2-3 short paragraphs max
- ONLY return valid JSON and nothing else. No text before or after the JSON. Use this exact format:
{
  "message": "Your friendly response text here",
  "places": [{"placeId": "uuid", "placeName": "Name", "category": "cafe", "reason": "Short reason"}],
  "events": [{"eventId": "uuid", "eventTitle": "Title", "date": "2026-02-20", "startTime": "18:00", "reason": "Short reason"}],
  "guides": [{"guideId": "uuid", "guideTitle": "Title", "creatorName": "Name", "placeCount": 5, "reason": "Short reason"}],
  "followUp": "A short follow-up question to keep the conversation going",
  "followUpPrompts": [{"label": "Short chip text", "prompt": "Full question sent when tapped"}]
}
- Always include a "followUp" — a short conversational follow-up question from you to the user (max 15 words)
- Include "followUpPrompts" — 0 to 3 tappable prompt chips. Each has a short "label" (max 4 words) and a "prompt" (the full natural question sent when tapped)
- Include 1-4 places, 0-3 events, and 0-2 guides as relevant to the question
- If the question is unrelated to Wellington activities, respond helpfully but keep places/events/guides arrays empty`;
}


// ---------------------------------------------------------------------------
// Response parsing helpers
// ---------------------------------------------------------------------------

function normalizeResponse(parsed: Record<string, unknown>): AIResponse {
  return {
    message: stripCitations(String(parsed.message ?? "")),
    places: Array.isArray(parsed.places) ? parsed.places : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
    guides: Array.isArray(parsed.guides) ? parsed.guides : [],
    followUp: typeof parsed.followUp === "string" ? parsed.followUp : undefined,
    followUpPrompts: Array.isArray(parsed.followUpPrompts)
      ? parsed.followUpPrompts
      : undefined,
  };
}

function parseAIResponse(text: string): AIResponse {
  try {
    const parsed = JSON.parse(text);
    if (parsed.message) return normalizeResponse(parsed);
  } catch {
    /* continue */
  }

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.message) return normalizeResponse(parsed);
    } catch {
      /* continue */
    }
  }

  const jsonMatch = text.match(/\{[\s\S]*"message"\s*:\s*"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message) return normalizeResponse(parsed);
    } catch {
      /* continue */
    }
  }

  return { message: stripCitations(text), places: [], events: [], guides: [] };
}

/**
 * Extract the value of the "message" key from a partial/growing JSON string.
 * Returns { text, complete } where complete=true when the closing quote is found.
 */
function extractPartialMessageValue(
  json: string
): { text: string; complete: boolean } | null {
  const key = '"message"';
  const idx = json.indexOf(key);
  if (idx === -1) return null;

  let i = idx + key.length;
  while (i < json.length && json[i] !== '"') i++;
  if (i >= json.length) return null;
  i++; // skip opening quote

  let result = "";
  while (i < json.length) {
    if (json[i] === "\\") {
      if (i + 1 >= json.length) break;
      const next = json[i + 1];
      if (next === '"') result += '"';
      else if (next === "\\") result += "\\";
      else if (next === "n") result += "\n";
      else if (next === "t") result += "\t";
      else if (next === "r") result += "\r";
      else if (next === "/") result += "/";
      else result += "\\" + next;
      i += 2;
    } else if (json[i] === '"') {
      return { text: result, complete: true };
    } else {
      result += json[i];
      i++;
    }
  }
  // Incomplete string — still streaming
  return { text: result, complete: false };
}

/**
 * Strip web search citation/search tags from text.
 */
function stripCitations(text: string): string {
  return text
    .replace(/<cite[^>]*>/g, "")
    .replace(/<\/cite>/g, "")
    .replace(/<search_result[^>]*>[\s\S]*?<\/search_result>/g, "")
    .replace(/<search_quality>[^<]*<\/search_quality>/g, "");
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const [
      {
        data: { user },
        error: authError,
      },
      body,
    ] = await Promise.all([
      supabase.auth.getUser(),
      req.json() as Promise<{
        messages: ConversationMessage[];
        context: Record<string, unknown>;
      }>,
    ]);

    if (authError || !user) {
      console.error("[ai-chat] Auth failed:", authError?.message ?? "no user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = body;

    // Start social context prefetch as early as possible (right after auth)
    // so it runs in parallel with validation + API key checks
    const userId =
      ((context as Record<string, unknown>).userId as string | undefined) ??
      user.id;
    const socialPromise = prefetchSocialContext(supabase, userId);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("[ai-chat] ANTHROPIC_API_KEY not set in secrets");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new Anthropic({ apiKey });

    const ctx = context as unknown as AIContextNew;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const t0 = Date.now();
        let firstTextSent = false;

        // Send immediate feedback with date so the client sees activity right away
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-NZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Pacific/Auckland",
        });
        const timeStr = now.toLocaleTimeString("en-NZ", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Pacific/Auckland",
        });
        controller.enqueue(
          encoder.encode(
            sseEvent("status", { text: `${dateStr}, ${timeStr}` })
          )
        );

        // Send a status update while we wait for Claude
        const lastUserMessage =
          messages[messages.length - 1]?.content ?? "";
        const isGreeting =
          /^\s*(hi|hey|hello|kia ora|sup|yo|g'?day|what'?s up|howdy|hola)\s*[!?.]*\s*$/i.test(
            lastUserMessage
          );
        if (!isGreeting) {
          controller.enqueue(
            encoder.encode(sseEvent("status", { text: "Searching..." }))
          );
        }

        // Await social context (started before stream opened)
        const socialContext = await socialPromise;

        const systemPrompt = buildToolSystemPrompt(ctx, socialContext);

        try {
          const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const MAX_ROUNDS = 4;

          for (let round = 0; round < MAX_ROUNDS; round++) {
            const _isLastRound = round === MAX_ROUNDS - 1;
            const roundStart = Date.now();
            console.log(
              `[ai-chat] Round ${round + 1}/${MAX_ROUNDS} starting (+${
                roundStart - t0
              }ms)`
            );

            // Let the client know we're generating the response after tools ran
            if (round > 0) {
              controller.enqueue(
                encoder.encode(
                  sseEvent("status", { text: "Generating response..." })
                )
              );
            }

            const response = await client.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: [
                {
                  type: "text",
                  text: systemPrompt,
                  cache_control: { type: "ephemeral" },
                },
              ],
              messages: apiMessages,
              stream: true,
              tools: [
                ...TOOL_DEFINITIONS,
                {
                  type: "web_search_20250305",
                  name: "web_search",
                  max_uses: 3,
                  user_location: {
                    type: "approximate",
                    city: "Wellington",
                    region: "Wellington",
                    country: "NZ",
                    timezone: "Pacific/Auckland",
                  },
                } as unknown as Anthropic.Tool,
                {
                  type: "web_fetch_20250910",
                  name: "web_fetch",
                  max_uses: 3,
                } as unknown as Anthropic.Tool,
              ],
            });

            let fullText = "";
            let lastRawProcessed = 0;
            let lastCleanedSent = 0;
            let stopReason = "";
            let messageComplete = false;

            // Collect tool_use blocks from the stream
            const toolBlocks: { id: string; name: string; input: string }[] =
              [];
            let currentTool: {
              id: string;
              name: string;
              input: string;
            } | null = null;

            // Track server-side web search blocks for conversation history
            let currentServerTool: { id: string; name: string; input: string } | null = null;
            const serverBlocks: unknown[] = [];

            for await (const event of response) {
              // Log cache usage from the message_start event
              if (event.type === "message_start" && event.message?.usage) {
                const u = event.message.usage as unknown as Record<string, unknown>;
                console.log(
                  `[ai-chat] Round ${round + 1} usage: input=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_create=${u.cache_creation_input_tokens ?? 0}`
                );
              }
              if (event.type === "content_block_start") {
                const block = event.content_block as unknown as Record<string, unknown>;
                if (block.type === "tool_use") {
                  currentTool = { id: block.id as string, name: block.name as string, input: "" };
                  console.log(
                    `[ai-chat] Tool call: ${block.name} (+${Date.now() - t0}ms)`
                  );
                } else if (block.type === "server_tool_use") {
                  currentServerTool = { id: block.id as string, name: block.name as string, input: "" };
                  const statusText = (block.name as string) === "web_fetch"
                    ? "Fetching page content..."
                    : "Searching the web...";
                  controller.enqueue(
                    encoder.encode(sseEvent("status", { text: statusText }))
                  );
                  console.log(
                    `[ai-chat] Server tool ${block.name} starting (+${Date.now() - t0}ms)`
                  );
                } else if (block.type === "web_search_tool_result") {
                  serverBlocks.push(block);
                  const content = block.content as unknown[];
                  if (Array.isArray(content)) {
                    const resultCount = content.filter(
                      (c: unknown) => (c as Record<string, unknown>).type === "web_search_result"
                    ).length;
                    console.log(
                      `[ai-chat] Web search returned ${resultCount} results (+${Date.now() - t0}ms)`
                    );
                  }
                } else if (block.type === "web_fetch_tool_result") {
                  serverBlocks.push(block);
                  const fetchContent = block.content as Record<string, unknown> | undefined;
                  if (fetchContent?.type === "web_fetch_result") {
                    console.log(
                      `[ai-chat] Web fetch completed: ${fetchContent.url} (+${Date.now() - t0}ms)`
                    );
                  } else if (fetchContent?.type === "web_fetch_tool_error") {
                    console.error(
                      `[ai-chat] Web fetch error: ${fetchContent.error_code} (+${Date.now() - t0}ms)`
                    );
                  }
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  // Forward text to client in real time
                  fullText += event.delta.text;
                  const partialMessage = extractPartialMessageValue(fullText);
                  if (partialMessage !== null) {
                    const raw = partialMessage.text;

                    // Find safe boundary: don't send past an unclosed '<' (could be a partial <cite> tag)
                    let safeEnd = raw.length;
                    if (!partialMessage.complete) {
                      const lastOpen = raw.lastIndexOf("<");
                      if (lastOpen !== -1 && lastOpen > raw.lastIndexOf(">")) {
                        // There's an unclosed tag — hold back from that point
                        safeEnd = lastOpen;
                      }
                    }

                    if (safeEnd > lastRawProcessed) {
                      const safeRaw = raw.slice(0, safeEnd);
                      const cleaned = stripCitations(safeRaw);
                      if (cleaned.length > lastCleanedSent) {
                        const newText = cleaned.slice(lastCleanedSent);
                        lastCleanedSent = cleaned.length;
                        lastRawProcessed = safeEnd;
                        if (!firstTextSent) {
                          firstTextSent = true;
                          console.log(
                            `[ai-chat] First text chunk sent to client (+${
                              Date.now() - t0
                            }ms)`
                          );
                        }
                        controller.enqueue(
                          encoder.encode(sseEvent("text", { text: newText }))
                        );
                      }
                    }

                    // When message is complete, flush any remaining buffered content
                    if (partialMessage.complete && safeEnd < raw.length) {
                      const remaining = stripCitations(raw);
                      if (remaining.length > lastCleanedSent) {
                        const newText = remaining.slice(lastCleanedSent);
                        lastCleanedSent = remaining.length;
                        controller.enqueue(
                          encoder.encode(sseEvent("text", { text: newText }))
                        );
                      }
                    }
                  }
                  // When message text is done, tell client we're building recs
                  if (partialMessage?.complete && !messageComplete) {
                    messageComplete = true;
                    controller.enqueue(
                      encoder.encode(
                        sseEvent("status", {
                          text: "Finding recommendations...",
                        })
                      )
                    );
                  }
                } else if (
                  event.delta.type === "input_json_delta"
                ) {
                  if (currentTool) {
                    currentTool.input += event.delta.partial_json;
                  } else if (currentServerTool) {
                    currentServerTool.input += event.delta.partial_json;
                  }
                }
              } else if (event.type === "content_block_stop") {
                if (currentTool) {
                  toolBlocks.push(currentTool);
                  currentTool = null;
                }
                if (currentServerTool) {
                  try {
                    const serverInput = JSON.parse(currentServerTool.input || "{}");
                    if (currentServerTool.name === "web_search") {
                      console.log(
                        `[ai-chat] Web search query: "${serverInput.query}" (+${Date.now() - t0}ms)`
                      );
                    } else if (currentServerTool.name === "web_fetch") {
                      console.log(
                        `[ai-chat] Web fetch URL: "${serverInput.url}" (+${Date.now() - t0}ms)`
                      );
                    }
                  } catch {
                    console.log(`[ai-chat] Server tool ${currentServerTool.name} input (raw): ${currentServerTool.input}`);
                  }
                  serverBlocks.push({
                    type: "server_tool_use",
                    id: currentServerTool.id,
                    name: currentServerTool.name,
                    input: JSON.parse(currentServerTool.input || "{}"),
                  });
                  currentServerTool = null;
                }
              } else if (event.type === "message_delta") {
                stopReason = (event.delta as unknown as Record<string, unknown>).stop_reason as string ?? "";
              }
            }

            console.log(
              `[ai-chat] Round ${round + 1} stream finished (+${
                Date.now() - t0
              }ms) stop=${stopReason} tools=${toolBlocks.length} serverBlocks=${serverBlocks.length} textLen=${
                fullText.length
              }`
            );

            // If Claude paused a long-running turn (e.g. multi-step web search),
            // feed the response back to continue
            if (stopReason === "pause_turn") {
              console.log(`[ai-chat] pause_turn — continuing (+${Date.now() - t0}ms)`);
              // Build the assistant content with all blocks (text + server blocks)
              const pauseContent: unknown[] = [];
              if (fullText) {
                pauseContent.push({ type: "text", text: fullText });
              }
              for (const block of serverBlocks) {
                pauseContent.push(block);
              }
              apiMessages.push({ role: "assistant", content: pauseContent } as Anthropic.MessageParam);
              serverBlocks.length = 0;
              continue;
            }

            // If no custom tools were called, we're done — text already streamed
            if (stopReason === "end_turn" || toolBlocks.length === 0) {
              const aiResponse = parseAIResponse(fullText);
              controller.enqueue(encoder.encode(sseEvent("done", aiResponse)));
              console.log(
                `[ai-chat] Done (+${Date.now() - t0}ms) places=${
                  aiResponse.places.length
                } events=${aiResponse.events.length} guides=${
                  aiResponse.guides.length
                }`
              );
              break;
            }

            // Tools requested — send status events, execute in parallel
            for (const tool of toolBlocks) {
              controller.enqueue(
                encoder.encode(
                  sseEvent("status", { text: getToolStatusText(tool.name) })
                )
              );
            }

            const toolExecStart = Date.now();
            const toolResults = await Promise.all(
              toolBlocks.map(async (tool) => {
                const input = JSON.parse(tool.input || "{}");
                console.log(
                  `[ai-chat] Tool ${tool.name} input:`,
                  JSON.stringify(input)
                );
                const result = await executeTool(
                  tool.name,
                  input,
                  supabase,
                  userId,
                  {
                    eventIds: socialContext.notInterestedEventIds,
                    placeIds: socialContext.notInterestedPlaceIds,
                  }
                );
                const resultStr = JSON.stringify(result);
                console.log(
                  `[ai-chat] Tool ${tool.name} executed (+${
                    Date.now() - t0
                  }ms) resultLen=${resultStr.length}`
                );
                return {
                  type: "tool_result" as const,
                  tool_use_id: tool.id,
                  content: resultStr,
                };
              })
            );
            console.log(
              `[ai-chat] All tools executed in ${
                Date.now() - toolExecStart
              }ms (+${Date.now() - t0}ms total)`
            );

            // Build assistant content blocks for the conversation history
            const assistantContent: Anthropic.ContentBlockParam[] = [];
            if (fullText) {
              assistantContent.push({ type: "text" as const, text: fullText });
            }
            // Include server-side blocks (web search) in history
            for (const block of serverBlocks) {
              assistantContent.push(block as Anthropic.ContentBlockParam);
            }
            for (const tool of toolBlocks) {
              assistantContent.push({
                type: "tool_use" as const,
                id: tool.id,
                name: tool.name,
                input: JSON.parse(tool.input || "{}"),
              });
            }

            apiMessages.push({ role: "assistant", content: assistantContent });
            apiMessages.push({ role: "user", content: toolResults });
            serverBlocks.length = 0;
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream error";
          console.error(`[ai-chat] Error (+${Date.now() - t0}ms):`, message);
          controller.enqueue(
            encoder.encode(sseEvent("error", { error: message }))
          );
        } finally {
          console.log(`[ai-chat] Total request time: ${Date.now() - t0}ms`);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[ai-chat] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

