import { useRef, useCallback } from "react";
import { Animated } from "react-native";

const APPEAR_STAGGER_MS = 30;

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
      const delay = appearQueue.current * APPEAR_STAGGER_MS;
      appearQueue.current += 1;

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

  return { getMarkerScale, animateMarkerAppear, animateMarkerPress };
}
