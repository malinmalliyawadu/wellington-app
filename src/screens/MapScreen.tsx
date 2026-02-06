import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PlaceCard } from '../components/PlaceCard';
import { mockPlaces } from '../data/mockPlaces';
import { Place } from '../types';
import { colors } from '../theme/colors';

const WELLINGTON_REGION = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export function MapScreen() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

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
        {mockPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            pinColor={colors.category[place.category]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedPlace(place);
            }}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons
          name={location ? 'navigate' : 'navigate-outline'}
          size={22}
          color={location ? colors.primary : colors.gray400}
        />
      </TouchableOpacity>

      {selectedPlace && (
        <View style={styles.cardContainer}>
          <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />
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
  cardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});
