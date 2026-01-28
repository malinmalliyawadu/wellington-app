import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={WELLINGTON_REGION}
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
  cardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});
