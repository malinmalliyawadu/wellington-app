import EventSource from 'react-native-sse';
import type { AIResponse } from '../types';
import { supabase } from '../lib/supabase';

interface AIContext {
  userName?: string;
  userId: string;
  userLocation: { latitude: number; longitude: number } | null;
  eventContext?: { id?: string; title: string };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onTextChunk: (text: string) => void;
  onComplete: (response: AIResponse) => void;
  onError: (error: string) => void;
  onStatus?: (text: string) => void;
}

type SSEEvent = 'text' | 'status' | 'done' | 'error';

export async function askAIStreaming(
  messages: ConversationMessage[],
  ctx: AIContext,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    callbacks.onError('Not authenticated');
    return;
  }

  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  return new Promise<void>((resolve) => {
    const es = new EventSource<SSEEvent>(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      method: 'POST',
      body: JSON.stringify({ messages, context: ctx }),
      pollingInterval: 0,
    });

    const cleanup = () => {
      es.close();
      resolve();
    };

    es.addEventListener('text', (event) => {
      if (event.data) {
        try {
          const parsed = JSON.parse(event.data);
          callbacks.onTextChunk(parsed.text);
        } catch (e) {
          console.warn('[ai-stream] Failed to parse text event:', e);
        }
      }
    });

    es.addEventListener('status', (event) => {
      if (event.data) {
        try {
          const parsed = JSON.parse(event.data);
          callbacks.onStatus?.(parsed.text);
        } catch (e) {
          console.warn('[ai-stream] Failed to parse status event:', e);
        }
      }
    });

    es.addEventListener('done', (event) => {
      if (event.data) {
        try {
          const parsed = JSON.parse(event.data);
          callbacks.onComplete(parsed as AIResponse);
        } catch (e) {
          console.warn('[ai-stream] Failed to parse done event:', e);
        }
      }
      cleanup();
    });

    es.addEventListener('error', (event) => {
      if (event.type === 'error') {
        const message = ('message' in event ? event.message : undefined) ?? 'Stream error';
        console.error('[ai-stream] SSE error:', message);
        callbacks.onError(message);
      }
      cleanup();
    });

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        cleanup();
      };
      signal.addEventListener('abort', onAbort);
    }
  });
}
