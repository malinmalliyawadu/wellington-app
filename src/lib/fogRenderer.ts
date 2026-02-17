import {
  Skia,
  BlendMode,
  TileMode,
  AlphaType,
  ColorType,
} from "@shopify/react-native-skia";

/** Geographic bounds for the fog coverage area */
export interface FogBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export interface TrailPoint {
  latitude: number;
  longitude: number;
}

export interface ExploredPlace {
  latitude: number;
  longitude: number;
  id: string;
}

interface FogConfig {
  /** Radius in meters to clear along the GPS trail */
  trailClearRadius: number;
  /** Radius in meters to clear around visited places */
  placeClearRadius: number;
  /** Fog color with alpha */
  fogColor: string;
  /** Image dimensions */
  width: number;
  height: number;
  /** Geographic bounds the image covers */
  bounds: FogBounds;
}

const DEFAULT_CONFIG: FogConfig = {
  trailClearRadius: 60,
  placeClearRadius: 300,
  fogColor: "rgba(15, 20, 30, 0.9)",
  width: 512,
  height: 512,
  bounds: {
    latMin: -41.35,
    latMax: -41.2,
    lngMin: 174.7,
    lngMax: 174.87,
  },
};

/** Convert geographic coordinates to pixel position on the fog image */
function geoToPixel(
  lat: number,
  lng: number,
  bounds: FogBounds,
  width: number,
  height: number
): { x: number; y: number } {
  const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * width;
  // Latitude is inverted (higher lat = lower y)
  const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * height;
  return { x, y };
}

/** Convert a distance in meters to pixels at a given latitude */
function metersToPixels(
  meters: number,
  lat: number,
  bounds: FogBounds,
  width: number
): number {
  const lngSpan = bounds.lngMax - bounds.lngMin;
  const metersPerDegree = 111_000 * Math.cos((lat * Math.PI) / 180);
  const metersSpan = lngSpan * metersPerDegree;
  return (meters / metersSpan) * width;
}

/**
 * Render the fog of war image offscreen using Skia.
 *
 * Returns a base64-encoded PNG string suitable for use with
 * react-native-maps <Overlay image={{ uri: `data:image/png;base64,...` }} />
 *
 * The image is a semi-transparent dark layer with transparent holes
 * punched out along the trail and around explored places.
 */
export function renderFogImage(
  trail: TrailPoint[],
  exploredPlaces: ExploredPlace[],
  configOverrides?: Partial<FogConfig>
): string | null {
  const config = { ...DEFAULT_CONFIG, ...configOverrides };
  const {
    width,
    height,
    bounds,
    fogColor,
    trailClearRadius,
    placeClearRadius,
  } = config;

  try {
    // Create offscreen surface
    const surface = Skia.Surface.MakeOffscreen(width, height);
    if (!surface) {
      console.error("[FogRenderer] Failed to create offscreen surface");
      return null;
    }

    const canvas = surface.getCanvas();

    // Step 1: Fill with fog
    const fogPaint = Skia.Paint();
    fogPaint.setColor(Skia.Color(fogColor));
    canvas.drawRect(Skia.XYWHRect(0, 0, width, height), fogPaint);

    // Step 2: Punch out explored areas using DstOut blend mode
    // DstOut: where we draw white, the fog becomes transparent
    const clearPaint = Skia.Paint();
    clearPaint.setBlendMode(BlendMode.DstOut);
    clearPaint.setAntiAlias(true);

    // Helper: draw a soft-edged clear circle at a pixel position
    const drawClearCircle = (
      cx: number,
      cy: number,
      radiusMeters: number,
      lat: number
    ) => {
      const radiusPx = metersToPixels(radiusMeters, lat, bounds, width);
      if (radiusPx < 1) return;

      // Radial gradient for soft edges: solid clear center, fading to nothing
      const shader = Skia.Shader.MakeRadialGradient(
        { x: cx, y: cy },
        radiusPx,
        [Skia.Color("rgba(255,255,255,1)"), Skia.Color("rgba(255,255,255,0)")],
        [0.55, 1.0],
        TileMode.Clamp
      );

      clearPaint.setShader(shader);
      canvas.drawCircle(cx, cy, radiusPx, clearPaint);
    };

    // Step 3: Clear along GPS trail (smaller radius, more frequent)
    for (const point of trail) {
      const { x, y } = geoToPixel(
        point.latitude,
        point.longitude,
        bounds,
        width,
        height
      );
      drawClearCircle(x, y, trailClearRadius, point.latitude);
    }

    // Step 4: Clear around explored places (larger radius)
    for (const place of exploredPlaces) {
      const { x, y } = geoToPixel(
        place.latitude,
        place.longitude,
        bounds,
        width,
        height
      );
      drawClearCircle(x, y, placeClearRadius, place.latitude);
    }

    // Step 5: Export
    surface.flush();
    const image = surface.makeImageSnapshot();
    const base64 = image.encodeToBase64();

    // Clean up
    image.dispose();
    surface.dispose();

    return base64;
  } catch (error) {
    console.error("[FogRenderer] Error rendering fog:", error);
    return null;
  }
}
