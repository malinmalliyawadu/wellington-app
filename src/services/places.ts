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

function mapPlace(row: {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
}): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Place['category'],
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}
