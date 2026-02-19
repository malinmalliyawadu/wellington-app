import Anthropic from '@anthropic-ai/sdk';
import type { Place, Event, Post, User, AIResponse } from '../types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
});

interface AIContext {
  places: Place[];
  events: Event[];
  feedPosts: (Post & { userName?: string; placeName?: string })[];
  followingUsers: User[];
  userLocation: { latitude: number; longitude: number } | null;
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Light rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

async function fetchWeather(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-41.2924&longitude=174.7787&current=temperature_2m,weather_code,wind_speed_10m,precipitation&timezone=Pacific%2FAuckland',
    );
    const data = await res.json();
    const current = data.current;
    const condition = WEATHER_CODES[current.weather_code] ?? 'Unknown';
    return `Current weather in Wellington: ${condition}, ${current.temperature_2m}°C, wind ${current.wind_speed_10m} km/h${current.precipitation > 0 ? `, ${current.precipitation}mm precipitation` : ''}.`;
  } catch {
    return '';
  }
}

function buildSystemPrompt(ctx: AIContext, weather: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const locationStr = ctx.userLocation
    ? `User is near (${ctx.userLocation.latitude.toFixed(4)}, ${ctx.userLocation.longitude.toFixed(4)}) in Wellington.`
    : 'User location unknown, assume they are in Wellington.';

  // Compact places: id|name|category
  const placesStr = ctx.places
    .slice(0, 30)
    .map((p) => `${p.id}|${p.name}|${p.category}`)
    .join('\n');

  // Events within next 14 days
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingEvents = ctx.events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= twoWeeks;
    })
    .slice(0, 30);

  const followingSet = new Set(ctx.followingUsers.map((u) => u.id));
  const followingNameMap = new Map(ctx.followingUsers.map((u) => [u.id, u.displayName ?? u.username]));

  const eventsStr = upcomingEvents
    .map((e) => {
      const attendingFollowed = (e.attendeeIds ?? [])
        .filter((id) => followingSet.has(id))
        .map((id) => followingNameMap.get(id))
        .filter(Boolean);
      const attendeeStr = attendingFollowed.length > 0
        ? `|attending: ${attendingFollowed.join(', ')}`
        : '';
      return `${e.id}|${e.title}|${e.date}|${e.startTime}|${e.category}${e.price ? `|$${e.price}` : '|free'}${attendeeStr}`;
    })
    .join('\n');

  // Followed users: id|name
  const followingStr = ctx.followingUsers
    .slice(0, 30)
    .map((u) => `${u.id}|${u.displayName ?? u.username}`)
    .join('\n');

  // Recent feed posts with context
  const postsStr = ctx.feedPosts
    .slice(0, 50)
    .map((p) => `${p.userName ?? 'someone'}|${p.placeName ?? 'unknown place'}|${p.content.slice(0, 100)}`)
    .join('\n');

  return `You are Welly, a friendly AI assistant for the Welly app — a map-based social platform for discovering things to do in Wellington, New Zealand.

Current date/time: ${dateStr}, ${timeStr}
${locationStr}
${weather}

PLACES (id|name|category):
${placesStr || 'No places loaded yet.'}

UPCOMING EVENTS (id|title|date|startTime|category|price|followed attending):
${eventsStr || 'No upcoming events.'}

FOLLOWED USERS (id|name):
${followingStr || 'Not following anyone yet.'}

RECENT POSTS FROM FOLLOWED USERS (user|place|content):
${postsStr || 'No recent posts.'}

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
- If the question is unrelated to Wellington activities, respond helpfully but keep places/events arrays empty`;
}

function parseAIResponse(text: string): AIResponse {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (parsed.message) return parsed;
  } catch {}

  // Try extracting from markdown code fences
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.message) return parsed;
    } catch {}
  }

  // Try extracting a JSON object from anywhere in the text
  const jsonMatch = text.match(/\{[\s\S]*"message"\s*:\s*"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message) return parsed;
    } catch {}
  }

  // Fallback: use raw text as message
  return {
    message: text,
    places: [],
    events: [],
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  messages: ConversationMessage[],
  ctx: AIContext,
): Promise<AIResponse> {
  const weather = await fetchWeather();
  const systemPrompt = buildSystemPrompt(ctx, weather);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return parseAIResponse(textBlock.text);
}
