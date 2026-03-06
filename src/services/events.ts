import { supabase } from '../lib/supabase';
import type { Event, EventCategory } from '../types';

export async function getUpcomingEvents(): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .order('ai_score', { ascending: false, nullsFirst: false })
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

const EVENTS_PAGE_SIZE = 20;

export async function getUpcomingEventsPaginated(params: {
  offset: number;
  limit?: number;
  dateRange?: { start: string; end: string };
  categories?: EventCategory[];
  freeOnly?: boolean;
  followingUserIds?: string[];
}): Promise<{ events: Event[]; hasMore: boolean }> {
  const limit = params.limit ?? EVENTS_PAGE_SIZE;

  let query = supabase.from('events').select('*');

  // Date filter
  if (params.dateRange) {
    query = query
      .gte('date', params.dateRange.start)
      .lte('date', params.dateRange.end);
  } else {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('date', today);
  }

  // Category filter
  if (params.categories && params.categories.length > 0) {
    query = query.in('category', params.categories);
  }

  // Free-only filter
  if (params.freeOnly) {
    query = query.or('price.is.null,price.eq.0');
  }

  // Following-only filter: pre-fetch event IDs attended by followed users
  if (params.followingUserIds && params.followingUserIds.length > 0) {
    const { data: attendedRows } = await supabase
      .from('event_attendees')
      .select('event_id')
      .in('user_id', params.followingUserIds);

    const attendedEventIds = [
      ...new Set((attendedRows ?? []).map((r) => r.event_id)),
    ];
    if (attendedEventIds.length === 0) return { events: [], hasMore: false };
    query = query.in('id', attendedEventIds);
  }

  query = query
    .order('ai_score', { ascending: false, nullsFirst: false })
    .order('date', { ascending: true })
    .range(params.offset, params.offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  const events = (data ?? []).map(mapEvent);

  // Batch-fetch attendees for this page
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

  return { events, hasMore: events.length === limit };
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

export async function getEventsByUserId(userId: string): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];

  // Get event IDs the user is attending
  const { data: attendeeRows, error: attendeeError } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', userId);

  if (attendeeError) throw attendeeError;
  if (!attendeeRows || attendeeRows.length === 0) return [];

  const eventIds = attendeeRows.map((row) => row.event_id);

  // Get the actual events (only upcoming ones)
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .gte('date', today)
    .order('date', { ascending: true });

  if (error) throw error;

  const events = (data ?? []).map(mapEvent);

  // Batch-fetch all attendees for these events
  if (events.length > 0) {
    const fetchedEventIds = events.map((e) => e.id);
    const { data: allAttendeeRows } = await supabase
      .from('event_attendees')
      .select('event_id, user_id')
      .in('event_id', fetchedEventIds);

    if (allAttendeeRows) {
      const attendeeMap = new Map<string, string[]>();
      for (const row of allAttendeeRows) {
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

export async function getEventsByIds(ids: string[]): Promise<Event[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('id', ids);

  if (error) throw error;
  return (data ?? []).map(mapEvent);
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

export async function createEvent(params: {
  title: string;
  description: string;
  placeId: string;
  date: string;
  startTime: string;
  endTime?: string;
  imageUrl?: string;
  category: Event['category'];
  creatorId: string;
  price?: number | null;
}): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: params.title,
      description: params.description,
      place_id: params.placeId,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime ?? null,
      image_url: params.imageUrl ?? null,
      category: params.category,
      price: params.price ?? null,
      creator_id: params.creatorId,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-attend as creator
  await supabase
    .from('event_attendees')
    .insert({ event_id: data.id, user_id: params.creatorId });

  return mapEvent(data);
}

export async function updateEvent(
  eventId: string,
  params: {
    title?: string;
    description?: string;
    placeId?: string;
    date?: string;
    startTime?: string;
    endTime?: string | null;
    imageUrl?: string | null;
    category?: Event['category'];
    price?: number | null;
  }
): Promise<Event> {
  const updateData: Record<string, unknown> = {};
  if (params.title !== undefined) updateData.title = params.title;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.placeId !== undefined) updateData.place_id = params.placeId;
  if (params.date !== undefined) updateData.date = params.date;
  if (params.startTime !== undefined) updateData.start_time = params.startTime;
  if (params.endTime !== undefined) updateData.end_time = params.endTime;
  if (params.imageUrl !== undefined) updateData.image_url = params.imageUrl;
  if (params.category !== undefined) updateData.category = params.category;
  if (params.price !== undefined) updateData.price = params.price;

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return mapEvent(data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  // Delete attendees first (foreign key constraint)
  await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId);

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
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
  price: number | null;
  created_at: string;
  creator_id?: string | null;
  eventfinda_url?: string | null;
  ticketmaster_url?: string | null;
  humanitix_url?: string | null;
  eventbrite_url?: string | null;
  ai_score?: number | null;
  ai_description?: string | null;
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
    price: row.price,
    creatorId: row.creator_id ?? undefined,
    eventfindaUrl: row.eventfinda_url ?? undefined,
    ticketmasterUrl: row.ticketmaster_url ?? undefined,
    humanitixUrl: row.humanitix_url ?? undefined,
    eventbriteUrl: row.eventbrite_url ?? undefined,
    aiScore: row.ai_score ?? null,
    aiDescription: row.ai_description ?? null,
  };
}
