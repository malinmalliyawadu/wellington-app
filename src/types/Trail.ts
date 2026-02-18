export type TrailDifficulty = 'easy' | 'moderate' | 'hard';

export interface Trail {
  id: string;
  name: string;
  description: string;
  elevation: string;
  distance: string;
  duration: string;
  difficulty: TrailDifficulty;
  highlights: string[];
  trailhead: { latitude: number; longitude: number; label: string };
  coordinates: { latitude: number; longitude: number }[];
  placeId: string;
}
