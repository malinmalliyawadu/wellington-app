import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Place, PostType, EventCategory } from "../types";
import { colors } from "../theme/colors";
import { useQuery } from "../hooks/useQuery";
import { useAuth } from "../context/AuthContext";
import { getPlaces } from "../services/places";
import { createPost } from "../services/posts";
import { uploadMedia } from "../services/storage";
import { HapticPressable } from "src/components/HapticPressable";

const POST_TYPES: { type: PostType; icon: string; label: string }[] = [
  { type: "photo", icon: "image", label: "Photo" },
  { type: "video", icon: "videocam", label: "Video" },
  { type: "text", icon: "document-text", label: "Text" },
];

const EVENT_CATEGORIES: { type: EventCategory; label: string }[] = [
  { type: "music", label: "Music" },
  { type: "comedy", label: "Comedy" },
  { type: "art", label: "Art" },
  { type: "food", label: "Food" },
  { type: "market", label: "Market" },
  { type: "community", label: "Community" },
];

type CreateType = "post" | "event";

export function CreatePostSheetScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { placeId: placeIdParam, defaultType } = useLocalSearchParams<{
    placeId?: string;
    defaultType?: CreateType;
  }>();
  const router = useRouter();

  // Determine initial create type based on defaultType param (events tab -> event, otherwise -> post)
  const [createType, setCreateType] = useState<CreateType>(
    defaultType || "post"
  );

  // Post-specific state
  const [postType, setPostType] = useState<PostType>("photo");
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  // Event-specific state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("music");
  const [eventDate, setEventDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");

  // Shared state
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const { data: places } = useQuery(getPlaces);
  const allPlaces = places ?? [];

  useEffect(() => {
    if (placeIdParam && allPlaces.length > 0) {
      const place = allPlaces.find((p) => p.id === placeIdParam);
      if (place) {
        setSelectedPlace(place);
      }
      router.setParams({ placeId: undefined as any });
    }
  }, [placeIdParam, allPlaces]);

  const pickMedia = async () => {
    const mediaType =
      postType === "video"
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!profile) {
      Alert.alert(
        "Not signed in",
        `Please sign in to create ${
          createType === "post" ? "a post" : "an event"
        }`
      );
      return;
    }
    if (!selectedPlace) {
      Alert.alert(
        "Select a place",
        `Please select a place for your ${createType}`
      );
      return;
    }

    if (createType === "post") {
      if (!content.trim()) {
        Alert.alert("Add content", "Please write something about this place");
        return;
      }
    } else {
      if (!eventTitle.trim()) {
        Alert.alert("Add title", "Please add an event title");
        return;
      }
      if (!eventDate) {
        Alert.alert("Add date", "Please select an event date");
        return;
      }
      if (!eventStartTime) {
        Alert.alert("Add start time", "Please add a start time");
        return;
      }
    }

    setPosting(true);
    try {
      if (createType === "post") {
        let mediaUrl: string | undefined;

        if (mediaUri && postType !== "text") {
          const extension = postType === "video" ? "mp4" : "jpg";
          const mimeType = postType === "video" ? "video/mp4" : "image/jpeg";
          const fileName = `${profile.id}-${Date.now()}.${extension}`;
          mediaUrl = await uploadMedia(mediaUri, fileName, mimeType);
        }

        await createPost({
          userId: profile.id,
          placeId: selectedPlace.id,
          type: postType,
          content: content.trim(),
          mediaUrl,
        });

        Alert.alert(
          "Posted!",
          `Your ${postType} post about ${selectedPlace.name} has been shared.`,
          [
            {
              text: "OK",
              onPress: () => {
                setContent("");
                setSelectedPlace(null);
                setMediaUri(null);
                router.dismiss();
              },
            },
          ]
        );
      } else {
        // TODO: Implement event creation
        Alert.alert(
          "Success!",
          `Event "${eventTitle}" at ${selectedPlace.name} has been created.`,
          [
            {
              text: "OK",
              onPress: () => {
                setEventTitle("");
                setEventDescription("");
                setEventDate("");
                setEventStartTime("");
                setEventEndTime("");
                setSelectedPlace(null);
                router.dismiss();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message ?? `Failed to create ${createType}`);
    } finally {
      setPosting(false);
    }
  };

  const isFormValid = () => {
    if (!selectedPlace) return false;
    if (createType === "post") {
      return content.trim().length > 0;
    } else {
      return (
        eventTitle.trim().length > 0 &&
        eventDate.length > 0 &&
        eventStartTime.length > 0
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HapticPressable
            onPress={() => router.dismiss()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </HapticPressable>
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.segmentControl}>
            <HapticPressable
              style={[
                styles.segment,
                createType === "post" && styles.segmentActive,
              ]}
              onPress={() => setCreateType("post")}
            >
              <Text
                style={[
                  styles.segmentText,
                  createType === "post" && styles.segmentTextActive,
                ]}
              >
                Post
              </Text>
            </HapticPressable>
            <HapticPressable
              style={[
                styles.segment,
                createType === "event" && styles.segmentActive,
              ]}
              onPress={() => setCreateType("event")}
            >
              <Text
                style={[
                  styles.segmentText,
                  createType === "event" && styles.segmentTextActive,
                ]}
              >
                Event
              </Text>
            </HapticPressable>
          </View>
        </View>
        <View style={styles.headerRight}>
          <HapticPressable
            style={[
              styles.postButton,
              (!isFormValid() || posting) && styles.postButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={posting || !isFormValid()}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>
                {createType === "post" ? "Post" : "Create"}
              </Text>
            )}
          </HapticPressable>
        </View>
      </View>

      <View style={styles.content}>
        {createType === "post" ? (
          <>
            <Text style={styles.label}>Post Type</Text>
            <View style={styles.typeRow}>
              {POST_TYPES.map((item) => (
                <HapticPressable
                  key={item.type}
                  style={[
                    styles.typeButton,
                    postType === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setPostType(item.type);
                    setMediaUri(null);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={
                      postType === item.type ? colors.primary : colors.gray400
                    }
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      postType === item.type && styles.typeLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </HapticPressable>
              ))}
            </View>

            {postType !== "text" && (
              <HapticPressable style={styles.mediaButton} onPress={pickMedia}>
                {mediaUri ? (
                  <Image
                    source={{ uri: mediaUri }}
                    style={styles.mediaPreview}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={postType === "photo" ? "camera" : "videocam"}
                      size={32}
                      color={colors.gray400}
                    />
                    <Text style={styles.mediaButtonText}>
                      Tap to add {postType}
                    </Text>
                  </>
                )}
              </HapticPressable>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>Event Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Live Jazz Night"
              placeholderTextColor={colors.gray400}
              value={eventTitle}
              onChangeText={setEventTitle}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.typeRow}>
              {EVENT_CATEGORIES.slice(0, 3).map((item) => (
                <HapticPressable
                  key={item.type}
                  style={[
                    styles.typeButton,
                    eventCategory === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => setEventCategory(item.type)}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      eventCategory === item.type && styles.typeLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </HapticPressable>
              ))}
            </View>
            <View style={[styles.typeRow, { marginTop: 8 }]}>
              {EVENT_CATEGORIES.slice(3).map((item) => (
                <HapticPressable
                  key={item.type}
                  style={[
                    styles.typeButton,
                    eventCategory === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => setEventCategory(item.type)}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      eventCategory === item.type && styles.typeLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </HapticPressable>
              ))}
            </View>

            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray400}
                value={eventDate}
                onChangeText={setEventDate}
              />
            </View>
            <View style={[styles.dateTimeRow, { marginTop: 8 }]}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Start (e.g. 19:00)"
                placeholderTextColor={colors.gray400}
                value={eventStartTime}
                onChangeText={setEventStartTime}
              />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="End (optional)"
                placeholderTextColor={colors.gray400}
                value={eventEndTime}
                onChangeText={setEventEndTime}
              />
            </View>
          </>
        )}

        <Text style={styles.label}>Place</Text>
        <HapticPressable
          style={styles.placeSelector}
          onPress={() => setShowPlacePicker(!showPlacePicker)}
        >
          {selectedPlace ? (
            <View style={styles.selectedPlace}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.selectedPlaceText}>{selectedPlace.name}</Text>
            </View>
          ) : (
            <View style={styles.selectedPlace}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.gray400}
              />
              <Text style={styles.placeholderText}>Select a place</Text>
            </View>
          )}
          <Ionicons
            name={showPlacePicker ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.gray400}
          />
        </HapticPressable>

        {showPlacePicker && (
          <View style={styles.placeList}>
            <ScrollView style={styles.placeScrollView} nestedScrollEnabled>
              {allPlaces.map((place) => (
                <HapticPressable
                  key={place.id}
                  style={[
                    styles.placeItem,
                    selectedPlace?.id === place.id && styles.placeItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPlace(place);
                    setShowPlacePicker(false);
                  }}
                >
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: colors.category[place.category] },
                    ]}
                  />
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress}>{place.address}</Text>
                  </View>
                  {selectedPlace?.id === place.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </HapticPressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>
          {createType === "post" ? "What do you want to share?" : "Description"}
        </Text>
        <TextInput
          style={[styles.textInput, { height: 120 }]}
          placeholder={
            createType === "post"
              ? "Write about this place..."
              : "Tell people about this event..."
          }
          placeholderTextColor={colors.gray400}
          multiline
          value={createType === "post" ? content : eventDescription}
          onChangeText={
            createType === "post" ? setContent : setEventDescription
          }
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  headerLeft: {},
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  closeButton: {
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
  segmentControl: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
  },
  segmentActive: {
    backgroundColor: colors.background,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: "600",
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  postButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  postButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  typeLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray500,
  },
  typeLabelActive: {
    color: colors.primary,
  },
  mediaButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: "dashed",
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
  },
  placeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  selectedPlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedPlaceText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.gray400,
  },
  placeList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.background,
    maxHeight: 250,
    overflow: "hidden",
  },
  placeScrollView: {
    maxHeight: 250,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  placeItemSelected: {
    backgroundColor: colors.primary + "10",
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  placeAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  textInput: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
    fontSize: 15,
    color: colors.text,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
});
