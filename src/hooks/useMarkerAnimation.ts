import { useRef, useCallback } from "react";
import { Animated } from "react-native";

export function useMarkerAnimation() {
  const markerScales = useRef(new Map<string, Animated.Value>()).current;

  const getMarkerScale = useCallback(
    (placeId: string) => {
      if (!markerScales.has(placeId)) {
        markerScales.set(placeId, new Animated.Value(1));
      }
      return markerScales.get(placeId)!;
    },
    [markerScales]
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

  return { getMarkerScale, animateMarkerPress };
}
