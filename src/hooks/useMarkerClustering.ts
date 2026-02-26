import { useMemo } from "react";
import SuperclusterImport, { ClusterProperties } from "supercluster";
import { Place, PlaceCategory, Trail } from "../types";
import { WELLINGTON_BOUNDS } from "../constants/wellington";

// Handle CJS/ESM interop — Metro may or may not wrap the default export
const Supercluster = (
  typeof (SuperclusterImport as any).default === "function"
    ? (SuperclusterImport as any).default
    : SuperclusterImport
) as typeof SuperclusterImport;

// --- Public types ---

export type MapItemPlace = {
  kind: "place";
  place: Place;
};

export type MapItemCluster = {
  kind: "cluster";
  id: number;
  category: PlaceCategory;
  count: number;
  latitude: number;
  longitude: number;
  expansionZoom: number;
};

export type MapItemTrail = {
  kind: "trail";
  trail: Trail;
};

export type MapItem = MapItemPlace | MapItemCluster | MapItemTrail;

// --- Helpers ---

const CLUSTER_RADIUS = 40;
const MAX_ZOOM = 20;

// Fixed bbox covering all of Wellington — all markers are always returned,
// react-native-maps handles viewport culling natively (same as pre-clustering).
const WELLINGTON_BBOX: [number, number, number, number] = [
  WELLINGTON_BOUNDS.west,
  WELLINGTON_BOUNDS.south,
  WELLINGTON_BOUNDS.east,
  WELLINGTON_BOUNDS.north,
];

type PointProps = { placeId: string; category: PlaceCategory; trailId?: string };

// --- Hook ---

interface UseMarkerClusteringParams {
  filteredPlaces: Place[];
  trails: Trail[] | null | undefined;
  showTrails: boolean;
  zoom: number;
}

export function useMarkerClustering({
  filteredPlaces,
  trails,
  showTrails,
  zoom,
}: UseMarkerClusteringParams) {
  // Group places by category and build per-category supercluster indices
  const indices = useMemo(() => {
    const byCategory = new Map<
      PlaceCategory,
      GeoJSON.Feature<GeoJSON.Point, PointProps>[]
    >();

    for (const place of filteredPlaces) {
      const features = byCategory.get(place.category) ?? [];
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [place.longitude, place.latitude],
        },
        properties: {
          placeId: place.id,
          category: place.category,
        },
      });
      byCategory.set(place.category, features);
    }

    // Add trail trailheads as "trail" category points
    if (showTrails && trails) {
      const trailFeatures = byCategory.get("trail") ?? [];
      for (const trail of trails) {
        trailFeatures.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              trail.trailhead.longitude,
              trail.trailhead.latitude,
            ],
          },
          properties: {
            placeId: trail.placeId,
            category: "trail",
            trailId: trail.id,
          },
        });
      }
      if (trailFeatures.length > 0) {
        byCategory.set("trail", trailFeatures);
      }
    }

    const result = new Map<PlaceCategory, SuperclusterImport<PointProps>>();
    for (const [category, features] of byCategory) {
      const index = new Supercluster<PointProps>({
        radius: CLUSTER_RADIUS,
        maxZoom: MAX_ZOOM,
      });
      index.load(features);
      result.set(category, index);
    }
    return result;
  }, [filteredPlaces, trails, showTrails]);

  // Build lookup maps for quick access
  const placeMap = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of filteredPlaces) {
      map.set(place.id, place);
    }
    return map;
  }, [filteredPlaces]);

  const trailMap = useMemo(() => {
    const map = new Map<string, Trail>();
    if (trails) {
      for (const trail of trails) {
        map.set(trail.id, trail);
      }
    }
    return map;
  }, [trails]);

  // Produce the final mapItems and clusteredTrailIds.
  // Uses fixed Wellington bbox so ALL markers are always in the React tree.
  // Only zoom changes trigger re-clustering; panning is handled natively.
  const result = useMemo(() => {
    const items: MapItem[] = [];
    const clusteredTrails = new Set<string>();

    for (const [category, index] of indices) {
      const clusters = index.getClusters(WELLINGTON_BBOX, zoom);

      for (const feature of clusters) {
        const props = feature.properties as PointProps | (ClusterProperties & { cluster: true });
        const isCluster = "cluster" in props && props.cluster === true;

        if (isCluster) {
          const clusterProps = props as ClusterProperties;
          const clusterId = clusterProps.cluster_id;
          const count = clusterProps.point_count;
          const [lng, lat] = feature.geometry.coordinates;
          let expansionZoom: number;
          try {
            expansionZoom = Math.min(
              index.getClusterExpansionZoom(clusterId),
              MAX_ZOOM
            );
          } catch {
            expansionZoom = zoom + 2;
          }

          // Track which trails are inside this cluster
          if (category === "trail") {
            const leaves = index.getLeaves(clusterId, Infinity);
            for (const leaf of leaves) {
              const trailId = (leaf.properties as PointProps).trailId;
              if (trailId) clusteredTrails.add(trailId);
            }
          }

          items.push({
            kind: "cluster",
            id: clusterId,
            category,
            count,
            latitude: lat,
            longitude: lng,
            expansionZoom,
          });
        } else {
          const pointProps = feature.properties as PointProps;

          // Trail point — emit as trail item
          if (pointProps.trailId) {
            const trail = trailMap.get(pointProps.trailId);
            if (trail) {
              items.push({ kind: "trail", trail });
            }
          } else {
            // Regular place
            const place = placeMap.get(pointProps.placeId);
            if (place) {
              items.push({ kind: "place", place });
            }
          }
        }
      }
    }

    return { mapItems: items, clusteredTrailIds: clusteredTrails };
  }, [indices, zoom, placeMap, trailMap]);

  return result;
}

/** Convert a region's longitudeDelta to an integer zoom level. */
export function regionToZoom(longitudeDelta: number): number {
  return Math.round(Math.log2(360 / Math.max(longitudeDelta, 0.0001)));
}
