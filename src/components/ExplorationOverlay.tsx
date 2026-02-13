import React from 'react';
import { Circle } from 'react-native-maps';
import { useExploration } from '../context/ExplorationContext';
import { Place } from '../types';

interface ExplorationOverlayProps {
  places: Place[];
  visible: boolean;
}

const CIRCLE_RADIUS = 250; // meters

export function ExplorationOverlay({ places, visible }: ExplorationOverlayProps) {
  const { isExplored } = useExploration();

  if (!visible) return null;

  return (
    <>
      {places.map((place) => {
        const explored = isExplored(place.id);

        return (
          <Circle
            key={`exploration-${place.id}`}
            center={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            radius={CIRCLE_RADIUS}
            fillColor={explored ? 'rgba(39, 174, 96, 0.15)' : 'rgba(149, 165, 166, 0.1)'}
            strokeColor={explored ? 'rgba(39, 174, 96, 0.3)' : 'rgba(149, 165, 166, 0.2)'}
            strokeWidth={2}
            zIndex={-1}
          />
        );
      })}
    </>
  );
}
