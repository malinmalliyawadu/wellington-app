import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  ActivityIndicator,
  Animated,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SFIcon } from "../components/SFIcon";
import { useLocation } from "../context/LocationContext";
import { useNavigation, useFocusEffect } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { PopularityMarker } from "../components/PopularityMarker";
import { FogOfWarOverlay } from "../components/FogOfWarOverlay";
import { NeighborhoodOverlay } from "../components/NeighborhoodOverlay";
import { useFollow } from "../context/FollowContext";
import { useExploration } from "../context/ExplorationContext";
import { useToast } from "../context/ToastContext";
import { createAchievementToast } from "../utils/achievementHelpers";
import { useMapFilters } from "../context/MapFilterContext";
import { useQuery } from "../hooks/useQuery";
import { getPlaces } from "../services/places";
import { getPosts } from "../services/posts";
import { getProfiles } from "../services/users";
import {
  computePlacePopularity,
  getMarkerSizeRange,
  getMarkerSizeWithRange,
  isFollowedPlaceSet,
} from "../utils/placePopularity";
import { Place, User } from "../types";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { HapticPressable } from "src/components/HapticPressable";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import * as Haptics from "expo-haptics";

const glassEnabled = isLiquidGlassAvailable();

const WELLINGTON_REGION = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

// Bounding box for greater Wellington area
const WELLINGTON_BOUNDS = {
  north: -41.05,
  south: -41.38,
  west: 174.6,
  east: 174.95,
};

function isInWellington(lat: number, lng: number): boolean {
  return (
    lat >= WELLINGTON_BOUNDS.south &&
    lat <= WELLINGTON_BOUNDS.north &&
    lng >= WELLINGTON_BOUNDS.west &&
    lng <= WELLINGTON_BOUNDS.east
  );
}

interface MapMarkerItemProps {
  place: Place;
  size: number;
  postCount: number;
  isFollowed: boolean;
  posterAvatars: string[];
  showLabel: boolean;
  scale: Animated.Value;
  onPress: (placeId: string) => void;
}

const MapMarkerItem = React.memo(function MapMarkerItem({
  place,
  size,
  postCount,
  isFollowed,
  posterAvatars,
  showLabel,
  scale,
  onPress,
}: MapMarkerItemProps) {
  return (
    <Marker.Animated
      coordinate={{
        latitude: place.latitude,
        longitude: place.longitude,
      }}
      anchor={{ x: 0.5, y: showLabel ? 0.35 : 0.5 }}
      tracksViewChanges={false}
      onPress={(e) => {
        e.stopPropagation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        onPress(place.id);
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <PopularityMarker
          size={size}
          category={place.category}
          postCount={postCount}
          isFollowed={isFollowed}
          placeName={place.name}
          posterAvatars={posterAvatars}
          showLabel={showLabel}
        />
      </Animated.View>
    </Marker.Animated>
  );
});

export function MapScreen() {
  const { location: userCoords, error: locationError } = useLocation();
  const [showExplorationOverlay, setShowExplorationOverlay] = useState(false);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();
  const { selectedCategories, showFollowingOnly } = useMapFilters();
  const { markExplored, isExplored } = useExploration();
  const { showToast } = useToast();

  // Track animated scale values for each marker
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

  const openPlaceSheet = useCallback(
    (placeId: string) => {
      const path = `/map/place-posts/${placeId}` as const;
      if (router.canDismiss()) {
        router.setParams({ placeId });
      } else {
        router.push(path);
      }
    },
    [router]
  );

  const handleMarkerPress = useCallback(
    (placeId: string) => {
      animateMarkerPress(placeId);
      openPlaceSheet(placeId);
    },
    [animateMarkerPress, openPlaceSheet]
  );

  const [visibleRegion, setVisibleRegion] = useState<Region>(WELLINGTON_REGION);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );

  const {
    data: places,
    loading: placesLoading,
    refetch: refetchPlaces,
  } = useQuery(getPlaces);
  const allPlaces = places ?? [];
  const {
    data: allPosts,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useQuery(getPosts);
  const {
    data: allUsers,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(getProfiles);

  // Refetch data when screen comes into focus (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      refetchPosts();
      refetchPlaces();
      refetchUsers();
    }, [refetchPosts, refetchPlaces, refetchUsers])
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

  const popularityMap = useMemo(
    () => computePlacePopularity(allPosts ?? []),
    [allPosts]
  );

  const followingSet = useMemo(
    () => new Set(followingIds),
    [followingIds]
  );

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
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

  const regionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRegionChangeComplete = useCallback((region: Region) => {
    if (regionTimerRef.current) clearTimeout(regionTimerRef.current);
    regionTimerRef.current = setTimeout(() => {
      setVisibleRegion(region);
    }, 150);
  }, []);

  const handleMapLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapLayout({ width, height });
  }, []);

  useEffect(() => {
    if (!userCoords) return;
    if (!isInWellington(userCoords.latitude, userCoords.longitude)) return;
    mapRef.current?.animateToRegion({
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    mapRef.current?.animateCamera({
      pitch: 40,
      heading: 90,
    });
  }, [userCoords]);

  // Location-based exploration tracking (only when overlay is visible for performance)
  useEffect(() => {
    if (!userCoords || !places || !showExplorationOverlay) return;

    const EXPLORATION_RADIUS = 50; // meters - must be within 50m to explore

    // Check for nearby unexplored places
    const checkNearbyPlaces = async () => {
      const { latitude, longitude } = userCoords;

      for (const place of places) {
        if (isExplored(place.id)) continue;

        // Calculate distance to place
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

        // If within exploration radius, mark as explored
        if (distance <= EXPLORATION_RADIUS) {
          const newAchievements = await markExplored(place.id, "viewed");
          if (newAchievements.length > 0) {
            showToast(createAchievementToast(newAchievements[0]));
          }
        }
      }
    };

    checkNearbyPlaces();

    // Set up interval to check periodically (every 30 seconds - throttled for performance)
    const interval = setInterval(checkNearbyPlaces, 30000);
    return () => clearInterval(interval);
  }, [
    userCoords,
    places,
    showExplorationOverlay,
    isExplored,
    markExplored,
    showToast,
  ]);

  const centerOnUser = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const openFilters = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const activeFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) + (showFollowingOnly ? 1 : 0);

  return (
    <View style={styles.container} onLayout={handleMapLayout}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={WELLINGTON_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={true}
        compassOffset={{ x: -320, y: 0 }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsPointsOfInterest={false}
        userInterfaceStyle="light"
        minZoomLevel={9}
      >
        <NeighborhoodOverlay
          visible={showNeighborhoods}
          onNeighborhoodPress={(polygon) => {
            mapRef.current?.fitToCoordinates(polygon, {
              edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
              animated: true,
            });
          }}
        />
        <FogOfWarOverlay
          places={filteredPlaces}
          visible={showExplorationOverlay}
        />
        {!isInitialLoad &&
          filteredPlaces.map((place) => {
            const data = baseMarkerDataMap.get(place.id);
            if (!data) return null;
            return (
              <MapMarkerItem
                key={place.id}
                place={place}
                size={data.size}
                postCount={data.postCount}
                isFollowed={data.isFollowed}
                posterAvatars={data.posterAvatars}
                showLabel={annotatedPlaceIds.has(place.id)}
                scale={getMarkerScale(place.id)}
                onPress={handleMarkerPress}
              />
            );
          })}
      </MapView>

      {isInitialLoad && (
        <View style={[styles.loadingOverlay, { top: insets.top + 106 }]}>
          <BlurView intensity={15} tint="light" style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading places...</Text>
          </BlurView>
        </View>
      )}

      <View style={[styles.controlsWrapper, { top: insets.top + 8 }]}>
        {glassEnabled ? (
          <GlassView style={styles.controlsGlass}>
            <HapticPressable
              style={[
                styles.controlButton,
                styles.controlButtonTop,
                activeFilterCount > 0 && styles.controlButtonActive,
              ]}
              onPress={openFilters}
            >
              <SFIcon
                name="slider.horizontal.3"
                fallback="options"
                size={22}
                color={activeFilterCount > 0 ? "#FFFFFF" : colors.text}
              />
            </HapticPressable>

            <View style={styles.controlDivider} />

            <HapticPressable
              style={[styles.controlButton]}
              onPress={() => setShowNeighborhoods(!showNeighborhoods)}
            >
              <SFIcon
                name={showNeighborhoods ? "map.fill" : "map"}
                fallback={showNeighborhoods ? "map" : "map-outline"}
                size={22}
                color={showNeighborhoods ? colors.primary : colors.text}
              />
            </HapticPressable>

            <View style={styles.controlDivider} />

            <HapticPressable
              style={[styles.controlButton]}
              onPress={() => setShowExplorationOverlay(!showExplorationOverlay)}
            >
              <SFIcon
                name={showExplorationOverlay ? "eye.fill" : "eye"}
                fallback={showExplorationOverlay ? "eye" : "eye-outline"}
                size={22}
                color={showExplorationOverlay ? colors.primary : colors.text}
              />
            </HapticPressable>

            <View style={styles.controlDivider} />

            <HapticPressable
              style={[styles.controlButton, styles.controlButtonBottom]}
              onPress={centerOnUser}
            >
              <SFIcon
                name={userCoords ? "location.fill" : "location"}
                fallback={userCoords ? "navigate" : "navigate-outline"}
                size={22}
                color={userCoords ? colors.primary : colors.text}
              />
            </HapticPressable>
          </GlassView>
        ) : (
          <View style={styles.controlsContainer}>
            <BlurView
              intensity={10}
              tint="light"
              style={styles.controlsBlurBg}
            />
            <View style={styles.controlsInner}>
              <HapticPressable
                style={[
                  styles.controlButton,
                  styles.controlButtonTop,
                  activeFilterCount > 0 && styles.controlButtonActive,
                ]}
                onPress={openFilters}
              >
                <SFIcon
                  name="slider.horizontal.3"
                  fallback="options"
                  size={22}
                  color={activeFilterCount > 0 ? "#FFFFFF" : colors.text}
                />
              </HapticPressable>

              <View style={styles.controlDivider} />

              <HapticPressable
                style={[styles.controlButton]}
                onPress={() => setShowNeighborhoods(!showNeighborhoods)}
              >
                <SFIcon
                  name={showNeighborhoods ? "map.fill" : "map"}
                  fallback={showNeighborhoods ? "map" : "map-outline"}
                  size={22}
                  color={showNeighborhoods ? colors.primary : colors.text}
                />
              </HapticPressable>

              <View style={styles.controlDivider} />

              <HapticPressable
                style={[styles.controlButton]}
                onPress={() =>
                  setShowExplorationOverlay(!showExplorationOverlay)
                }
              >
                <SFIcon
                  name={showExplorationOverlay ? "eye.fill" : "eye"}
                  fallback={showExplorationOverlay ? "eye" : "eye-outline"}
                  size={22}
                  color={showExplorationOverlay ? colors.primary : colors.text}
                />
              </HapticPressable>

              <View style={styles.controlDivider} />

              <HapticPressable
                style={[styles.controlButton, styles.controlButtonBottom]}
                onPress={centerOnUser}
              >
                <SFIcon
                  name={userCoords ? "location.fill" : "location"}
                  fallback={userCoords ? "navigate" : "navigate-outline"}
                  size={22}
                  color={userCoords ? colors.primary : colors.text}
                />
              </HapticPressable>
            </View>
          </View>
        )}
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </View>

      <FloatingCreateButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 64,
    paddingVertical: 40,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  controlsWrapper: {
    position: "absolute",
    right: 16,
    width: 52,
  },
  controlsContainer: {
    width: 44,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlsGlass: {
    width: 44,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlsBlurBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  controlsInner: {
    width: "100%",
  },
  controlButton: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonTop: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  controlButtonBottom: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
  },
  controlDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
