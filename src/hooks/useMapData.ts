import { useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Region } from "react-native-maps";
import { MarkerEvent } from "../components/PopularityMarker";
import { useQuery } from "./useQuery";
import { getPlaces } from "../services/places";
import { getPosts } from "../services/posts";
import { getProfiles } from "../services/users";
import { getTrails } from "../services/trails";
import { getUpcomingEvents } from "../services/events";
import {
  computePlacePopularity,
  getMarkerSizeRange,
  getMarkerSizeWithRange,
  isFollowedPlaceSet,
} from "../utils/placePopularity";
import { Place, PlaceCategory, User } from "../types";

interface UseMapDataParams {
  followingIds: string[];
  selectedCategories: PlaceCategory[];
  showFollowingOnly: boolean;
  showEvents: boolean;
  visibleRegion: Region;
  mapLayout: { width: number; height: number };
}

export function useMapData({
  followingIds,
  selectedCategories,
  showFollowingOnly,
  showEvents,
  visibleRegion,
  mapLayout,
}: UseMapDataParams) {
  const {
    data: places,
    loading: placesLoading,
    refetch: refetchPlaces,
  } = useQuery(getPlaces, "places");
  const allPlaces = places ?? [];
  const {
    data: allPosts,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useQuery(getPosts, "posts");
  const {
    data: allUsers,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(getProfiles, "profiles");
  const { data: trails, refetch: refetchTrails } = useQuery(
    getTrails,
    "trails"
  );
  const { data: upcomingEvents, refetch: refetchEvents } = useQuery(
    getUpcomingEvents,
    "upcoming-events"
  );

  const todayEvents = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const day = now.getDay(); // 0=Sun, 6=Sat
    // Include through this Sunday: days until end of weekend
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    const end = endDate.toISOString().split("T")[0];
    return (upcomingEvents ?? []).filter(
      (e) => e.date >= today && e.date <= end
    );
  }, [upcomingEvents]);

  // Refetch data when screen comes into focus
  const refetchAll = useCallback(() => {
    refetchPosts();
    refetchPlaces();
    refetchUsers();
    refetchTrails();
    refetchEvents();
  }, [refetchPosts, refetchPlaces, refetchUsers, refetchTrails, refetchEvents]);

  useFocusEffect(
    useCallback(() => {
      refetchAll();
    }, [refetchAll])
  );

  const isDataLoaded = !placesLoading && !postsLoading && !usersLoading;
  const isInitialLoad = placesLoading && allPlaces.length === 0;

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of allUsers ?? []) {
      map.set(user.id, user);
    }
    return map;
  }, [allUsers]);

  const placeEventsMap = useMemo(() => {
    if (!showEvents) return new Map<string, MarkerEvent[]>();
    const map = new Map<string, MarkerEvent[]>();
    for (const event of todayEvents) {
      const list = map.get(event.placeId) ?? [];
      const attendeeAvatars = (event.attendeeIds ?? [])
        .slice(0, 8)
        .map((uid) => userMap.get(uid)?.avatarUrl)
        .filter((url): url is string => !!url);
      list.push({ date: event.date, attendeeAvatars });
      map.set(event.placeId, list);
    }
    return map;
  }, [todayEvents, showEvents, userMap]);

  const popularityMap = useMemo(
    () => computePlacePopularity(allPosts ?? []),
    [allPosts]
  );

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      // Exclude trail shadow places — trails have their own polyline overlay
      if (place.category === 'trail') return false;
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(place.category)
      ) {
        return false;
      }
      if (showFollowingOnly) {
        const posterIds = popularityMap.get(place.id)?.posterIds ?? [];
        if (!isFollowedPlaceSet(posterIds, followingSet)) {
          return false;
        }
      }
      return true;
    });
  }, [
    allPlaces,
    selectedCategories,
    showFollowingOnly,
    popularityMap,
    followingSet,
  ]);

  const annotatedPlaceIds = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } =
      visibleRegion;
    const { width: mw, height: mh } = mapLayout;
    if (mw === 0 || mh === 0) return new Set<string>();

    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;

    const visible = filteredPlaces.filter(
      (p) =>
        p.latitude >= south &&
        p.latitude <= north &&
        p.longitude >= west &&
        p.longitude <= east
    );

    const targetCount = Math.max(3, Math.round(visible.length * 0.35));

    // Sort by popularity (highest first)
    const sorted = [...visible].sort((a, b) => {
      const sa = popularityMap.get(a.id)?.score ?? 0;
      const sb = popularityMap.get(b.id)?.score ?? 0;
      return sb - sa;
    });

    // Convert to screen positions and greedily pick non-overlapping labels
    const toScreen = (p: Place) => ({
      x: ((p.longitude - west) / longitudeDelta) * mw,
      y: ((north - p.latitude) / latitudeDelta) * mh,
    });

    // Approximate label footprint in pixels (marker + label below)
    const LABEL_W = 120;
    const LABEL_H = 60;

    const selected: { id: string; x: number; y: number }[] = [];

    for (const place of sorted) {
      if (selected.length >= targetCount) break;

      const { x, y } = toScreen(place);

      // Check overlap with already-selected labels
      const overlaps = selected.some(
        (s) => Math.abs(s.x - x) < LABEL_W && Math.abs(s.y - y) < LABEL_H
      );

      if (!overlaps) {
        selected.push({ id: place.id, x, y });
      }
    }

    return new Set(selected.map((s) => s.id));
  }, [filteredPlaces, visibleRegion, popularityMap, mapLayout]);

  const baseMarkerDataMap = useMemo(() => {
    const sizeRange = getMarkerSizeRange(popularityMap);
    const map = new Map<
      string,
      {
        size: number;
        isFollowed: boolean;
        postCount: number;
        posterAvatars: string[];
      }
    >();
    for (const place of filteredPlaces) {
      const popularity = popularityMap.get(place.id);
      const score = popularity?.score ?? 1;
      const posterIds = popularity?.posterIds ?? [];
      const posterAvatars = posterIds
        .slice(0, 8)
        .map((uid) => userMap.get(uid)?.avatarUrl)
        .filter((url): url is string => !!url);
      map.set(place.id, {
        size: getMarkerSizeWithRange(score, sizeRange),
        isFollowed: isFollowedPlaceSet(posterIds, followingSet),
        postCount: popularity?.postCount ?? 0,
        posterAvatars,
      });
    }
    return map;
  }, [filteredPlaces, popularityMap, followingSet, userMap]);

  return {
    places,
    trails,
    isDataLoaded,
    isInitialLoad,
    filteredPlaces,
    annotatedPlaceIds,
    baseMarkerDataMap,
    placeEventsMap,
    popularityMap,
  };
}
