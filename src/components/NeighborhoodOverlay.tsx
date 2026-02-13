import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Polygon, Marker } from 'react-native-maps';
import { NEIGHBORHOODS } from '../utils/neighborhoods';

interface NeighborhoodOverlayProps {
  visible: boolean;
}

const NEIGHBORHOOD_COLORS: Record<string, string> = {
  cbd: 'rgba(52, 73, 94, 0.2)',
  te_aro: 'rgba(22, 160, 133, 0.2)',
  mount_victoria: 'rgba(39, 174, 96, 0.2)',
  waterfront: 'rgba(52, 152, 219, 0.2)',
  thorndon: 'rgba(142, 68, 173, 0.2)',
};

const LABEL_COLORS: Record<string, string> = {
  cbd: '#34495E',
  te_aro: '#16A085',
  mount_victoria: '#27AE60',
  waterfront: '#3498DB',
  thorndon: '#8E44AD',
};

export function NeighborhoodOverlay({ visible }: NeighborhoodOverlayProps) {
  if (!visible) return null;

  return (
    <>
      {NEIGHBORHOODS.map((neighborhood) => {
        // Create a rectangle from the bounding box
        const coordinates = [
          { latitude: neighborhood.minLat, longitude: neighborhood.minLng }, // SW
          { latitude: neighborhood.minLat, longitude: neighborhood.maxLng }, // SE
          { latitude: neighborhood.maxLat, longitude: neighborhood.maxLng }, // NE
          { latitude: neighborhood.maxLat, longitude: neighborhood.minLng }, // NW
        ];

        // Calculate center point for label
        const centerLat = (neighborhood.minLat + neighborhood.maxLat) / 2;
        const centerLng = (neighborhood.minLng + neighborhood.maxLng) / 2;

        return (
          <React.Fragment key={`neighborhood-${neighborhood.id}`}>
            <Polygon
              coordinates={coordinates}
              fillColor={NEIGHBORHOOD_COLORS[neighborhood.id] || 'rgba(149, 165, 166, 0.2)'}
              strokeColor={NEIGHBORHOOD_COLORS[neighborhood.id]?.replace('0.2', '0.5') || 'rgba(149, 165, 166, 0.5)'}
              strokeWidth={2}
              zIndex={-2}
            />
            <Marker
              coordinate={{ latitude: centerLat, longitude: centerLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: LABEL_COLORS[neighborhood.id] || '#95A5A6' },
                  ]}
                >
                  {neighborhood.name.toUpperCase()}
                </Text>
              </View>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
