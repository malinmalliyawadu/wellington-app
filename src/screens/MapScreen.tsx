import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { PopularityMarker } from '../components/PopularityMarker';
import { useFollow } from '../context/FollowContext';
import { useMapFilters } from '../context/MapFilterContext';
import { useQuery } from '../hooks/useQuery';
import { getPlaces } from '../services/places';
import { getPosts } from '../services/posts';
import { getProfiles } from '../services/users';
import {
  computePlacePopularity,
  getMarkerSize,
  isFollowedPlace,
} from '../utils/placePopularity';
import { Place, User } from '../types';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { HapticPressable } from 'src/components/HapticPressable';
import { FloatingCreateButton } from 'src/components/FloatingCreateButton';
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { followingIds } = useFollow();
  const { selectedCategories, showFollowingOnly } = useMapFilters();

  const openPlaceSheet = useCallback((placeId: string) => {
    const path = `/map/place-posts/${placeId}` as const;
    if (router.canDismiss()) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  const [visibleRegion, setVisibleRegion] = useState<Region>(WELLINGTON_REGION);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const { data: places, loading: placesLoading } = useQuery(getPlaces);
  const allPlaces = places ?? [];
  const { data: allPosts, loading: postsLoading } = useQuery(getPosts);
  const { data: allUsers, loading: usersLoading } = useQuery(getProfiles);

  const isDataLoaded = !placesLoading && !postsLoading && !usersLoading;

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
  }, [allPlaces, selectedCategories, showFollowingOnly, popularityMap, followingIds]);

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

  const openFilters = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const activeFilterCount = (selectedCategories.length > 0 ? 1 : 0) + (showFollowingOnly ? 1 : 0);

  return (
    <View style={styles.container} onLayout={handleMapLayout}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={WELLINGTON_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={true}
        compassOffset={{ x: -320, y: 0 }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsPointsOfInterest={false}
      >
        {isDataLoaded && filteredPlaces.map((place) => {
          const popularity = popularityMap.get(place.id);
          const score = popularity?.score ?? 1;
          const postCount = popularity?.postCount ?? 0;
          const posterIds = popularity?.posterIds ?? [];
          const size = getMarkerSize(score, popularityMap);
          const followed = isFollowedPlace(posterIds, followingIds);
          const showLabel = annotatedPlaceIds.has(place.id);

          // Get poster avatars
          const posterAvatars = posterIds
            .slice(0, 8)
            .map(uid => userMap.get(uid)?.avatarUrl)
            .filter((url): url is string => !!url);

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
              <PopularityMarker
                size={size}
                category={place.category}
                postCount={postCount}
                isFollowed={followed}
                placeName={place.name}
                posterAvatars={posterAvatars}
                showLabel={showLabel}
              />
            </Marker.Animated>
          );
        })}
      </MapView>

      {!isDataLoaded && (
        <View style={[styles.loadingOverlay, { top: insets.top + 16 }]}>
          <BlurView intensity={15} tint="light" style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading places...</Text>
          </BlurView>
        </View>
      )}

      <View style={[styles.controlsWrapper, { top: insets.top + 8 }]}>
        <View style={styles.controlsContainer}>
          <BlurView
            intensity={10}
            tint="light"
            style={styles.controlsBlur}
          >
            <HapticPressable
              style={[
                styles.controlButton,
                styles.controlButtonTop,
                activeFilterCount > 0 && styles.controlButtonActive,
              ]}
              onPress={openFilters}
            >
              <Ionicons
                name="options"
                size={22}
                color={activeFilterCount > 0 ? '#FFFFFF' : colors.text}
              />
            </HapticPressable>

            <View style={styles.controlDivider} />

            <HapticPressable
              style={[styles.controlButton, styles.controlButtonBottom]}
              onPress={centerOnUser}
            >
              <Ionicons
                name={location ? 'navigate' : 'navigate-outline'}
                size={22}
                color={location ? colors.primary : colors.text}
              />
            </HapticPressable>
          </BlurView>
        </View>
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </View>

      <FloatingCreateButton />
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
  loadingOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  controlsWrapper: {
    position: 'absolute',
    right: 16,
    width: 52,
  },
  controlsContainer: {
    width: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlsBlur: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  controlButton: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonTop: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  controlButtonBottom: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
  },
  controlDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
});
