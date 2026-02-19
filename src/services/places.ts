import { supabase } from '../lib/supabase';
import type { Place } from '../types';

export async function getPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data ?? []).map(mapPlace);
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapPlace(data);
}

export async function createPlace(place: Omit<Place, 'id'>): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .insert({
      name: place.name,
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      google_place_id: place.googlePlaceId,
    })
    .select()
    .single();

  if (error) throw error;

  return mapPlace(data);
}

export async function getPlacesByIds(ids: string[]): Promise<Place[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('places')
    .select('*')
    .in('id', ids);

  if (error) throw error;
  return (data ?? []).map(mapPlace);
}

export async function findOrCreatePlace(place: Omit<Place, 'id'>): Promise<Place> {
  // First, check if we have a Google Place ID and if it already exists
  if (place.googlePlaceId) {
    const { data: existingPlace, error: searchError } = await supabase
      .from('places')
      .select('*')
      .eq('google_place_id', place.googlePlaceId)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingPlace) {
      return mapPlace(existingPlace);
    }
  }

  // No Google Place ID match found, create a new place
  return createPlace(place);
}

function mapPlace(row: {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  google_place_id?: string;
}): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Place['category'],
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    googlePlaceId: row.google_place_id,
  };
}
