import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Place {
  id: string;
  name: string;
  category: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  category: string;
  price?: number;
  attendeeIds?: string[];
}

interface FeedPost {
  content: string;
  userName?: string;
  placeName?: string;
}

interface FollowingUser {
  id: string;
  username: string;
  displayName?: string;
}

interface AIContext {
  places: Place[];
  events: Event[];
  feedPosts: FeedPost[];
  followingUsers: FollowingUser[];
  userLocation: { latitude: number; longitude: number } | null;
  trendingHashtags?: string[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  message: string;
  places: { placeId: string; placeName: string; category: string; reason: string }[];
  events: { eventId: string; eventTitle: string; date: string; startTime?: string; reason: string }[];
}

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
    return `Current weather in Wellington: ${condition}, ${current.temperature_2m}°C, wind ${current.wind_speed_10m} km/h${current.precipitation > 0 ? `, ${current.precipitation}mm precipitation` : ""}.`;
  } catch {
    return "";
  }
}

function buildSystemPrompt(ctx: AIContext, weather: string): string {
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
    ? `User is near (${ctx.userLocation.latitude.toFixed(4)}, ${ctx.userLocation.longitude.toFixed(4)}) in Wellington.`
    : "User location unknown, assume they are in Wellington.";

  const placesStr = ctx.places
    .slice(0, 30)
    .map((p) => `${p.id}|${p.name}|${p.category}`)
    .join("\n");

  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingEvents = ctx.events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= twoWeeks;
    })
    .slice(0, 30);

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
      return `${e.id}|${e.title}|${e.date}|${e.startTime}|${e.category}${e.price ? `|$${e.price}` : "|free"}${attendeeStr}`;
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
        `${p.userName ?? "someone"}|${p.placeName ?? "unknown place"}|${p.content.slice(0, 100)}`
    )
    .join("\n");

  return `You are Welly, a friendly AI assistant for the Welly app — a map-based social platform for discovering things to do in Wellington, New Zealand.

Current date/time: ${dateStr}, ${timeStr}
${locationStr}
${weather}

PLACES (id|name|category):
${placesStr || "No places loaded yet."}

UPCOMING EVENTS (id|title|date|startTime|category|price|followed attending):
${eventsStr || "No upcoming events."}

FOLLOWED USERS (id|name):
${followingStr || "Not following anyone yet."}

RECENT POSTS FROM FOLLOWED USERS (user|place|content):
${postsStr || "No recent posts."}

TRENDING HASHTAGS:
${ctx.trendingHashtags?.length ? ctx.trendingHashtags.map((t) => `#${t}`).join(", ") : "None yet."}

INSTRUCTIONS:
- Use emojis naturally throughout your responses to keep things fun and friendly (e.g. ☕ for cafes, 🍕 for restaurants, 🎶 for music events, 🌿 for parks, etc.)
- Give friendly, concise recommendations based on the data above
- When mentioning places, events, or users in your message text, use inline markdown links with these URI schemes:
  - Places: [Place Name](place:placeId)
  - Events: [Event Title](event:eventId)
  - Users: [Display Name](user:userId)
  For example: "Check out [Cafe Polo](place:abc-123) — [Sarah](user:def-456) posted about it recently!"
- Consider the time of day, day of week, and current weather when suggesting activities (e.g. indoor spots on rainy days, outdoor activities when it's nice)
- Prioritize places and events that the user's followed people have posted about or are attending
- When followed users are attending an event, mention them by name (e.g. "Sarah and Mike are going to this one!")
- Keep your message to 2-3 short paragraphs max
- ONLY return valid JSON and nothing else. No text before or after the JSON. Use this exact format:
{
  "message": "Your friendly response text here",
  "places": [{"placeId": "uuid", "placeName": "Name", "category": "cafe", "reason": "Short reason"}],
  "events": [{"eventId": "uuid", "eventTitle": "Title", "date": "2026-02-20", "startTime": "18:00", "reason": "Short reason"}]
}
- Only include places/events that exist in the data above
- Include 1-4 places and 0-3 events as relevant to the question
- When suggesting activities, you may reference relevant trending hashtags to help users discover related content
- If the question is unrelated to Wellington activities, respond helpfully but keep places/events arrays empty`;
}

function parseAIResponse(text: string): AIResponse {
  try {
    const parsed = JSON.parse(text);
    if (parsed.message) return parsed;
  } catch { /* continue */ }

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.message) return parsed;
    } catch { /* continue */ }
  }

  const jsonMatch = text.match(/\{[\s\S]*"message"\s*:\s*"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message) return parsed;
    } catch { /* continue */ }
  }

  return {
    message: text,
    places: [],
    events: [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[ai-chat] Auth failed:", authError?.message ?? "no user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = (await req.json()) as {
      messages: ConversationMessage[];
      context: AIContext;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("[ai-chat] ANTHROPIC_API_KEY not set in secrets");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const weather = await fetchWeather();
    const systemPrompt = buildSystemPrompt(context, weather);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find(
      (block: { type: string }) => block.type === "text"
    );
    if (!textBlock || textBlock.type !== "text") {
      return new Response(JSON.stringify({ error: "No text response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = parseAIResponse(
      (textBlock as { type: "text"; text: string }).text
    );

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[ai-chat] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
