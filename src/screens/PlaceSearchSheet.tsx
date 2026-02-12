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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Place } from "../types";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { getPlaces } from "../services/places";
import { searchGooglePlaces } from "../services/googlePlaces";
import { HapticPressable } from "../components/HapticPressable";

export function PlaceSearchSheet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnRoute?: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { data: places } = useQuery(getPlaces);
  const allPlaces = places ?? [];

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchGooglePlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  const displayedPlaces =
    searchQuery.trim().length >= 2 ? searchResults : allPlaces;

  const handleSelectPlace = (place: Place) => {
    Keyboard.dismiss();
    // Store selection temporarily in global for the create sheet to pick up
    (global as any).__selectedPlace = place;
    // Navigate back
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HapticPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticPressable>
        <Text style={styles.headerTitle}>Search Places</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray400} />
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
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <FlatList
        data={displayedPlaces}
        keyExtractor={(item, index) => item.id || `search-${index}`}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="location-outline"
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
                styles.categoryDot,
                { backgroundColor: colors.category[item.category] },
              ]}
            />
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeAddress}>{item.address}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.gray400}
            />
          </HapticPressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
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
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
