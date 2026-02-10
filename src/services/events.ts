import { supabase } from '../lib/supabase';
import type { Event } from '../types';

export async function getUpcomingEvents(): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true });

  if (error) throw error;

  const events = (data ?? []).map(mapEvent);

  // Batch-fetch all attendees for these events
  if (events.length > 0) {
    const eventIds = events.map((e) => e.id);
    const { data: attendeeRows } = await supabase
      .from('event_attendees')
      .select('event_id, user_id')
      .in('event_id', eventIds);

    if (attendeeRows) {
      const attendeeMap = new Map<string, string[]>();
      for (const row of attendeeRows) {
        const list = attendeeMap.get(row.event_id) ?? [];
        list.push(row.user_id);
        attendeeMap.set(row.event_id, list);
      }
      for (const event of events) {
        event.attendeeIds = attendeeMap.get(event.id) ?? [];
      }
    }
  }

  return events;
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapEvent(data);
}

export async function getEventAttendees(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select('user_id')
    .eq('event_id', eventId);

  if (error) throw error;
  return (data ?? []).map((row) => row.user_id);
}

export async function toggleAttendance(eventId: string, userId: string): Promise<boolean> {
  // Check if already attending
  const { data: existing } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    if (error) throw error;
    return false; // no longer attending
  } else {
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId });
    if (error) throw error;
    return true; // now attending
  }
}

function mapEvent(row: {
  id: string;
  title: string;
  description: string;
  place_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  category: string;
  ticket_url: string | null;
  created_at: string;
}): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    placeId: row.place_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    imageUrl: row.image_url ?? undefined,
    category: row.category as Event['category'],
    ticketUrl: row.ticket_url ?? undefined,
  };
}
