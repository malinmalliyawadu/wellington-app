import React, { useMemo } from "react";
import { Polygon } from "react-native-maps";
import { useExploration } from "../context/ExplorationContext";
import { Place } from "../types";

interface ExplorationOverlayProps {
  places: Place[];
  visible: boolean;
}

const GRID_SIZE = 400; // meters - size of each square

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

export function ExplorationOverlay({
  places,
  visible,
}: ExplorationOverlayProps) {
  const { isExplored } = useExploration();

  // Create explored places list for distance checks
  const exploredPlaces = useMemo(() => {
    return places.filter((place) => isExplored(place.id));
  }, [places, isExplored]);

  // Create a square grid of potential fog positions
  const fogGrid = useMemo(() => {
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

    for (let lat = latMin; lat <= latMax; lat += latSpacing) {
      for (let lng = lngMin; lng <= lngMax; lng += lngSpacing) {
        // Check if this square should have fog
        // Only render fog if NO explored place is within the square
        const hasExploredNearby = exploredPlaces.some((place) => {
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
  }, [exploredPlaces]);

  if (!visible) return null;

  return (
    <>
      {/* Render fog squares only in grid cells without explored places */}
      {fogGrid.map((cell) => (
        <Polygon
          key={`fog-${cell.key}`}
          coordinates={getSquareVertices(
            cell.latitude,
            cell.longitude,
            GRID_SIZE
          )}
          fillColor="rgba(0, 0, 0, 0.6)"
          zIndex={100}
        />
      ))}
    </>
  );
}
