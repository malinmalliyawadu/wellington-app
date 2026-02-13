export type PlaceCategory = 'cafe' | 'restaurant' | 'bar' | 'attraction' | 'park' | 'venue';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  rating?: number;
  userRatingsTotal?: number;
}
