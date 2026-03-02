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
}

// Legacy context (backward compat)
interface AIContextLegacy {
  userName?: string;
  places: { id: string; name: string; category: string }[];
  events: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    category: string;
    price?: number;
    attendeeIds?: string[];
  }[];
  feedPosts: { content: string; userName?: string; placeName?: string }[];
  userPosts?: { content: string; placeName?: string }[];
  followingUsers: { id: string; username: string; displayName?: string }[];
  userLocation: { latitude: number; longitude: number } | null;
  trendingHashtags?: string[];
  guides?: {
    id: string;
    title: string;
    description?: string;
    placeCount: number;
    creatorName?: string;
    places?: { name: string; category: string; note?: string }[];
  }[];
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
      "Get the user's social context: who they follow, recent posts from followed users, and the user's own posting history. Use this to personalize recommendations based on the user's taste and social circle.",
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
  userId: string
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
      "id, title, description, date, start_time, end_time, category, price, ticket_url, place_id, places(name, address)"
    )
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

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
  let attendeeMap = new Map<string, string[]>();

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
    return {
      id: eid,
      title: e.title,
      date: `${e.date} (${dayOfWeek})`,
      startTime: e.start_time,
      endTime: e.end_time ?? null,
      category: e.category,
      price: e.price ?? null,
      ticketUrl: e.ticket_url ?? null,
      venueName: place?.name ?? null,
      venueAddress: place?.address ?? null,
      description: (e.description as string)?.slice(0, 200) ?? null,
      followedAttendees: attendeeMap.get(eid) ?? [],
    };
  });
}

async function executeSearchPlaces(
  supabase: SupabaseClient,
  input: Record<string, unknown>,
  userId: string
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

  // Get post counts + top snippet for each place
  const { data: postRows } = await supabase
    .from("posts")
    .select("place_id, content, likes, user_id")
    .in("place_id", placeIds)
    .order("likes", { ascending: false })
    .limit(200);

  const placePostCounts = new Map<string, number>();
  const placeTopSnippet = new Map<string, string>();
  const userVisited = new Set<string>();

  for (const row of postRows ?? []) {
    const r = row as Record<string, unknown>;
    const pid = r.place_id as string;
    placePostCounts.set(pid, (placePostCounts.get(pid) ?? 0) + 1);
    if (!placeTopSnippet.has(pid) && r.content) {
      placeTopSnippet.set(pid, (r.content as string).slice(0, 100));
    }
    if ((r.user_id as string) === userId) {
      userVisited.add(pid);
    }
  }

  let results = (places ?? []).map((p: Record<string, unknown>) => {
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
      address: p.address,
      postCount: placePostCounts.get(pid) ?? 0,
      topSnippet: placeTopSnippet.get(pid) ?? null,
      userHasVisited: userVisited.has(pid),
      distanceMeters: distance != null ? Math.round(distance) : null,
    };
  });

  // Sort by proximity if coordinates provided, else by post count
  if (nearLat != null && nearLng != null) {
    results.sort(
      (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
    );
  } else {
    results.sort((a, b) => b.postCount - a.postCount);
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
    .select("id, title, description, user_id, likes, created_at")
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

  // Filter by place category if requested
  let results = guides.map((g: Record<string, unknown>) => {
    const gid = g.id as string;
    const places = guidePlaces.get(gid) ?? [];
    return {
      id: gid,
      title: g.title,
      description: (g.description as string)?.slice(0, 200) ?? null,
      creatorName: profileMap.get(g.user_id as string) ?? "Unknown",
      placeCount: places.length,
      places: places.slice(0, 8),
      likes: g.likes,
    };
  });

  if (placeCategory) {
    results = results.filter((g) =>
      g.places.some((p) => p.category === placeCategory)
    );
  }

  return results;
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

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "search_events":
      return executeSearchEvents(supabase, input, userId);
    case "search_places":
      return executeSearchPlaces(supabase, input, userId);
    case "search_guides":
      return executeSearchGuides(supabase, input);
    case "get_user_social_context":
      return executeGetUserSocialContext(supabase, input, userId);
    case "get_trending_content":
      return executeGetTrendingContent(supabase, input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function getToolStatusText(name: string): string {
  switch (name) {
    case "search_events":
      return "Searching events...";
    case "search_places":
      return "Searching places...";
    case "search_guides":
      return "Searching guides...";
    case "get_user_social_context":
      return "Loading your social context...";
    case "get_trending_content":
      return "Finding trending content...";
    default:
      return "Thinking...";
  }
}

// ---------------------------------------------------------------------------
// System prompt (lightweight — no embedded data)
// ---------------------------------------------------------------------------

function buildToolSystemPrompt(ctx: AIContextNew, weather: string): string {
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

  return `You are Welly, a friendly AI assistant for the Welly app — a map-based social platform for discovering things to do in Wellington, New Zealand. You're a true local Wellingtonian with a warm Kiwi personality. Use natural New Zealand slang and expressions (e.g. "sweet as", "heaps good", "keen", "mate", "brekkie", "arvo", "choice", "chur") — but keep it natural, not over the top. You love Wellington and it comes through in how you talk about the city.

${userNameStr}

Current date/time: ${dateStr}, ${timeStr}
${locationStr}
${weather}

TOOL USAGE:
- You have tools to search the Welly app database. Use them to find real data before answering.
- For questions about events, things to do, or what's happening: use search_events with appropriate date filters.
  - "this weekend" = the upcoming Saturday and Sunday (check current day of week above)
  - "tonight" = today's date
  - "next week" = the Monday-to-Sunday after the current week
- For questions about places (cafes, restaurants, bars, etc.): use search_places with category filters.
- For questions about guides or curated lists: use search_guides.
- For personalized recommendations or when you need to know the user's taste: use get_user_social_context.
- For trending or popular content: use get_trending_content.
- For general greetings or questions unrelated to Wellington activities, respond directly WITHOUT calling tools.
- You may call multiple tools in parallel if needed (e.g. search_events + search_places for "what should I do this weekend?").
- When the user's location is available, pass it to search_places for proximity sorting.

RESPONSE FORMAT:
- Use emojis naturally throughout your responses to keep things fun and friendly (e.g. ☕ for cafes, 🍕 for restaurants, 🎶 for music events, 🌿 for parks, etc.)
- When mentioning places, events, or users in your message text, use inline markdown links with these URI schemes:
  - Places: [Place Name](place:placeId)
  - Events: [Event Title](event:eventId)
  - Users: [Display Name](user:userId)
  - Guides: [Guide Title](guide:guideId)
  For example: "Check out [Cafe Polo](place:abc-123) — [Sarah](user:def-456) posted about it recently!"
- Consider the time of day, day of week, and current weather when suggesting activities
- IMPORTANT: ONLY include places/events/guides that were returned by your tool calls. Never fabricate IDs or names. If a tool returns no results, say so honestly.
- Use the user's own posts (from get_user_social_context) to understand their taste and preferences, but do NOT recommend places they've already posted about unless they specifically ask
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
// Legacy system prompt (backward compatibility)
// ---------------------------------------------------------------------------

function buildLegacySystemPrompt(
  ctx: AIContextLegacy,
  weather: string
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
  const placesStr = ctx.places
    .slice(0, 30)
    .map((p) => `${p.id}|${p.name}|${p.category}`)
    .join("\n");
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const filteredEvents = ctx.events.filter((e) => {
    const eventDate = new Date(e.date);
    return eventDate >= now && eventDate <= twoWeeks;
  });
  const eventsByDate = new Map<string, typeof ctx.events>();
  for (const e of filteredEvents) {
    const dateKey = e.date.slice(0, 10);
    const group = eventsByDate.get(dateKey) ?? [];
    group.push(e);
    eventsByDate.set(dateKey, group);
  }
  const upcomingEvents: typeof ctx.events = [];
  for (const dateKey of [...eventsByDate.keys()].sort()) {
    upcomingEvents.push(...eventsByDate.get(dateKey)!.slice(0, 4));
  }
  upcomingEvents.splice(50);
  const followingSet = new Set(ctx.followingUsers.map((u) => u.id));
  const followingNameMap = new Map(
    ctx.followingUsers.map((u) => [u.id, u.displayName ?? u.username])
  );
  const eventsStr = upcomingEvents
    .map((e) => {
      const attendingFollowed = (e.attendeeIds ?? [])
        .filter((id) => followingSet.has(id))
        .map((id) => followingNameMap.get(id))
        .filter(Boolean);
      const attendeeStr =
        attendingFollowed.length > 0
          ? `|attending: ${attendingFollowed.join(", ")}`
          : "";
      const dayOfWeek = new Date(e.date).toLocaleDateString("en-NZ", {
        weekday: "short",
        timeZone: "Pacific/Auckland",
      });
      return `${e.id}|${e.title}|${e.date} (${dayOfWeek})|${e.startTime}|${
        e.category
      }${e.price ? `|$${e.price}` : "|free"}${attendeeStr}`;
    })
    .join("\n");
  const followingStr = ctx.followingUsers
    .slice(0, 30)
    .map((u) => `${u.id}|${u.displayName ?? u.username}`)
    .join("\n");
  const postsStr = ctx.feedPosts
    .slice(0, 50)
    .map(
      (p) =>
        `${p.userName ?? "someone"}|${
          p.placeName ?? "unknown place"
        }|${p.content.slice(0, 100)}`
    )
    .join("\n");
  const userPostsStr = (ctx.userPosts ?? [])
    .slice(0, 20)
    .map((p) => `${p.placeName ?? "unknown place"}|${p.content.slice(0, 100)}`)
    .join("\n");
  const userNameStr = ctx.userName
    ? `The user's name is ${ctx.userName}. Address them by name occasionally.`
    : "";

  return `You are Welly, a friendly AI assistant for the Welly app — a map-based social platform for discovering things to do in Wellington, New Zealand. You're a true local Wellingtonian with a warm Kiwi personality. Use natural New Zealand slang and expressions (e.g. "sweet as", "heaps good", "keen", "mate", "brekkie", "arvo", "choice", "chur") — but keep it natural, not over the top. You love Wellington and it comes through in how you talk about the city.

${userNameStr}

Current date/time: ${dateStr}, ${timeStr}
${locationStr}
${weather}

PLACES (id|name|category):
${placesStr || "No places loaded yet."}

UPCOMING EVENTS (id|title|date|startTime|category|price|followed attending):
${eventsStr || "No upcoming events."}

FOLLOWED USERS (id|name):
${followingStr || "Not following anyone yet."}

USER'S OWN POSTS (place|content):
${userPostsStr || "No posts yet."}

RECENT POSTS FROM FOLLOWED USERS (user|place|content):
${postsStr || "No recent posts."}

GUIDES:
${
  ctx.guides?.length
    ? ctx.guides
        .map((g) => {
          const guidePlacesStr = g.places?.length
            ? `\n  Places: ${g.places
                .map((p) => `${p.name} (${p.category})`)
                .join(", ")}`
            : "";
          const descStr = g.description ? ` — "${g.description}"` : "";
          return `${g.id}|"${g.title}" by ${g.creatorName ?? "unknown"} (${
            g.placeCount
          } places)${descStr}${guidePlacesStr}`;
        })
        .join("\n")
    : "No guides yet."
}

TRENDING HASHTAGS:
${
  ctx.trendingHashtags?.length
    ? ctx.trendingHashtags.map((t) => `#${t}`).join(", ")
    : "None yet."
}

INSTRUCTIONS:
- Use emojis naturally throughout your responses
- Give friendly, concise recommendations based on the data above
- When mentioning places, events, or users, use inline markdown links:
  - Places: [Place Name](place:placeId)
  - Events: [Event Title](event:eventId)
  - Users: [Display Name](user:userId)
  - Guides: [Guide Title](guide:guideId)
- Consider the time of day, day of week, and current weather
- IMPORTANT: When the user asks about a specific time period, ONLY recommend events whose dates fall within that period
- Keep your message to 2-3 short paragraphs max
- ONLY return valid JSON and nothing else. Use this exact format:
{
  "message": "Your friendly response text here",
  "places": [{"placeId": "uuid", "placeName": "Name", "category": "cafe", "reason": "Short reason"}],
  "events": [{"eventId": "uuid", "eventTitle": "Title", "date": "2026-02-20", "startTime": "18:00", "reason": "Short reason"}],
  "guides": [{"guideId": "uuid", "guideTitle": "Title", "creatorName": "Name", "placeCount": 5, "reason": "Short reason"}],
  "followUp": "A short follow-up question",
  "followUpPrompts": [{"label": "Short chip text", "prompt": "Full question sent when tapped"}]
}
- Always include a "followUp" and 0-3 "followUpPrompts"
- Only include places/events/guides that exist in the data above`;
}

// ---------------------------------------------------------------------------
// Response parsing helpers
// ---------------------------------------------------------------------------

function normalizeResponse(parsed: Record<string, unknown>): AIResponse {
  return {
    message: String(parsed.message ?? ""),
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

  return { message: text, places: [], events: [], guides: [] };
}

/**
 * Extract the value of the "message" key from a partial/growing JSON string.
 */
function extractPartialMessageValue(json: string): string | null {
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
      return result;
    } else {
      result += json[i];
      i++;
    }
  }
  return result;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// Check if request uses legacy format
// ---------------------------------------------------------------------------

function isLegacyContext(context: Record<string, unknown>): boolean {
  return Array.isArray(context.places) || Array.isArray(context.events);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const weatherPromise = fetchWeather();

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
    const weather = await weatherPromise;

    // -----------------------------------------------------------------------
    // Legacy path: old client sends full context with places/events arrays
    // -----------------------------------------------------------------------
    if (isLegacyContext(context)) {
      const systemPrompt = buildLegacySystemPrompt(
        context as unknown as AIContextLegacy,
        weather
      );
      return streamSingleCall(client, systemPrompt, messages);
    }

    // -----------------------------------------------------------------------
    // New path: tool-use agentic loop
    // -----------------------------------------------------------------------
    const ctx = context as unknown as AIContextNew;
    const userId = ctx.userId ?? user.id;
    const systemPrompt = buildToolSystemPrompt(ctx, weather);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const t0 = Date.now();
        let firstTextSent = false;

        try {
          const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const MAX_ROUNDS = 3;

          for (let round = 0; round < MAX_ROUNDS; round++) {
            const isLastRound = round === MAX_ROUNDS - 1;
            const roundStart = Date.now();
            console.log(
              `[ai-chat] Round ${round + 1}/${MAX_ROUNDS} starting (+${
                roundStart - t0
              }ms)`
            );

            // Stream every round — text deltas flow to client in real time,
            // tool_use blocks are collected silently.
            const response = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1024,
              system: systemPrompt,
              messages: apiMessages,
              stream: true,
              ...(isLastRound ? {} : { tools: TOOL_DEFINITIONS }),
            });

            let fullText = "";
            let lastSentLength = 0;
            let stopReason = "";

            // Collect tool_use blocks from the stream
            const toolBlocks: { id: string; name: string; input: string }[] =
              [];
            let currentTool: {
              id: string;
              name: string;
              input: string;
            } | null = null;

            for await (const event of response) {
              if (event.type === "content_block_start") {
                const block = event.content_block;
                if (block.type === "tool_use") {
                  currentTool = { id: block.id, name: block.name, input: "" };
                  console.log(
                    `[ai-chat] Tool call: ${block.name} (+${Date.now() - t0}ms)`
                  );
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  // Forward text to client in real time
                  fullText += event.delta.text;
                  const partialMessage = extractPartialMessageValue(fullText);
                  if (
                    partialMessage !== null &&
                    partialMessage.length > lastSentLength
                  ) {
                    const newText = partialMessage.slice(lastSentLength);
                    lastSentLength = partialMessage.length;
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
                } else if (
                  event.delta.type === "input_json_delta" &&
                  currentTool
                ) {
                  currentTool.input += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (currentTool) {
                  toolBlocks.push(currentTool);
                  currentTool = null;
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason ?? "";
              }
            }

            console.log(
              `[ai-chat] Round ${round + 1} stream finished (+${
                Date.now() - t0
              }ms) stop=${stopReason} tools=${toolBlocks.length} textLen=${
                fullText.length
              }`
            );

            // If no tools were called, we're done — text already streamed
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
                const result = await executeTool(
                  tool.name,
                  input,
                  supabase,
                  userId
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

// ---------------------------------------------------------------------------
// Streaming helpers
// ---------------------------------------------------------------------------

/**
 * Legacy path: single streaming API call (backward compat with old clients).
 */
function streamSingleCall(
  client: Anthropic,
  systemPrompt: string,
  messages: ConversationMessage[]
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      let lastSentLength = 0;

      try {
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            const partialMessage = extractPartialMessageValue(fullText);
            if (
              partialMessage !== null &&
              partialMessage.length > lastSentLength
            ) {
              const newText = partialMessage.slice(lastSentLength);
              lastSentLength = partialMessage.length;
              controller.enqueue(
                encoder.encode(sseEvent("text", { text: newText }))
              );
            }
          }
        }

        const aiResponse = parseAIResponse(fullText);
        controller.enqueue(encoder.encode(sseEvent("done", aiResponse)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Stream error";
        console.error("[ai-chat] Stream error:", message);
        controller.enqueue(
          encoder.encode(sseEvent("error", { error: message }))
        );
      } finally {
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
}
