import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PopularityMarker } from '../components/PopularityMarker';
import { PlacePostsSheet } from '../components/PlacePostsSheet';
import { mockPlaces } from '../data/mockPlaces';
import { mockPosts, getPostsByPlaceId } from '../data/mockPosts';
import { useFollow } from '../context/FollowContext';
import {
  computePlacePopularity,
  getMarkerSize,
  isFollowedPlace,
} from '../utils/placePopularity';
import { Place } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const WELLINGTON_REGION = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type NavProp = NativeStackNavigationProp<MapStackParamList, 'MapHome'>;

export function MapScreen() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavProp>();
  const { followingIds } = useFollow();

  const popularityMap = useMemo(
    () => computePlacePopularity(mockPosts),
    []
  );

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
        {mockPlaces.map((place) => {
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

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons
          name={location ? 'navigate' : 'navigate-outline'}
          size={22}
          color={location ? colors.primary : colors.gray400}
        />
      </TouchableOpacity>

      {selectedPlace && (
        <View style={styles.sheetContainer}>
          <PlacePostsSheet
            place={selectedPlace}
            posts={getPostsByPlaceId(selectedPlace.id)}
            popularity={popularityMap.get(selectedPlace.id)}
            followingIds={followingIds}
            onClose={() => setSelectedPlace(null)}
            onPressPlaceName={(placeId) => {
              setSelectedPlace(null);
              navigation.navigate('PlaceDetail', { placeId });
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
    top: 60,
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
    bottom: 20,
    left: 12,
    right: 12,
  },
});
