import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { SFIcon } from "../components/SFIcon";
import { HapticPressable } from "../components/HapticPressable";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useQuery } from "../hooks/useQuery";
import {
  getGuideById,
  getGuidePlaces,
  createGuide,
  updateGuide,
  addPlaceToGuide,
  removePlaceFromGuide,
} from "../services/guides";
import { getPlacesByIds, findOrCreatePlace } from "../services/places";
import { searchGooglePlaces } from "../services/googlePlaces";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import type { Place, PlaceCategory } from "../types";

const CATEGORY_ICONS: Record<PlaceCategory, { sf: string; fallback: string }> =
  {
    cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
    restaurant: { sf: "fork.knife", fallback: "restaurant" },
    bar: { sf: "wineglass.fill", fallback: "wine" },
    attraction: { sf: "safari", fallback: "compass" },
    park: { sf: "leaf.fill", fallback: "leaf" },
    venue: { sf: "music.note.list", fallback: "musical-notes" },
    trail: { sf: "figure.hiking", fallback: "walk" },
  };

interface SelectedPlace {
  place: Place;
  note: string;
}

export function CreateGuideScreen() {
  const { guideId } = useLocalSearchParams<{ guideId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isEditing = !!guideId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; address: string; placeId?: string; category?: PlaceCategory; latitude?: number; longitude?: number }[]
  >([]);
  const [, setSearching] = useState(false);

  // Load existing guide for editing
  const fetchGuide = useCallback(
    () => (guideId ? getGuideById(guideId) : Promise.resolve(null)),
    [guideId]
  );
  const { data: existingGuide } = useQuery(fetchGuide, [
    "guide",
    guideId ?? "",
  ]);

  const fetchGuidePlaces = useCallback(
    () => (guideId ? getGuidePlaces(guideId) : Promise.resolve([])),
    [guideId]
  );
  const { data: existingGuidePlaces } = useQuery(fetchGuidePlaces, [
    "guide-places",
    guideId ?? "",
  ]);

  const existingPlaceIds = useMemo(
    () => (existingGuidePlaces ?? []).map((gp) => gp.placeId),
    [existingGuidePlaces]
  );
  const fetchExistingPlaces = useCallback(
    () => getPlacesByIds(existingPlaceIds),
    [existingPlaceIds]
  );
  const { data: existingPlaceData } = useQuery(fetchExistingPlaces, [
    "places",
    ...existingPlaceIds,
  ]);

  // Populate form when editing
  useEffect(() => {
    if (existingGuide && isEditing) {
      setTitle(existingGuide.title);
      setDescription(existingGuide.description ?? "");
    }
  }, [existingGuide, isEditing]);

  useEffect(() => {
    if (existingGuidePlaces && existingPlaceData && isEditing) {
      const placeMap = new Map(existingPlaceData.map((p) => [p.id, p]));
      const sorted = [...existingGuidePlaces].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      setSelectedPlaces(
        sorted
          .map((gp) => {
            const place = placeMap.get(gp.placeId);
            if (!place) return null;
            return { place, note: gp.note ?? "" };
          })
          .filter((sp): sp is SelectedPlace => sp !== null)
      );
    }
  }, [existingGuidePlaces, existingPlaceData, isEditing]);

  // Search places
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchGooglePlaces(searchQuery);
        setSearchResults(
          results.map((r) => ({
            name: r.name,
            address: r.address,
            placeId: r.googlePlaceId,
            category: r.category,
            latitude: r.latitude,
            longitude: r.longitude,
          }))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddPlace = useCallback(
    async (result: (typeof searchResults)[0]) => {
      try {
        // Find or create the place
        const place = await findOrCreatePlace({
          name: result.name,
          address: result.address,
          googlePlaceId: result.placeId,
          category: result.category ?? "attraction",
          latitude: result.latitude ?? -41.2865,
          longitude: result.longitude ?? 174.7762,
        });

        // Check for duplicates
        if (selectedPlaces.some((sp) => sp.place.id === place.id)) {
          showToast({ message: "This place is already in the guide" });
          return;
        }

        setSelectedPlaces((prev) => [...prev, { place, note: "" }]);
        setSearchQuery("");
        setSearchResults([]);
      } catch {
        Alert.alert("Error", "Failed to add place");
      }
    },
    [selectedPlaces, showToast]
  );

  const handleRemovePlace = useCallback((index: number) => {
    setSelectedPlaces((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateNote = useCallback((index: number, note: string) => {
    setSelectedPlaces((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, note } : sp))
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for your guide");
      return;
    }
    if (selectedPlaces.length === 0) {
      Alert.alert(
        "No places",
        "Please add at least one place to your guide"
      );
      return;
    }

    setSaving(true);
    try {
      if (isEditing && guideId) {
        // Update guide metadata
        await updateGuide(guideId, {
          title: title.trim(),
          description: description.trim() || undefined,
        });

        // Remove all existing places and re-add
        const existingIds = (existingGuidePlaces ?? []).map((gp) => gp.placeId);
        for (const placeId of existingIds) {
          await removePlaceFromGuide(guideId, placeId);
        }
        for (let i = 0; i < selectedPlaces.length; i++) {
          await addPlaceToGuide(
            guideId,
            selectedPlaces[i].place.id,
            i,
            selectedPlaces[i].note || undefined
          );
        }
      } else {
        // Create new guide
        const guide = await createGuide({
          userId: profile.id,
          title: title.trim(),
          description: description.trim() || undefined,
        });

        // Add places
        for (let i = 0; i < selectedPlaces.length; i++) {
          await addPlaceToGuide(
            guide.id,
            selectedPlaces[i].place.id,
            i,
            selectedPlaces[i].note || undefined
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["q", "guides"] });
      queryClient.invalidateQueries({ queryKey: ["q", "guide"] });
      showToast({ message: isEditing ? "Guide updated" : "Guide created" });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save guide");
    } finally {
      setSaving(false);
    }
  }, [
    profile,
    title,
    description,
    selectedPlaces,
    isEditing,
    guideId,
    existingGuidePlaces,
    queryClient,
    showToast,
    router,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <HapticPressable onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </HapticPressable>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Guide" : "New Guide"}
            </Text>
            <HapticPressable onPress={handleSave} disabled={saving}>
              <Text
                style={[styles.saveText, saving && { opacity: 0.5 }]}
              >
                {saving ? "Saving..." : "Save"}
              </Text>
            </HapticPressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.formSection}>
            <TextInput
              style={styles.titleInput}
              placeholder="Guide title"
              placeholderTextColor={colors.gray400}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (optional)"
              placeholderTextColor={colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />

            <Text style={styles.sectionTitle}>Places</Text>
          </View>

          {selectedPlaces.map((item, index) => (
            <View key={index} style={styles.selectedPlaceRow}>
              <View style={styles.placeNumber}>
                <Text style={styles.placeNumberText}>{index + 1}</Text>
              </View>
              <View
                style={[
                  styles.placeCategoryDot,
                  {
                    backgroundColor:
                      colors.category[item.place.category],
                  },
                ]}
              >
                <SFIcon
                  name={
                    CATEGORY_ICONS[item.place.category].sf as any
                  }
                  fallback={
                    CATEGORY_ICONS[item.place.category]
                      .fallback as any
                  }
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.selectedPlaceInfo}>
                <Text style={styles.selectedPlaceName} numberOfLines={1}>
                  {item.place.name}
                </Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.gray400}
                  value={item.note}
                  onChangeText={(text) => handleUpdateNote(index, text)}
                  maxLength={200}
                />
              </View>
              <HapticPressable
                onPress={() => handleRemovePlace(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SFIcon
                  name="xmark.circle.fill"
                  fallback="close-circle"
                  size={20}
                  color={colors.gray400}
                />
              </HapticPressable>
            </View>
          ))}

          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <SFIcon
                name="magnifyingglass"
                fallback="search"
                size={16}
                color={colors.gray400}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a place to add..."
                placeholderTextColor={colors.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {searchResults.map((result, index) => (
              <HapticPressable
                key={`${result.placeId ?? result.name}-${index}`}
                style={styles.searchResultRow}
                onPress={() => handleAddPlace(result)}
              >
                <SFIcon
                  name="mappin"
                  fallback="location"
                  size={16}
                  color={colors.textSecondary}
                />
                <View style={styles.searchResultInfo}>
                  <Text
                    style={styles.searchResultName}
                    numberOfLines={1}
                  >
                    {result.name}
                  </Text>
                  <Text
                    style={styles.searchResultAddress}
                    numberOfLines={1}
                  >
                    {result.address}
                  </Text>
                </View>
                <SFIcon
                  name="plus.circle"
                  fallback="add-circle-outline"
                  size={20}
                  color={colors.primary}
                />
              </HapticPressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.translucentCardBackground,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: colors.translucentCardBackground,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  saveText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 0,
  },
  formSection: {
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  descriptionInput: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
    paddingVertical: 12,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  selectedPlaceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: 10,
  },
  placeNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  placeNumberText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  placeCategoryDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPlaceInfo: {
    flex: 1,
  },
  selectedPlaceName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  noteInput: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    paddingVertical: 2,
  },
  searchSection: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  searchResultAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
