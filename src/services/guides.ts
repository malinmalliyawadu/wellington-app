import { supabase } from '../lib/supabase';
import { getTopPostMediaForPlaces } from './posts';
import type { Guide, GuidePlace, GuideWithPlaces } from '../types';

/** Enrich guides with place counts and first-place cover images. */
async function enrichGuides(guides: Guide[]): Promise<Guide[]> {
  if (guides.length === 0) return guides;

  const guideIds = guides.map((g) => g.id);

  // Fetch guide_places rows for counts and first place per guide
  const { data: placeRows } = await supabase
    .from('guide_places')
    .select('guide_id, place_id, sort_order')
    .in('guide_id', guideIds)
    .order('sort_order', { ascending: true });

  if (!placeRows) return guides;

  const countMap = new Map<string, number>();
  const firstPlaceMap = new Map<string, string>();
  for (const row of placeRows) {
    countMap.set(row.guide_id, (countMap.get(row.guide_id) ?? 0) + 1);
    if (!firstPlaceMap.has(row.guide_id)) {
      firstPlaceMap.set(row.guide_id, row.place_id);
    }
  }

  // Fetch top post media for all first-place IDs
  const firstPlaceIds = [...new Set(firstPlaceMap.values())];
  const mediaMap = await getTopPostMediaForPlaces(firstPlaceIds);

  for (const guide of guides) {
    guide.placeCount = countMap.get(guide.id) ?? 0;
    const firstPlaceId = firstPlaceMap.get(guide.id);
    if (firstPlaceId) {
      const media = mediaMap.get(firstPlaceId);
      if (media) {
        guide.firstPlaceImageUrl = media.thumbnailUrl ?? media.mediaUrl;
      }
    }
  }

  return guides;
}

export async function getFeedGuides(
  followingIds: string[],
  currentUserId?: string
): Promise<Guide[]> {
  const userIds = currentUserId
    ? [...new Set([...followingIds, currentUserId])]
    : followingIds;
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return enrichGuides((data ?? []).map(mapGuide));
}

export async function getGuides(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return enrichGuides((data ?? []).map(mapGuide));
}

export async function getGuidesByUserId(userId: string): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return enrichGuides((data ?? []).map(mapGuide));
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

export interface GuidePlacePreview {
  placeId: string;
  name: string;
  category: string;
  imageUrl?: string;
}

export async function getGuidePlacePreviews(guideId: string): Promise<GuidePlacePreview[]> {
  const { data } = await supabase
    .from('guide_places')
    .select('place_id, places(name, category)')
    .eq('guide_id', guideId)
    .order('sort_order', { ascending: true })
    .limit(6);

  if (!data || data.length === 0) return [];

  const placeIds = data.map((r) => r.place_id);
  const mediaMap = await getTopPostMediaForPlaces(placeIds);

  const results: GuidePlacePreview[] = [];
  for (const row of data) {
    const place = row.places as unknown as { name: string; category: string } | null;
    if (!place) continue;
    const media = mediaMap.get(row.place_id);
    results.push({
      placeId: row.place_id,
      name: place.name,
      category: place.category,
      imageUrl: media?.thumbnailUrl ?? media?.mediaUrl,
    });
  }
  return results;
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
  return enrichGuides((data ?? []).map(mapGuide));
}

export async function getGuidesWithPlaces(): Promise<GuideWithPlaces[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const guides = (data ?? []).map(mapGuide);
  if (guides.length === 0) return [];

  const guideIds = guides.map((g) => g.id);

  // Fetch guide_places joined with places for name/category
  const { data: gpRows } = await supabase
    .from('guide_places')
    .select('guide_id, place_id, note, sort_order, places(name, category)')
    .in('guide_id', guideIds)
    .order('sort_order', { ascending: true });

  // Fetch creator profiles
  const userIds = [...new Set(guides.map((g) => g.userId))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.display_name) profileMap.set(p.id, p.display_name);
  }

  // Group place details by guide
  const guidePlacesMap = new Map<string, { name: string; category: string; note?: string }[]>();
  const countMap = new Map<string, number>();
  for (const row of gpRows ?? []) {
    countMap.set(row.guide_id, (countMap.get(row.guide_id) ?? 0) + 1);
    const place = row.places as unknown as { name: string; category: string } | null;
    if (place) {
      const arr = guidePlacesMap.get(row.guide_id) ?? [];
      arr.push({
        name: place.name,
        category: place.category,
        note: row.note ?? undefined,
      });
      guidePlacesMap.set(row.guide_id, arr);
    }
  }

  return guides.map((g) => ({
    ...g,
    placeCount: countMap.get(g.id) ?? 0,
    creatorName: profileMap.get(g.userId),
    places: guidePlacesMap.get(g.id) ?? [],
  }));
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
  return { ...mapGuide(data), placeCount: 0, likes: 0 };
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
  likes: number | null;
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
    likes: row.likes ?? 0,
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
