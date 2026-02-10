import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PopularityMarker } from './PopularityMarker';
import { PeekingMarker, Edge } from '../hooks/usePeekingMarkers';

const MARKER_SIZE = 28;
const PEEK_RATIO = 0.55;
const HIDDEN_AMOUNT = 1 - PEEK_RATIO;

interface PeekingMarkersOverlayProps {
  markers: PeekingMarker[];
  mapWidth: number;
  mapHeight: number;
  onPress: (marker: PeekingMarker) => void;
}

function getMarkerPosition(edge: Edge, edgePosition: number, mapWidth: number, mapHeight: number) {
  switch (edge) {
    case 'top': {
      const left = edgePosition * mapWidth - MARKER_SIZE / 2;
      return {
        position: 'absolute' as const,
        top: -(MARKER_SIZE * HIDDEN_AMOUNT),
        left: Math.max(4, Math.min(left, mapWidth - MARKER_SIZE - 4)),
      };
    }
    case 'bottom': {
      const left = edgePosition * mapWidth - MARKER_SIZE / 2;
      return {
        position: 'absolute' as const,
        bottom: -(MARKER_SIZE * HIDDEN_AMOUNT),
        left: Math.max(4, Math.min(left, mapWidth - MARKER_SIZE - 4)),
      };
    }
    case 'left': {
      const top = edgePosition * mapHeight - MARKER_SIZE / 2;
      return {
        position: 'absolute' as const,
        left: -(MARKER_SIZE * HIDDEN_AMOUNT),
        top: Math.max(4, Math.min(top, mapHeight - MARKER_SIZE - 4)),
      };
    }
    case 'right': {
      const top = edgePosition * mapHeight - MARKER_SIZE / 2;
      return {
        position: 'absolute' as const,
        right: -(MARKER_SIZE * HIDDEN_AMOUNT),
        top: Math.max(4, Math.min(top, mapHeight - MARKER_SIZE - 4)),
      };
    }
  }
}

function getStripStyle(edge: Edge) {
  switch (edge) {
    case 'top':
      return styles.stripTop;
    case 'bottom':
      return styles.stripBottom;
    case 'left':
      return styles.stripLeft;
    case 'right':
      return styles.stripRight;
  }
}

export function PeekingMarkersOverlay({
  markers,
  mapWidth,
  mapHeight,
  onPress,
}: PeekingMarkersOverlayProps) {
  if (markers.length === 0 || mapWidth === 0) return null;

  const byEdge: Record<Edge, PeekingMarker[]> = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };

  for (const marker of markers) {
    byEdge[marker.edge].push(marker);
  }

  const edges: Edge[] = ['top', 'bottom', 'left', 'right'];

  return (
    <>
      {edges.map((edge) => {
        const edgeMarkers = byEdge[edge];
        if (edgeMarkers.length === 0) return null;

        return (
          <View key={edge} style={[styles.strip, getStripStyle(edge)]} pointerEvents="box-none">
            {edgeMarkers.map((marker) => {
              const pos = getMarkerPosition(edge, marker.edgePosition, mapWidth, mapHeight);

              return (
                <TouchableOpacity
                  key={marker.place.id}
                  style={[styles.marker, pos]}
                  onPress={() => onPress(marker)}
                  activeOpacity={0.7}
                >
                  <PopularityMarker
                    size={MARKER_SIZE}
                    category={marker.category}
                    postCount={marker.postCount}
                    isFollowed={marker.isFollowed}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  stripTop: {
    top: 130,
    left: 0,
    right: 0,
    height: MARKER_SIZE,
  },
  stripBottom: {
    bottom: 70,
    left: 0,
    right: 0,
    height: MARKER_SIZE,
  },
  stripLeft: {
    top: 130,
    bottom: 70,
    left: 0,
    width: MARKER_SIZE,
  },
  stripRight: {
    top: 130,
    bottom: 70,
    right: 0,
    width: MARKER_SIZE,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    opacity: 0.6,
  },
});
