import { useEffect } from "react";
import { useExploration } from "../context/ExplorationContext";
import { useToast } from "../context/ToastContext";
import { createAchievementToast } from "../utils/achievementHelpers";
import { Place } from "../types";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const EXPLORATION_RADIUS = 50; // meters — must be within 50m to explore

export function useExplorationTracking(
  userCoords: LocationCoords | null,
  places: Place[] | null,
  enabled: boolean
) {
  const { markExplored, isExplored } = useExploration();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userCoords || !places || !enabled) return;

    const checkNearbyPlaces = async () => {
      const { latitude, longitude } = userCoords;

      for (const place of places) {
        if (isExplored(place.id)) continue;

        // Haversine distance calculation
        const R = 6371000; // Earth's radius in meters
        const dLat = ((place.latitude - latitude) * Math.PI) / 180;
        const dLng = ((place.longitude - longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((place.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= EXPLORATION_RADIUS) {
          const newAchievements = await markExplored(place.id, "viewed");
          if (newAchievements.length > 0) {
            showToast(createAchievementToast(newAchievements[0]));
          }
        }
      }
    };

    checkNearbyPlaces();

    // Check periodically (every 30 seconds — throttled for performance)
    const interval = setInterval(checkNearbyPlaces, 30000);
    return () => clearInterval(interval);
  }, [userCoords, places, enabled, isExplored, markExplored, showToast]);
}
