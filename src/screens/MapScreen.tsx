import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useNavigation, useRouter } from "expo-router";
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
import { useTheme, type Colors } from "../theme/ThemeContext";
import { fonts } from "../theme/fonts";
import { FloatingCreateButton } from "src/components/FloatingCreateButton";
import { QueryErrorState } from "../components/QueryErrorState";
import { useMapPlaceSelection } from "../context/MapPlaceSelectionContext";
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
  onAppear: (placeId: string) => void;
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
  onAppear,
}: MapMarkerItemProps) {
  React.useEffect(() => {
    onAppear(place.id);
  }, [onAppear, place.id]);

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
  const { colors, isDark } = useTheme();
  const { location: userCoords } = useLocation();
  const [showExplorationOverlay, setShowExplorationOverlay] = useState(false);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [activeTrailId, setActiveTrailId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectPlace, sheetOpenRef } = useMapPlaceSelection();
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
    error: mapError,
    isInitialLoad,
    filteredPlaces,
    annotatedPlaceIds,
    baseMarkerDataMap,
    placeEventsMap,
    refetchAll,
  } = useMapData({
    followingIds,
    selectedCategories,
    showFollowingOnly,
    showEvents,
    visibleRegion,
    mapLayout,
  });

  const { getMarkerScale, animateMarkerAppear, animateMarkerPress } = useMarkerAnimation();

  useExplorationTracking(userCoords, places, showExplorationOverlay);

  const openPlaceSheet = useCallback(
    (placeId: string) => {
      if (activeTrailId) {
        setActiveTrailId(null);
        router.dismiss();
      }
      selectPlace(placeId);
      if (!sheetOpenRef.current) {
        router.push(`/map/place-posts/${placeId}`);
      }
    },
    [router, activeTrailId, selectPlace, sheetOpenRef]
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

  // Clear active trail highlight when trail sheet is dismissed
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    const unsubscribe = parent.addListener("state", () => {
      const state = parent.getState();
      const hasTrailRoute = state?.routes?.some((r: any) =>
        r.name?.startsWith("trail/")
      );
      if (!hasTrailRoute) {
        setActiveTrailId(null);
      }
    });
    return unsubscribe;
  }, [navigation]);

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
      if (sheetOpenRef.current) {
        sheetOpenRef.current = false;
        router.dismiss();
      }

      const trail = trails?.find((t) => t.id === trailId);
      if (trail && trail.coordinates.length > 0) {
        const sheetHeight = mapLayout.height * 0.5;
        mapRef.current?.fitToCoordinates(trail.coordinates, {
          edgePadding: {
            top: 100,
            right: 60,
            bottom: sheetHeight + 40,
            left: 60,
          },
          animated: true,
        });
      }

      router.push(`/map/trail/${trailId}`);
    },
    [router, sheetOpenRef, trails]
  );

  const activeFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (showFollowingOnly ? 1 : 0) +
    (!showTrails ? 1 : 0) +
    (!showEvents ? 1 : 0);

  const styles = createStyles(colors);

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
        userInterfaceStyle={isDark ? "dark" : "light"}
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
                onAppear={animateMarkerAppear}
              />
            );
          })}
      </MapView>

      {isInitialLoad && !mapError && (
        <View style={[styles.loadingOverlay, { top: insets.top + 106 }]}>
          <BlurView
            intensity={15}
            tint={isDark ? "dark" : "light"}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading places...</Text>
          </BlurView>
        </View>
      )}

      {mapError && !places && (
        <View style={[styles.loadingOverlay, { top: insets.top + 106 }]}>
          <QueryErrorState
            message={mapError}
            onRetry={refetchAll}
            fullScreen={false}
          />
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      paddingHorizontal: 20,
      paddingVertical: 12,
      overflow: "hidden",
      borderRadius: 99,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    loadingText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    controlsWrapper: {
      position: "absolute",
      right: 16,
      width: 52,
    },
  });
