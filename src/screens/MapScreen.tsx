import React, {
  useState,
  useEffect,
  useRef,
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
import { useLocation } from "../context/LocationContext";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { PopularityMarker, MarkerEvent } from "../components/PopularityMarker";
import { FogOfWarOverlay } from "../components/FogOfWarOverlay";
import { NeighborhoodOverlay } from "../components/NeighborhoodOverlay";
import { TrailOverlay } from "../components/TrailOverlay";
import { MapControls } from "../components/MapControls";
import { useFollow } from "../context/FollowContext";
import { useMapFilters } from "../context/MapFilterContext";
import { useMapData } from "../hooks/useMapData";
import { useMarkerAnimation } from "../hooks/useMarkerAnimation";
import { useExplorationTracking } from "../hooks/useExplorationTracking";
import { WELLINGTON_REGION, isInWellington } from "../constants/wellington";
import { Place } from "../types";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import * as Haptics from "expo-haptics";

interface MapMarkerItemProps {
  place: Place;
  size: number;
  postCount: number;
  isFollowed: boolean;
  posterAvatars: string[];
  showLabel: boolean;
  events: MarkerEvent[];
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
  events,
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
          events={events}
        />
      </Animated.View>
    </Marker.Animated>
  );
});

export function MapScreen() {
  const { location: userCoords } = useLocation();
  const [showExplorationOverlay, setShowExplorationOverlay] = useState(false);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [activeTrailId, setActiveTrailId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();
  const { selectedCategories, showFollowingOnly, showTrails, showEvents } =
    useMapFilters();

  const [visibleRegion, setVisibleRegion] = useState<Region>(WELLINGTON_REGION);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );

  const {
    places,
    trails,
    isInitialLoad,
    filteredPlaces,
    annotatedPlaceIds,
    baseMarkerDataMap,
    placeEventsMap,
  } = useMapData({
    followingIds,
    selectedCategories,
    showFollowingOnly,
    showEvents,
    visibleRegion,
    mapLayout,
  });

  const { getMarkerScale, animateMarkerPress } = useMarkerAnimation();

  useExplorationTracking(userCoords, places, showExplorationOverlay);

  const openPlaceSheet = useCallback(
    (placeId: string) => {
      const path = `/map/place-posts/${placeId}` as const;
      if (activeTrailId) {
        setActiveTrailId(null);
        router.dismiss();
      }
      router.push(path);
    },
    [router, activeTrailId]
  );

  const handleMarkerPress = useCallback(
    (placeId: string) => {
      animateMarkerPress(placeId);
      openPlaceSheet(placeId);
    },
    [animateMarkerPress, openPlaceSheet]
  );

  const regionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRegionChangeComplete = useCallback((region: Region) => {
    if (regionTimerRef.current) clearTimeout(regionTimerRef.current);
    regionTimerRef.current = setTimeout(() => {
      setVisibleRegion(region);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (regionTimerRef.current) clearTimeout(regionTimerRef.current);
    };
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

  const handleTrailPress = useCallback(
    (trailId: string) => {
      setActiveTrailId(trailId);
      if (router.canDismiss()) router.dismiss();
      router.push(`/map/trail/${trailId}`);
    },
    [router]
  );

  const activeFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0) +
    (!showTrails ? 1 : 0) +
    (!showEvents ? 1 : 0);

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
        {showTrails && (
          <TrailOverlay
            trails={trails ?? []}
            activeTrailId={activeTrailId}
            onTrailPress={handleTrailPress}
          />
        )}
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
                events={placeEventsMap.get(place.id) ?? []}
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
        <MapControls
          activeFilterCount={activeFilterCount}
          showNeighborhoods={showNeighborhoods}
          showExplorationOverlay={showExplorationOverlay}
          hasUserLocation={!!userCoords}
          onOpenFilters={openFilters}
          onToggleNeighborhoods={() => setShowNeighborhoods(!showNeighborhoods)}
          onToggleExploration={() =>
            setShowExplorationOverlay(!showExplorationOverlay)
          }
          onCenterOnUser={centerOnUser}
        />
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
});
