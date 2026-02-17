import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Polygon, Marker } from 'react-native-maps';
import { NEIGHBORHOODS, getNeighborhoodCenter } from '../utils/neighborhoods';

interface NeighborhoodOverlayProps {
  visible: boolean;
  onNeighborhoodPress?: (polygon: { latitude: number; longitude: number }[]) => void;
}

// Generate distinct colors for each neighborhood using HSL
// Spread hues evenly across the spectrum with consistent saturation/lightness
function getNeighborhoodFillColor(index: number, total: number): string {
  const hue = (index * (360 / total) + 200) % 360;
  return `hsla(${Math.round(hue)}, 55%, 45%, 0.18)`;
}

function getNeighborhoodStrokeColor(index: number, total: number): string {
  const hue = (index * (360 / total) + 200) % 360;
  return `hsla(${Math.round(hue)}, 55%, 45%, 0.5)`;
}

function getNeighborhoodLabelColor(index: number, total: number): string {
  const hue = (index * (360 / total) + 200) % 360;
  return `hsl(${Math.round(hue)}, 55%, 35%)`;
}

export function NeighborhoodOverlay({ visible, onNeighborhoodPress }: NeighborhoodOverlayProps) {
  if (!visible) return null;

  const total = NEIGHBORHOODS.length;

  return (
    <>
      {NEIGHBORHOODS.map((neighborhood, index) => {
        const center = getNeighborhoodCenter(neighborhood);

        return (
          <React.Fragment key={`neighborhood-${neighborhood.id}`}>
            <Polygon
              coordinates={neighborhood.polygon}
              fillColor={getNeighborhoodFillColor(index, total)}
              strokeColor={getNeighborhoodStrokeColor(index, total)}
              strokeWidth={2}
              zIndex={-2}
            />
            <Marker
              coordinate={center}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => onNeighborhoodPress?.(neighborhood.polygon)}
            >
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: getNeighborhoodLabelColor(index, total) },
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
