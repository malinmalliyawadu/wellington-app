import { supabase } from '../lib/supabase';
import type { Trail, TrailDifficulty } from '../types';

export async function getTrails(): Promise<Trail[]> {
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data ?? []).map(mapTrail);
}

export async function getTrailById(id: string): Promise<Trail | null> {
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapTrail(data);
}

function mapTrail(row: {
  id: string;
  name: string;
  description: string;
  elevation: string;
  distance: string;
  duration: string;
  difficulty: string;
  highlights: any;
  trailhead: any;
  coordinates: any;
  place_id: string;
}): Trail {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    elevation: row.elevation,
    distance: row.distance,
    duration: row.duration,
    difficulty: row.difficulty as TrailDifficulty,
    highlights: row.highlights as string[],
    trailhead: row.trailhead as Trail['trailhead'],
    coordinates: row.coordinates as Trail['coordinates'],
    placeId: row.place_id,
  };
}
