import type { Place, Event, Post, User, GuideWithPlaces, AIResponse } from '../types';
import { supabase } from '../lib/supabase';

interface AIContext {
  places: Place[];
  events: Event[];
  feedPosts: (Post & { userName?: string; placeName?: string })[];
  followingUsers: User[];
  userLocation: { latitude: number; longitude: number } | null;
  trendingHashtags?: string[];
  guides?: GuideWithPlaces[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  messages: ConversationMessage[],
  ctx: AIContext,
): Promise<AIResponse> {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { messages, context: ctx },
  });

  if (error) {
    const errorBody = await error.context?.json?.().catch(() => null);
    throw new Error(errorBody?.error ?? error.message ?? 'AI request failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIResponse;
}
