import { supabase } from '../lib/supabase';
import type { Guide, GuidePlace } from '../types';

export async function getGuides(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const guides = (data ?? []).map(mapGuide);

  // Batch-fetch place counts
  if (guides.length > 0) {
    const guideIds = guides.map((g) => g.id);
    const { data: placeRows } = await supabase
      .from('guide_places')
      .select('guide_id')
      .in('guide_id', guideIds);

    if (placeRows) {
      const countMap = new Map<string, number>();
      for (const row of placeRows) {
        countMap.set(row.guide_id, (countMap.get(row.guide_id) ?? 0) + 1);
      }
      for (const guide of guides) {
        guide.placeCount = countMap.get(guide.id) ?? 0;
      }
    }
  }

  return guides;
}

export async function getGuidesByUserId(userId: string): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const guides = (data ?? []).map(mapGuide);

  // Batch-fetch place counts
  if (guides.length > 0) {
    const guideIds = guides.map((g) => g.id);
    const { data: placeRows } = await supabase
      .from('guide_places')
      .select('guide_id')
      .in('guide_id', guideIds);

    if (placeRows) {
      const countMap = new Map<string, number>();
      for (const row of placeRows) {
        countMap.set(row.guide_id, (countMap.get(row.guide_id) ?? 0) + 1);
      }
      for (const guide of guides) {
        guide.placeCount = countMap.get(guide.id) ?? 0;
      }
    }
  }

  return guides;
}

export async function getGuideById(guideId: string): Promise<Guide | null> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('id', guideId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const guide = mapGuide(data);

  // Get place count
  const { count } = await supabase
    .from('guide_places')
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', guideId);

  guide.placeCount = count ?? 0;

  return guide;
}

export async function getGuidePlaces(guideId: string): Promise<GuidePlace[]> {
  const { data, error } = await supabase
    .from('guide_places')
    .select('*')
    .eq('guide_id', guideId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapGuidePlace);
}

export async function getGuidesByIds(ids: string[]): Promise<Guide[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .in('id', ids);

  if (error) throw error;

  const guides = (data ?? []).map(mapGuide);

  // Batch-fetch place counts
  if (guides.length > 0) {
    const guideIds = guides.map((g) => g.id);
    const { data: placeRows } = await supabase
      .from('guide_places')
      .select('guide_id')
      .in('guide_id', guideIds);

    if (placeRows) {
      const countMap = new Map<string, number>();
      for (const row of placeRows) {
        countMap.set(row.guide_id, (countMap.get(row.guide_id) ?? 0) + 1);
      }
      for (const guide of guides) {
        guide.placeCount = countMap.get(guide.id) ?? 0;
      }
    }
  }

  return guides;
}

export async function createGuide(params: {
  userId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
}): Promise<Guide> {
  const { data, error } = await supabase
    .from('guides')
    .insert({
      user_id: params.userId,
      title: params.title,
      description: params.description ?? null,
      cover_image_url: params.coverImageUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...mapGuide(data), placeCount: 0 };
}

export async function updateGuide(
  guideId: string,
  params: {
    title?: string;
    description?: string;
    coverImageUrl?: string;
  }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined) updates.description = params.description;
  if (params.coverImageUrl !== undefined) updates.cover_image_url = params.coverImageUrl;

  const { error } = await supabase
    .from('guides')
    .update(updates)
    .eq('id', guideId);

  if (error) throw error;
}

export async function deleteGuide(guideId: string): Promise<void> {
  const { error } = await supabase
    .from('guides')
    .delete()
    .eq('id', guideId);

  if (error) throw error;
}

export async function addPlaceToGuide(
  guideId: string,
  placeId: string,
  sortOrder: number,
  note?: string
): Promise<void> {
  const { error } = await supabase
    .from('guide_places')
    .insert({
      guide_id: guideId,
      place_id: placeId,
      sort_order: sortOrder,
      note: note ?? null,
    });

  if (error) throw error;

  // Touch guide updated_at
  await supabase
    .from('guides')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', guideId);
}

export async function removePlaceFromGuide(guideId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('guide_places')
    .delete()
    .eq('guide_id', guideId)
    .eq('place_id', placeId);

  if (error) throw error;

  // Touch guide updated_at
  await supabase
    .from('guides')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', guideId);
}

export async function updateGuidePlace(
  guideId: string,
  placeId: string,
  params: { sortOrder?: number; note?: string }
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (params.sortOrder !== undefined) updates.sort_order = params.sortOrder;
  if (params.note !== undefined) updates.note = params.note;

  const { error } = await supabase
    .from('guide_places')
    .update(updates)
    .eq('guide_id', guideId)
    .eq('place_id', placeId);

  if (error) throw error;
}

function mapGuide(row: {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}): Guide {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    placeCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGuidePlace(row: {
  guide_id: string;
  place_id: string;
  sort_order: number;
  note: string | null;
  added_at: string;
}): GuidePlace {
  return {
    guideId: row.guide_id,
    placeId: row.place_id,
    sortOrder: row.sort_order,
    note: row.note ?? undefined,
    addedAt: row.added_at,
  };
}
