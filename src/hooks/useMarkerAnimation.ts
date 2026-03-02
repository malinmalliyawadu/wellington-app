import { useRef, useCallback } from "react";
import { Animated } from "react-native";

const APPEAR_STAGGER_MS = 30;
// When this many markers appear at once, skip stagger and show them immediately
// to avoid queuing hundreds of timeouts
const BATCH_THRESHOLD = 20;

export function useMarkerAnimation() {
  const markerScales = useRef(new Map<string, Animated.Value>()).current;
  const appearedMarkers = useRef(new Set<string>()).current;
  const appearQueue = useRef(0);

  const getMarkerScale = useCallback(
    (placeId: string) => {
      if (!markerScales.has(placeId)) {
        markerScales.set(placeId, new Animated.Value(0));
      }
      return markerScales.get(placeId)!;
    },
    [markerScales]
  );

  const animateMarkerAppear = useCallback(
    (placeId: string) => {
      if (appearedMarkers.has(placeId)) return;
      appearedMarkers.add(placeId);

      const scale = getMarkerScale(placeId);
      const queuePosition = appearQueue.current;
      appearQueue.current += 1;

      // If too many markers are appearing at once, show them immediately
      if (queuePosition >= BATCH_THRESHOLD) {
        scale.setValue(1);
        appearQueue.current = Math.max(0, appearQueue.current - 1);
        return;
      }

      const delay = queuePosition * APPEAR_STAGGER_MS;

      setTimeout(() => {
        appearQueue.current = Math.max(0, appearQueue.current - 1);
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 15,
        }).start();
      }, delay);
    },
    [getMarkerScale, appearedMarkers]
  );

  /** Remove scale entries for markers no longer on the map */
  const pruneMarkers = useCallback(
    (activePlaceIds: Set<string>) => {
      for (const id of markerScales.keys()) {
        if (!activePlaceIds.has(id)) {
          markerScales.delete(id);
          appearedMarkers.delete(id);
        }
      }
    },
    [markerScales, appearedMarkers]
  );

  const animateMarkerPress = useCallback(
    (placeId: string) => {
      const scale = getMarkerScale(placeId);

      Animated.sequence([
        Animated.spring(scale, {
          toValue: 0.85,
          useNativeDriver: true,
          speed: 5000,
          bounciness: 0,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 3000,
          bounciness: 8,
        }),
      ]).start();
    },
    [getMarkerScale]
  );

  return { getMarkerScale, animateMarkerAppear, animateMarkerPress, pruneMarkers };
}
