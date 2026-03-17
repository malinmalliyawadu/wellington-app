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
import { useNotInterested } from "../context/NotInterestedContext";

interface UseMapDataParams {
  followingIds: string[];
  selectedCategories: PlaceCategory[];
  showFollowingOnly: boolean;
  hideVisited: boolean;
  exploredPlaceIds: string[];
  showEvents: boolean;
  visibleRegion: Region;
  mapLayout: { width: number; height: number };
}

export function useMapData({
  followingIds,
  selectedCategories,
  showFollowingOnly,
  hideVisited,
  exploredPlaceIds,
  showEvents,
  visibleRegion,
  mapLayout,
}: UseMapDataParams) {
  const { getNotInterestedIds } = useNotInterested();
  const notInterestedPlaceIds = useMemo(() => new Set(getNotInterestedIds('place')), [getNotInterestedIds]);
  const notInterestedEventIds = useMemo(() => new Set(getNotInterestedIds('event')), [getNotInterestedIds]);

  const {
    data: places,
    loading: placesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useQuery(getPlaces, "places");
  const allPlaces = useMemo(() => places ?? [], [places]);
  const {
    data: allPosts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery(getPosts, "posts");
  const {
    data: allUsers,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(getProfiles, "profiles");
  const { data: trails, error: trailsError, refetch: refetchTrails } = useQuery(
    getTrails,
    "trails"
  );
  const { data: upcomingEvents, error: eventsError, refetch: refetchEvents } = useQuery(
    getUpcomingEvents,
    "upcoming-events"
  );

  const error = placesError || postsError || usersError || trailsError || eventsError;

  const happeningNowEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now
      .toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" })
    const nzTimeStr = now.toLocaleTimeString("en-GB", {
      timeZone: "Pacific/Auckland",
      hour12: false,
    });
    const [nowH, nowM] = nzTimeStr.split(":").map(Number);
    const nowMinutes = nowH * 60 + nowM;

    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    return (upcomingEvents ?? []).filter((e) => {
      if (notInterestedEventIds.has(e.id)) return false;
      if (e.date !== todayStr) return false;
      const endMinutes = e.endTime
        ? toMinutes(e.endTime)
        : toMinutes(e.startTime) + 180;
      return endMinutes > nowMinutes;
    });
  }, [upcomingEvents, notInterestedEventIds]);

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

    const now = new Date();
    const nzTimeStr = now.toLocaleTimeString("en-GB", {
      timeZone: "Pacific/Auckland",
      hour12: false,
    });
    const [nowH, nowM] = nzTimeStr.split(":").map(Number);
    const nowMinutes = nowH * 60 + nowM;
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const map = new Map<string, MarkerEvent[]>();
    for (const event of happeningNowEvents) {
      const list = map.get(event.placeId) ?? [];
      const attendeeAvatars = (event.attendeeIds ?? [])
        .slice(0, 8)
        .map((uid) => userMap.get(uid)?.avatarUrl)
        .filter((url): url is string => !!url);
      const startMinutes = toMinutes(event.startTime);
      const isHappeningNow = startMinutes <= nowMinutes;
      list.push({
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime ?? undefined,
        isHappeningNow,
        attendeeAvatars,
      });
      map.set(event.placeId, list);
    }
    return map;
  }, [happeningNowEvents, showEvents, userMap]);

  const popularityMap = useMemo(
    () => computePlacePopularity(allPosts ?? []),
    [allPosts]
  );

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const exploredSet = useMemo(() => new Set(exploredPlaceIds), [exploredPlaceIds]);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      // Exclude not-interested places
      if (notInterestedPlaceIds.has(place.id)) return false;
      // Exclude trail shadow places — trails have their own polyline overlay
      if (place.category === 'trail') return false;
      // Only show places that have posts or upcoming events
      const hasActivity =
        popularityMap.has(place.id) || placeEventsMap.has(place.id);
      if (!hasActivity) return false;
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
      if (hideVisited && exploredSet.has(place.id) && !placeEventsMap.has(place.id)) {
        return false;
      }
      return true;
    });
  }, [
    allPlaces,
    selectedCategories,
    showFollowingOnly,
    hideVisited,
    exploredSet,
    popularityMap,
    placeEventsMap,
    followingSet,
    notInterestedPlaceIds,
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
    error,
    isDataLoaded,
    isInitialLoad,
    filteredPlaces,
    annotatedPlaceIds,
    baseMarkerDataMap,
    placeEventsMap,
    popularityMap,
    refetchAll,
  };
}
