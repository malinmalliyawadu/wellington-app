import React, { useMemo, useEffect, useState, useRef } from "react";
import { Overlay } from "react-native-maps";
import { useExploration } from "../context/ExplorationContext";
import { useLocationTrail } from "../hooks/useLocationTrail";
import { renderFogImage, FogBounds, ExploredPlace } from "../lib/fogRenderer";
import { Place } from "../types";

interface FogOfWarOverlayProps {
  places: Place[];
  visible: boolean;
}

/** Wellington coverage area — extend slightly beyond expected map bounds */
const FOG_BOUNDS: FogBounds = {
  latMin: -41.35,
  latMax: -41.2,
  lngMin: 174.7,
  lngMax: 174.87,
};

/** Image resolution. 512 ≈ 30m per pixel — good balance of quality vs speed */
const IMAGE_WIDTH = 512;
const IMAGE_HEIGHT = 512;

/** Minimum ms between fog re-renders to avoid thrashing */
const RENDER_DEBOUNCE_MS = 2_000;

export const FogOfWarOverlay = React.memo(function FogOfWarOverlay({
  places,
  visible,
}: FogOfWarOverlayProps) {
  const { exploredPlaceIds } = useExploration();
  const { trail, isLoaded } = useLocationTrail({ enabled: visible });
  const [fogImageUri, setFogImageUri] = useState<string | null>(null);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRenderKeyRef = useRef<string>("");

  // Build explored places list
  const exploredPlaces: ExploredPlace[] = useMemo(() => {
    if (!visible) return [];
    const exploredSet = new Set(exploredPlaceIds);
    return places
      .filter((p) => exploredSet.has(p.id))
      .map((p) => ({ latitude: p.latitude, longitude: p.longitude, id: p.id }));
  }, [places, exploredPlaceIds, visible]);

  // Render fog image when trail or explored places change (debounced)
  useEffect(() => {
    if (!visible || !isLoaded) return;

    // Create a key to detect meaningful changes
    // Trail: just use length + last point (re-renders when new points added)
    const lastTrailPt = trail.length > 0 ? trail[trail.length - 1] : null;
    const renderKey = [
      trail.length,
      lastTrailPt?.latitude.toFixed(5),
      lastTrailPt?.longitude.toFixed(5),
      exploredPlaceIds.length,
      ...exploredPlaceIds.slice().sort(),
    ].join("|");

    // Skip if nothing changed
    if (renderKey === lastRenderKeyRef.current) return;
    lastRenderKeyRef.current = renderKey;

    // Debounce rendering
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
    }

    renderTimerRef.current = setTimeout(() => {
      const base64 = renderFogImage(trail, exploredPlaces, {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        bounds: FOG_BOUNDS,
      });

      if (base64) {
        setFogImageUri(`data:image/png;base64,${base64}`);
      }

      if (__DEV__) {
        console.log(
          `[FogOfWar] Rendered fog: ${trail.length} trail pts, ${exploredPlaces.length} places`
        );
      }
    }, RENDER_DEBOUNCE_MS);

    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
    };
  }, [trail, exploredPlaces, visible, isLoaded, exploredPlaceIds]);

  // Render initial fog immediately (no debounce) so there's no flash
  useEffect(() => {
    if (!visible || !isLoaded || fogImageUri) return;

    const base64 = renderFogImage(trail, exploredPlaces, {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      bounds: FOG_BOUNDS,
    });

    if (base64) {
      setFogImageUri(`data:image/png;base64,${base64}`);
    }
  }, [visible, isLoaded]);

  if (!visible || !fogImageUri) return null;

  return (
    <Overlay
      bounds={[
        [FOG_BOUNDS.latMin, FOG_BOUNDS.lngMin], // SW
        [FOG_BOUNDS.latMax, FOG_BOUNDS.lngMax], // NE
      ]}
      image={{ uri: fogImageUri }}
      bearing={0}
      opacity={1}
    />
  );
});
