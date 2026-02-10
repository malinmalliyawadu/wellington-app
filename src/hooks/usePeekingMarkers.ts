import { useMemo } from 'react';
import { Place, PlaceCategory } from '../types';
import { PlacePopularity, isFollowedPlace } from '../utils/placePopularity';

export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface PeekingMarker {
  place: Place;
  edge: Edge;
  edgePosition: number; // 0-1 position along the edge
  size: number;
  category: PlaceCategory;
  postCount: number;
  isFollowed: boolean;
  posterCount: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapDimensions {
  width: number;
  height: number;
}

const MAX_PEEKING_MARKERS = 6;
const BUFFER_FACTOR = 0.5;
const MIN_EDGE_GAP = 0.12; // minimum gap between markers along an edge (0-1)

export function usePeekingMarkers(
  filteredPlaces: Place[],
  popularityMap: Map<string, PlacePopularity>,
  followingIds: string[],
  region: Region | null,
  mapDimensions: MapDimensions | null,
): PeekingMarker[] {
  return useMemo(() => {
    if (!region || !mapDimensions || mapDimensions.width === 0 || mapDimensions.height === 0) {
      return [];
    }

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    // Viewport bounds
    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;

    // Buffer zone extends beyond viewport
    const latBuffer = latitudeDelta * BUFFER_FACTOR;
    const lngBuffer = longitudeDelta * BUFFER_FACTOR;

    const bufferNorth = north + latBuffer;
    const bufferSouth = south - latBuffer;
    const bufferEast = east + lngBuffer;
    const bufferWest = west - lngBuffer;

    const candidates: {
      place: Place;
      edge: Edge;
      edgePosition: number;
      score: number;
      popularity: PlacePopularity | undefined;
    }[] = [];

    for (const place of filteredPlaces) {
      const { latitude: lat, longitude: lng } = place;

      // Skip if inside viewport
      if (lat >= south && lat <= north && lng >= west && lng <= east) {
        continue;
      }

      // Skip if outside buffer zone
      if (lat < bufferSouth || lat > bufferNorth || lng < bufferWest || lng > bufferEast) {
        continue;
      }

      const popularity = popularityMap.get(place.id);
      const score = popularity?.score ?? 1;

      // Determine nearest edge by normalized distance
      const distTop = (lat - north) / latitudeDelta;
      const distBottom = (south - lat) / latitudeDelta;
      const distRight = (lng - east) / longitudeDelta;
      const distLeft = (west - lng) / longitudeDelta;

      // Only consider edges where the place is beyond the viewport
      const edgeDistances: { edge: Edge; dist: number }[] = [];
      if (distTop > 0) edgeDistances.push({ edge: 'top', dist: distTop });
      if (distBottom > 0) edgeDistances.push({ edge: 'bottom', dist: distBottom });
      if (distRight > 0) edgeDistances.push({ edge: 'right', dist: distRight });
      if (distLeft > 0) edgeDistances.push({ edge: 'left', dist: distLeft });

      if (edgeDistances.length === 0) continue;

      // Pick the edge with smallest distance
      edgeDistances.sort((a, b) => a.dist - b.dist);
      const nearestEdge = edgeDistances[0].edge;

      // Compute position along the edge (0-1)
      let edgePosition: number;
      if (nearestEdge === 'top' || nearestEdge === 'bottom') {
        // Map longitude to horizontal position
        edgePosition = (lng - west) / longitudeDelta;
      } else {
        // Map latitude to vertical position (inverted: north=0, south=1)
        edgePosition = (north - lat) / latitudeDelta;
      }

      // Clamp to visible range with padding
      edgePosition = Math.max(0.05, Math.min(0.95, edgePosition));

      candidates.push({ place, edge: nearestEdge, edgePosition, score, popularity });
    }

    // Sort by popularity score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    // Take top candidates, then deduplicate overlapping positions per edge
    const selected: typeof candidates = [];

    for (const candidate of candidates) {
      if (selected.length >= MAX_PEEKING_MARKERS) break;

      // Check for overlap with already-selected markers on the same edge
      const hasOverlap = selected.some(
        (s) =>
          s.edge === candidate.edge &&
          Math.abs(s.edgePosition - candidate.edgePosition) < MIN_EDGE_GAP,
      );

      if (!hasOverlap) {
        selected.push(candidate);
      }
    }

    return selected.map(({ place, edge, edgePosition, popularity }) => {
      const posterIds = popularity?.posterIds ?? [];
      return {
        place,
        edge,
        edgePosition,
        size: 28,
        category: place.category,
        postCount: popularity?.postCount ?? 0,
        isFollowed: isFollowedPlace(posterIds, followingIds),
        posterCount: posterIds.length,
      };
    });
  }, [filteredPlaces, popularityMap, followingIds, region, mapDimensions]);
}
