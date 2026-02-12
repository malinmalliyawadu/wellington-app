import { NativeModules } from 'react-native';
import type { Place } from '../types';

interface MapKitSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: Place['category'];
  phone?: string;
}

interface MapKitSearchModule {
  searchPlaces(
    query: string,
    latitude: number,
    longitude: number
  ): Promise<MapKitSearchResult[]>;
}

// Load the native module
const MapKitSearch = NativeModules.MapKitSearchModule as MapKitSearchModule;

// Wellington coordinates as default search center
const WELLINGTON_COORDS = {
  latitude: -41.2865,
  longitude: 174.7762,
};

export async function searchPlaces(
  query: string,
  latitude: number = WELLINGTON_COORDS.latitude,
  longitude: number = WELLINGTON_COORDS.longitude
): Promise<MapKitSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const results = await MapKitSearch.searchPlaces(query, latitude, longitude);
    return results;
  } catch (error) {
    console.error('MapKit search error:', error);
    return [];
  }
}
