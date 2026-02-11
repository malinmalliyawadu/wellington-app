import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PopularityMarker } from '../components/PopularityMarker';
import { MapSearchBar } from '../components/MapSearchBar';
import { PeekingMarkersOverlay } from '../components/PeekingMarkersOverlay';
import { useFollow } from '../context/FollowContext';
import { useQuery } from '../hooks/useQuery';
import { usePeekingMarkers, PeekingMarker } from '../hooks/usePeekingMarkers';
import { getPlaces } from '../services/places';
import { getPosts } from '../services/posts';
import { getProfiles } from '../services/users';
import {
  computePlacePopularity,
  getMarkerSize,
  isFollowedPlace,
} from '../utils/placePopularity';
import { Place, PlaceCategory, User } from '../types';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { HapticPressable } from 'src/components/HapticPressable';
import * as Haptics from 'expo-haptics';

const WELLINGTON_REGION = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

export function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { followingIds } = useFollow();

  const openPlaceSheet = useCallback((placeId: string) => {
    const path = `/map/place-posts/${placeId}` as const;
    if (router.canDismiss()) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region>(WELLINGTON_REGION);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const { data: places } = useQuery(getPlaces);
  const allPlaces = places ?? [];
  const { data: allPosts } = useQuery(getPosts);
  const { data: allUsers } = useQuery(getProfiles);

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

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(place.category)) {
        return false;
      }
      if (showFollowingOnly) {
        const posterIds = popularityMap.get(place.id)?.posterIds ?? [];
        if (!isFollowedPlace(posterIds, followingIds)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategories, showFollowingOnly, popularityMap, followingIds]);

  const peekingMarkers = usePeekingMarkers(
    filteredPlaces,
    popularityMap,
    followingIds,
    visibleRegion,
    mapLayout,
  );

  const annotatedPlaceIds = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = visibleRegion;
    const { width: mw, height: mh } = mapLayout;
    if (mw === 0 || mh === 0) return new Set<string>();

    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;

    const visible = filteredPlaces.filter(
      (p) => p.latitude >= south && p.latitude <= north && p.longitude >= west && p.longitude <= east,
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
        (s) => Math.abs(s.x - x) < LABEL_W && Math.abs(s.y - y) < LABEL_H,
      );

      if (!overlaps) {
        selected.push({ id: place.id, x, y });
      }
    }

    return new Set(selected.map((s) => s.id));
  }, [filteredPlaces, visibleRegion, popularityMap, mapLayout]);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    setVisibleRegion(region);
  }, []);

  const handleMapLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapLayout({ width, height });
  }, []);

  const handlePeekingMarkerPress = useCallback((marker: PeekingMarker) => {
    mapRef.current?.animateToRegion({
      latitude: marker.place.latitude,
      longitude: marker.place.longitude,
      latitudeDelta: visibleRegion.latitudeDelta,
      longitudeDelta: visibleRegion.longitudeDelta,
    }, 400);
    openPlaceSheet(marker.place.id);
  }, [visibleRegion, openPlaceSheet]);

  const handleSearchSelect = (place: Place) => {
    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    openPlaceSheet(place.id);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      mapRef.current?.animateCamera({
        pitch: 40,
        heading: 90
      })
    })();
  }, []);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <View style={styles.container} onLayout={handleMapLayout}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={WELLINGTON_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsPointsOfInterest={false}
      >
        {filteredPlaces.map((place) => {
          const popularity = popularityMap.get(place.id);
          const score = popularity?.score ?? 1;
          const postCount = popularity?.postCount ?? 0;
          const posterIds = popularity?.posterIds ?? [];
          const size = getMarkerSize(score, popularityMap);
          const followed = isFollowedPlace(posterIds, followingIds);
          const showLabel = annotatedPlaceIds.has(place.id);

          return (
            <Marker.Animated
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              anchor={{ x: 0.5, y: showLabel ? 0.35 : 0.5 }}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                openPlaceSheet(place.id);
              }}
            >
              <View style={styles.markerContainer}>
                <PopularityMarker
                  size={size}
                  category={place.category}
                  postCount={postCount}
                  isFollowed={followed}
                />
                {showLabel && (
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    {posterIds.length > 1 && (
                      <View style={styles.avatarRow}>
                        <View style={styles.avatarStack}>
                          {posterIds.slice(0, 8).map((uid, i) => {
                            const user = userMap.get(uid);
                            if (!user?.avatarUrl) return null;
                            return (
                              <Image
                                key={uid}
                                source={{ uri: user.avatarUrl }}
                                style={[styles.avatar, { left: i * 10 }]}
                              />
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Marker.Animated>
          );
        })}
      </MapView>

      <PeekingMarkersOverlay
        markers={peekingMarkers}
        mapWidth={mapLayout.width}
        mapHeight={mapLayout.height}
        onPress={handlePeekingMarkerPress}
      />

      <MapSearchBar
        places={allPlaces}
        selectedCategories={selectedCategories}
        showFollowingOnly={showFollowingOnly}
        onSelectPlace={handleSearchSelect}
        onCategoriesChange={setSelectedCategories}
        onFollowingToggle={setShowFollowingOnly}
      />

      <HapticPressable style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons
          name={location ? 'navigate' : 'navigate-outline'}
          size={22}
          color={location ? colors.primary : colors.gray400}
        />
      </HapticPressable>

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
  locationButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainer: {
    alignItems: 'center',
  },
  labelContainer: {
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 120,
    boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
    zIndex: 99999
  },
  labelName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    gap: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    height: 14,
    width: 34, // 14 + 2*10 overlap
  },
  avatar: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  labelSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
  },
});
