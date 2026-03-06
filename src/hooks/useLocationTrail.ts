import { useEffect, useRef, useCallback, useState } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TrailPoint } from "../lib/fogRenderer";

const STORAGE_KEY = "fog_trail_points";
const MIN_DISTANCE_METERS = 30; // Only record a point if moved this far
const MAX_TRAIL_POINTS = 5000; // Cap to prevent unbounded growth
const SAVE_DEBOUNCE_MS = 10_000; // Persist to storage every 10s at most

/**
 * Calculate approximate distance between two points in meters.
 * Uses equirectangular approximation (fast, accurate enough at city scale).
 */
function quickDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const avgLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const x = dLng * Math.cos(avgLat);
  return Math.sqrt(x * x + dLat * dLat) * 6_371_000;
}

/**
 * Simplify a trail by removing points that are very close together.
 * Simple distance-based decimation — keeps every point that is at least
 * `minDistance` from the last kept point.
 */
function simplifyTrail(
  points: TrailPoint[],
  minDistanceMeters: number
): TrailPoint[] {
  if (points.length <= 1) return points;

  const simplified: TrailPoint[] = [points[0]];
  let last = points[0];

  for (let i = 1; i < points.length; i++) {
    const dist = quickDistance(
      last.latitude,
      last.longitude,
      points[i].latitude,
      points[i].longitude
    );
    if (dist >= minDistanceMeters) {
      simplified.push(points[i]);
      last = points[i];
    }
  }

  return simplified;
}

interface UseLocationTrailOptions {
  /** Whether to actively track location */
  enabled: boolean;
  /** Minimum distance in meters between recorded points */
  minDistance?: number;
}

interface UseLocationTrailResult {
  /** The current trail of GPS points */
  trail: TrailPoint[];
  /** Whether the trail has been loaded from storage */
  isLoaded: boolean;
  /** Manually add a point (e.g., when visiting a place) */
  addPoint: (lat: number, lng: number) => void;
  /** Clear all trail data */
  clearTrail: () => Promise<void>;
}

export function useLocationTrail({
  enabled,
  minDistance = MIN_DISTANCE_METERS,
}: UseLocationTrailOptions): UseLocationTrailResult {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const trailRef = useRef<TrailPoint[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointRef = useRef<TrailPoint | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    trailRef.current = trail;
  }, [trail]);

  // Load persisted trail on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const points: TrailPoint[] = JSON.parse(stored);
          // Simplify on load in case old data has too-dense points
          const simplified = simplifyTrail(points, minDistance);
          setTrail(simplified);
          trailRef.current = simplified;
          if (simplified.length > 0) {
            lastPointRef.current = simplified[simplified.length - 1];
          }
        }
      } catch (error) {
        console.error("[useLocationTrail] Failed to load trail:", error);
      } finally {
        setIsLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to AsyncStorage
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) return; // Already scheduled

    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(trailRef.current)
        );
      } catch (error) {
        console.error("[useLocationTrail] Failed to save trail:", error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Add a point if it's far enough from the last one
  const addPoint = useCallback(
    (latitude: number, longitude: number) => {
      const last = lastPointRef.current;

      if (last) {
        const dist = quickDistance(
          last.latitude,
          last.longitude,
          latitude,
          longitude
        );
        if (dist < minDistance) return; // Too close, skip
      }

      const point: TrailPoint = { latitude, longitude };
      lastPointRef.current = point;

      setTrail((prev) => {
        const next = [...prev, point];
        // Cap trail length — drop oldest points
        if (next.length > MAX_TRAIL_POINTS) {
          return next.slice(next.length - MAX_TRAIL_POINTS);
        }
        return next;
      });

      scheduleSave();
    },
    [minDistance, scheduleSave]
  );

  // Watch location
  useEffect(() => {
    if (!enabled || !isLoaded) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: minDistance, // OS-level filter to reduce callbacks
          timeInterval: 5_000,
        },
        (location) => {
          addPoint(location.coords.latitude, location.coords.longitude);
        }
      );
    })();

    return () => {
      subscription?.remove();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // Final save on cleanup
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(trailRef.current)
        ).catch(() => {});
      }
    };
  }, [enabled, isLoaded, addPoint, minDistance]);

  const clearTrail = useCallback(async () => {
    setTrail([]);
    trailRef.current = [];
    lastPointRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { trail, isLoaded, addPoint, clearTrail };
}
