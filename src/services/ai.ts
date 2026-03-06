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

/**
 * Parse SSE events from a chunk of text.
 * Returns any remaining incomplete data as the new buffer.
 */
function parseSSEChunk(
  chunk: string,
  buffer: string,
  callbacks: StreamCallbacks,
): string {
  const text = buffer + chunk;
  // Split on double newline (SSE event boundary)
  const parts = text.split('\n\n');
  // Last part may be incomplete — keep as buffer
  const remaining = parts.pop() ?? '';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    let eventType = '';
    let data = '';

    for (const line of trimmed.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7);
      } else if (line.startsWith('data: ')) {
        data = line.slice(6);
      }
    }

    if (!eventType || !data) continue;

    console.log(`[ai-stream] SSE event: ${eventType}, data length: ${data.length}`);

    try {
      const parsed = JSON.parse(data);
      if (eventType === 'text') {
        console.log(`[ai-stream] text chunk: "${parsed.text}"`);
        callbacks.onTextChunk(parsed.text);
      } else if (eventType === 'status') {
        console.log(`[ai-stream] status: "${parsed.text}"`);
        callbacks.onStatus?.(parsed.text);
      } else if (eventType === 'done') {
        console.log('[ai-stream] done — full response received');
        callbacks.onComplete(parsed as AIResponse);
      } else if (eventType === 'error') {
        console.error('[ai-stream] server error:', parsed.error);
        callbacks.onError(parsed.error ?? 'Unknown stream error');
      }
    } catch (e) {
      console.warn('[ai-stream] Failed to parse SSE data:', data.slice(0, 200), e);
    }
  }

  return remaining;
}

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
    console.error('[ai-stream] No session/token');
    callbacks.onError('Not authenticated');
    return;
  }

  const url = `${supabaseUrl}/functions/v1/ai-chat`;
  console.log(`[ai-stream] Starting request to ${url}`);

  return new Promise<void>((resolve) => {
    const xhr = new XMLHttpRequest();
    let buffer = '';
    let lastProcessedLength = 0;
    let progressCount = 0;

    // Handle abort signal
    const onAbort = () => {
      console.log('[ai-stream] Aborted by signal');
      xhr.abort();
      resolve();
    };
    signal?.addEventListener('abort', onAbort);

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);

    xhr.onreadystatechange = () => {
      console.log(`[ai-stream] readyState: ${xhr.readyState}, status: ${xhr.status}`);
    };

    xhr.onprogress = () => {
      progressCount++;
      // responseText accumulates — process only the new data
      const newData = xhr.responseText.slice(lastProcessedLength);
      console.log(`[ai-stream] onprogress #${progressCount}, new data length: ${newData.length}, total: ${xhr.responseText.length}`);
      if (newData.length > 0) {
        console.log(`[ai-stream] raw chunk: ${newData.slice(0, 300)}`);
      }
      lastProcessedLength = xhr.responseText.length;
      buffer = parseSSEChunk(newData, buffer, callbacks);
    };

    xhr.onload = () => {
      console.log(`[ai-stream] onload — status: ${xhr.status}, total progress events: ${progressCount}, response length: ${xhr.responseText.length}`);
      if (xhr.status >= 400) {
        console.error(`[ai-stream] HTTP error ${xhr.status}:`, xhr.responseText.slice(0, 500));
        callbacks.onError(`Request failed (${xhr.status})`);
      } else {
        // Process any remaining buffered data
        if (buffer.trim()) {
          console.log(`[ai-stream] Processing remaining buffer: ${buffer.slice(0, 200)}`);
          parseSSEChunk('\n\n', buffer, callbacks);
        }
      }
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };

    xhr.onerror = () => {
      console.error('[ai-stream] XHR error event fired');
      signal?.removeEventListener('abort', onAbort);
      callbacks.onError('Network error');
      resolve();
    };

    xhr.ontimeout = () => {
      console.error('[ai-stream] XHR timeout');
      signal?.removeEventListener('abort', onAbort);
      callbacks.onError('Request timed out');
      resolve();
    };

    xhr.timeout = 60000;
    xhr.send(JSON.stringify({ messages, context: ctx }));
    console.log('[ai-stream] Request sent');
  });
}
