import React, { useMemo } from "react";
import { Polygon, Region } from "react-native-maps";
import { useExploration } from "../context/ExplorationContext";
import { Place } from "../types";

interface ExplorationOverlayProps {
  places: Place[];
  visible: boolean;
  mapRegion?: Region;
}

const GRID_SIZE = 1600; // meters - size of each square (drastically increased for stability)
const MAX_POLYGONS = 50; // Hard cap on rendered polygons to prevent crashes

// Calculate distance between two lat/lng points in meters
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Memoization cache for square vertices
const verticesCache = new Map<
  string,
  Array<{ latitude: number; longitude: number }>
>();

// Generate square vertices around a center point (memoized)
function getSquareVertices(
  centerLat: number,
  centerLng: number,
  sizeMeters: number
): Array<{ latitude: number; longitude: number }> {
  // Create cache key
  const cacheKey = `${centerLat.toFixed(6)},${centerLng.toFixed(
    6
  )},${sizeMeters}`;

  // Check cache first
  const cached = verticesCache.get(cacheKey);
  if (cached) return cached;

  // Convert half size from meters to degrees
  const halfLatSize = sizeMeters / 2 / 111000; // 1 degree latitude ≈ 111km
  const halfLngSize =
    sizeMeters / 2 / (111000 * Math.cos((centerLat * Math.PI) / 180));

  // Calculate 4 corners of the square
  const vertices = [
    { latitude: centerLat - halfLatSize, longitude: centerLng - halfLngSize }, // SW
    { latitude: centerLat - halfLatSize, longitude: centerLng + halfLngSize }, // SE
    { latitude: centerLat + halfLatSize, longitude: centerLng + halfLngSize }, // NE
    { latitude: centerLat + halfLatSize, longitude: centerLng - halfLngSize }, // NW
  ];

  // Cache the result
  verticesCache.set(cacheKey, vertices);

  return vertices;
}

export const ExplorationOverlay = React.memo(
  function ExplorationOverlay({
    places,
    visible,
    mapRegion,
  }: ExplorationOverlayProps) {
    const { exploredPlaceIds } = useExploration();

    // Create explored places list for distance checks
    // Only depends on exploredPlaceIds, not on every render
    const exploredPlaces = useMemo(() => {
      if (!visible) return [];
      const exploredSet = new Set(exploredPlaceIds);
      return places.filter((place) => exploredSet.has(place.id));
    }, [places, exploredPlaceIds, visible]);

    // Create a stable cache key based on explored places
    const cacheKey = useMemo(
      () => exploredPlaceIds.slice().sort().join(","),
      [exploredPlaceIds]
    );

    // Create a square grid of potential fog positions
    // This is expensive, so we cache it based on explored places
    const fogGrid = useMemo(() => {
      // Only calculate grid if visible
      if (!visible) return [];

      if (__DEV__) {
        console.log(
          "[ExplorationOverlay] Recalculating fog grid, explored places:",
          exploredPlaceIds.length
        );
      }

      try {
        const grid = [];
        const latMin = -41.32;
        const latMax = -41.24;
        const lngMin = 174.75;
        const lngMax = 174.82;

        // Average latitude for longitude scaling
        const avgLat = (latMin + latMax) / 2;

        // Grid spacing - convert meters to degrees
        const latSpacing = GRID_SIZE / 111000;
        const lngSpacing =
          GRID_SIZE / (111000 * Math.cos((avgLat * Math.PI) / 180));

        // Pre-calculate max difference for bounding box optimization
        const maxDiffDegrees = (GRID_SIZE * 0.71) / 111000;

        for (let lat = latMin; lat <= latMax; lat += latSpacing) {
          for (let lng = lngMin; lng <= lngMax; lng += lngSpacing) {
            // Check if this square should have fog
            // Only render fog if NO explored place is within the square
            const hasExploredNearby = exploredPlaces.some((place) => {
              // Quick bounding box check before expensive distance calculation
              const latDiff = Math.abs(place.latitude - lat);
              const lngDiff = Math.abs(place.longitude - lng);

              // If outside bounding box, skip expensive Haversine calculation
              if (latDiff > maxDiffDegrees || lngDiff > maxDiffDegrees) {
                return false;
              }

              // Only calculate precise distance if within bounding box
              const distance = calculateDistance(
                lat,
                lng,
                place.latitude,
                place.longitude
              );
              // Check if place is within the square's radius
              return distance <= GRID_SIZE * 0.71; // sqrt(2)/2 for diagonal reach
            });

            // Only add to grid if this cell should be fogged
            if (!hasExploredNearby) {
              grid.push({
                latitude: lat,
                longitude: lng,
                key: `${lat.toFixed(5)}-${lng.toFixed(5)}`,
              });
            }
          }
        }
        return grid;
      } catch (error) {
        console.error("Error calculating fog grid:", error);
        return [];
      }
    }, [exploredPlaces, cacheKey, visible]); // cacheKey ensures stable memoization

    // Only render fog squares visible in current map region (performance optimization)
    const visibleFogGrid = useMemo(() => {
      try {
        if (!mapRegion) return fogGrid.slice(0, MAX_POLYGONS);

        const { latitude, longitude, latitudeDelta, longitudeDelta } =
          mapRegion;

        // Add buffer to viewport to reduce recalculations when panning
        const buffer = 0.5;
        const minLat = latitude - latitudeDelta * (1 + buffer);
        const maxLat = latitude + latitudeDelta * (1 + buffer);
        const minLng = longitude - longitudeDelta * (1 + buffer);
        const maxLng = longitude + longitudeDelta * (1 + buffer);

        const filtered = fogGrid.filter((cell) => {
          return (
            cell.latitude >= minLat &&
            cell.latitude <= maxLat &&
            cell.longitude >= minLng &&
            cell.longitude <= maxLng
          );
        });

        // Hard cap to prevent crashes - prioritize cells closest to center
        if (filtered.length > MAX_POLYGONS) {
          return filtered
            .sort((a, b) => {
              const distA =
                Math.abs(a.latitude - latitude) +
                Math.abs(a.longitude - longitude);
              const distB =
                Math.abs(b.latitude - latitude) +
                Math.abs(b.longitude - longitude);
              return distA - distB;
            })
            .slice(0, MAX_POLYGONS);
        }

        return filtered;
      } catch (error) {
        console.error("Error filtering visible fog grid:", error);
        return [];
      }
    }, [fogGrid, mapRegion]);

    // Early return after all hooks (Rules of Hooks)
    if (!visible) return null;

    // Debug logging
    if (__DEV__) {
      console.log(
        `[ExplorationOverlay] Rendering ${visibleFogGrid.length} fog polygons`
      );
    }

    // Safety check - if somehow we still have too many, don't render
    if (visibleFogGrid.length > MAX_POLYGONS) {
      console.warn(
        `[ExplorationOverlay] Too many polygons (${visibleFogGrid.length}), skipping render`
      );
      return null;
    }

    return (
      <>
        {/* Render fog squares only in grid cells without explored places */}
        {visibleFogGrid.map((cell) => (
          <Polygon
            key={`fog-${cell.key}`}
            coordinates={getSquareVertices(
              cell.latitude,
              cell.longitude,
              GRID_SIZE
            )}
            fillColor="rgba(0, 0, 0, 0.6)"
            strokeWidth={1}
            zIndex={100}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if visible state changes or places array changes
    return (
      prevProps.visible === nextProps.visible &&
      prevProps.places === nextProps.places &&
      prevProps.mapRegion?.latitude === nextProps.mapRegion?.latitude &&
      prevProps.mapRegion?.longitude === nextProps.mapRegion?.longitude
    );
  }
);
