import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import { useRouter } from "expo-router";
import { Place } from "../types";
import { useLocation } from "../context/LocationContext";
import { useTheme, type Colors } from "../theme/ThemeContext";
import {
  searchGooglePlaces,
  searchNearbyPlaces,
} from "../services/googlePlaces";
import { fonts } from "../theme/fonts";
import { HapticPressable } from "../components/HapticPressable";

export function PlaceSearchSheet() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location: userLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);

  // Fetch nearby places when location is available
  useEffect(() => {
    if (!userLocation) return;

    let cancelled = false;
    (async () => {
      try {
        setSearching(true);
        const nearby = await searchNearbyPlaces(
          userLocation.latitude,
          userLocation.longitude,
          100
        );
        if (!cancelled) {
          setNearbyPlaces(nearby);
          setSearching(false);
        }
      } catch (error) {
        console.error("Error fetching nearby places:", error);
        if (!cancelled) setSearching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userLocation]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await searchGooglePlaces(
          query,
          userLocation?.latitude,
          userLocation?.longitude
        );
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    },
    [userLocation]
  );

  const displayedPlaces =
    searchQuery.trim().length >= 2 ? searchResults : nearbyPlaces;

  const getCategoryIcon = (category: Place["category"]): { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap } => {
    switch (category) {
      case "cafe":
        return { sf: "cup.and.saucer.fill", fallback: "cafe" };
      case "restaurant":
        return { sf: "fork.knife", fallback: "restaurant" };
      case "bar":
        return { sf: "wineglass.fill", fallback: "wine" };
      case "park":
        return { sf: "leaf.fill", fallback: "leaf" };
      case "attraction":
        return { sf: "star.fill", fallback: "star" };
      case "venue":
        return { sf: "music.note.list", fallback: "musical-notes" };
      case "trail":
        return { sf: "figure.hiking", fallback: "walk" };
      default:
        return { sf: "mappin", fallback: "location" };
    }
  };

  const handleSelectPlace = (place: Place) => {
    Keyboard.dismiss();
    // Store selection temporarily in global for the create sheet to pick up
    (global as any).__selectedPlace = place;
    // Navigate back
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchHeader}>
        <HapticPressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <SFIcon name="chevron.left" fallback="arrow-back" size={24} color={colors.text} />
        </HapticPressable>
        <View style={styles.searchInputContainer}>
          <SFIcon name="magnifyingglass" fallback="search" size={18} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for places in Wellington..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          {searching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
      </View>

      <FlatList
        data={displayedPlaces}
        keyExtractor={(item, index) => item.id || `search-${index}`}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SFIcon
              name="mappin"
              fallback="location-outline"
              size={48}
              color={colors.gray300}
            />
            <Text style={styles.emptyStateText}>
              {searchQuery.trim().length >= 2
                ? "No places found. Try a different search."
                : "Start typing to search for places"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <HapticPressable
            style={styles.placeItem}
            onPress={() => handleSelectPlace(item)}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: (colors.category as Record<string, string>)[item.category] + "20" },
              ]}
            >
              <SFIcon
                name={getCategoryIcon(item.category).sf}
                fallback={getCategoryIcon(item.category).fallback}
                size={18}
                color={(colors.category as Record<string, string>)[item.category]}
              />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeAddress}>{item.address}</Text>
            </View>
            <SFIcon name="chevron.right" fallback="chevron-forward" size={20} color={colors.gray400} />
          </HapticPressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
