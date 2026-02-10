import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PopularityMarker } from '../components/PopularityMarker';
import { PlacePostsSheet } from '../components/PlacePostsSheet';
import { MapSearchBar } from '../components/MapSearchBar';
import { PeekingMarkersOverlay } from '../components/PeekingMarkersOverlay';
import { useFollow } from '../context/FollowContext';
import { useQuery } from '../hooks/useQuery';
import { usePeekingMarkers, PeekingMarker } from '../hooks/usePeekingMarkers';
import { getPlaces } from '../services/places';
import { getPosts, getPostsByPlaceId as getPostsByPlaceIdAsync } from '../services/posts';
import {
  computePlacePopularity,
  getMarkerSize,
  isFollowedPlace,
} from '../utils/placePopularity';
import { Place, PlaceCategory, Post } from '../types';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const WELLINGTON_REGION = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

export function MapScreen() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlacePosts, setSelectedPlacePosts] = useState<Post[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();

  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>([]);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region>(WELLINGTON_REGION);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const { data: places } = useQuery(getPlaces);
  const allPlaces = places ?? [];
  const { data: allPosts } = useQuery(getPosts);

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
    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;

    const visible = filteredPlaces.filter(
      (p) => p.latitude >= south && p.latitude <= north && p.longitude >= west && p.longitude <= east,
    );

    const count = Math.max(3, Math.round(visible.length * 0.35));

    const sorted = [...visible].sort((a, b) => {
      const sa = popularityMap.get(a.id)?.score ?? 0;
      const sb = popularityMap.get(b.id)?.score ?? 0;
      return sb - sa;
    });

    return new Set(sorted.slice(0, count).map((p) => p.id));
  }, [filteredPlaces, visibleRegion, popularityMap]);

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
    setSelectedPlace(marker.place);
  }, [visibleRegion]);

  const handleSearchSelect = (place: Place) => {
    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    setSelectedPlace(place);
  };

  useEffect(() => {
    if (selectedPlace) {
      getPostsByPlaceIdAsync(selectedPlace.id)
        .then(setSelectedPlacePosts)
        .catch(() => setSelectedPlacePosts([]));
    } else {
      setSelectedPlacePosts([]);
    }
  }, [selectedPlace]);

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
        onPress={() => setSelectedPlace(null)}
        onRegionChangeComplete={handleRegionChangeComplete}
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
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              anchor={{ x: 0.5, y: showLabel ? 0.35 : 0.5 }}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedPlace(place);
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
                      <Text style={styles.labelSubtitle}>
                        {posterIds.length} people were here
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </Marker>
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

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons
          name={location ? 'navigate' : 'navigate-outline'}
          size={22}
          color={location ? colors.primary : colors.gray400}
        />
      </TouchableOpacity>

      {selectedPlace && (
        <View style={[styles.sheetContainer, { bottom: 60 + insets.bottom }]}>
          <PlacePostsSheet
            place={selectedPlace}
            posts={selectedPlacePosts}
            popularity={popularityMap.get(selectedPlace.id)}
            followingIds={followingIds}
            onClose={() => setSelectedPlace(null)}
            onPressPlaceName={(placeId) => {
              setSelectedPlace(null);
              router.push(`/map/place/${placeId}`);
            }}
            onPressPost={(postId) => {
              setSelectedPlace(null);
              router.push(`/map/post/${postId}`);
            }}
          />
        </View>
      )}
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
  sheetContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  markerContainer: {
    alignItems: 'center',
  },
  labelContainer: {
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 120,
  },
  labelName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  labelSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
