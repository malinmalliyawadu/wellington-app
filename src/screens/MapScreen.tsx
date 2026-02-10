import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PopularityMarker } from '../components/PopularityMarker';
import { PlacePostsSheet } from '../components/PlacePostsSheet';
import { MapSearchBar } from '../components/MapSearchBar';
import { useFollow } from '../context/FollowContext';
import { useQuery } from '../hooks/useQuery';
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
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={WELLINGTON_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedPlace(null)}
      >
        {filteredPlaces.map((place) => {
          const popularity = popularityMap.get(place.id);
          const score = popularity?.score ?? 1;
          const postCount = popularity?.postCount ?? 0;
          const posterIds = popularity?.posterIds ?? [];
          const size = getMarkerSize(score, popularityMap);
          const followed = isFollowedPlace(posterIds, followingIds);

          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedPlace(place);
              }}
            >
              <PopularityMarker
                size={size}
                category={place.category}
                postCount={postCount}
                isFollowed={followed}
              />
            </Marker>
          );
        })}
      </MapView>

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
});
