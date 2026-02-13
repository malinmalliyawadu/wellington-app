import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Place, PostType, EventCategory } from "../types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { findOrCreatePlace, getPlaceById } from "../services/places";
import { createPost } from "../services/posts";
import { uploadMedia } from "../services/storage";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";

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
  const {
    placeId: placeIdParam,
    defaultType,
    selectedPlaceData,
  } = useLocalSearchParams<{
    placeId?: string;
    defaultType?: CreateType;
    selectedPlaceData?: string;
  }>();
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);

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
  const [posting, setPosting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardWillShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Scroll to bottom when keyboard appears and padding is applied
  useEffect(() => {
    if (keyboardVisible) {
      // setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      // }, 0);
    }
  }, [keyboardVisible]);

  // Handle place selection from search sheet
  useFocusEffect(
    useCallback(() => {
      // Check for global selected place when screen comes into focus
      if ((global as any).__selectedPlace) {
        setSelectedPlace((global as any).__selectedPlace);
        delete (global as any).__selectedPlace;
      }
    }, [])
  );

  useEffect(() => {
    // Also handle place from params (alternative method)
    if (selectedPlaceData) {
      try {
        const place = JSON.parse(selectedPlaceData);
        setSelectedPlace(place);
        router.setParams({ selectedPlaceData: undefined as any });
      } catch (error) {
        console.error("Error parsing selected place:", error);
      }
    }
  }, [selectedPlaceData]);

  useEffect(() => {
    if (placeIdParam) {
      getPlaceById(placeIdParam).then((place) => {
        if (place) {
          setSelectedPlace(place);
        }
        router.setParams({ placeId: undefined as any });
      });
    }
  }, [placeIdParam]);

  const pickMedia = async () => {
    const mediaType =
      postType === "video"
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: false,
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
      // If the place doesn't have an ID (came from Google Places), find or create it
      let placeId = selectedPlace.id;
      if (!placeId) {
        const place = await findOrCreatePlace({
          name: selectedPlace.name,
          category: selectedPlace.category,
          address: selectedPlace.address,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          googlePlaceId: selectedPlace.googlePlaceId,
        });
        placeId = place.id;
      }

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
          placeId: placeId,
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
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          stickyHeaderIndices={[0]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? 350 : insets.bottom + 20,
          }}
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
              <LiquidGlassButton
                title={createType === "post" ? "Post" : "Create"}
                onPress={handleSubmit}
                disabled={!isFormValid() || posting}
                size="medium"
              />
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
                          postType === item.type
                            ? colors.primary
                            : colors.gray400
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
                  <HapticPressable
                    style={styles.mediaButton}
                    onPress={pickMedia}
                  >
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
              onPress={() => router.push("./place-search")}
            >
              {selectedPlace ? (
                <>
                  <View style={styles.selectedPlace}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.placeInfo}>
                      <Text style={styles.selectedPlaceText}>
                        {selectedPlace.name}
                      </Text>
                      <Text style={styles.selectedPlaceAddress}>
                        {selectedPlace.address}
                      </Text>
                    </View>
                  </View>
                  <HapticPressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedPlace(null);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.gray400}
                    />
                  </HapticPressable>
                </>
              ) : (
                <>
                  <View style={styles.selectedPlace}>
                    <Ionicons name="search" size={20} color={colors.gray400} />
                    <Text style={styles.placeholderText}>
                      Search for a place...
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.gray400}
                  />
                </>
              )}
            </HapticPressable>

            {selectedPlace && (
              <View style={styles.mapPreview}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedPlace.latitude,
                    longitude: selectedPlace.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedPlace.latitude,
                      longitude: selectedPlace.longitude,
                    }}
                    title={selectedPlace.name}
                  />
                </MapView>
              </View>
            )}

            <Text style={styles.label}>
              {createType === "post"
                ? "What do you want to share?"
                : "Description"}
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
      </KeyboardAvoidingView>

      {/* Full screen progress overlay */}
      <Modal
        visible={posting}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.progressOverlay}>
          <View style={styles.progressContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressText}>
              {createType === "post" ? "Posting..." : "Creating event..."}
            </Text>
            <Text style={styles.progressSubtext}>This may take a moment</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.translucentCardBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.translucentCardBackground,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },
  selectedPlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  placeInfo: {
    flex: 1,
  },
  selectedPlaceText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  selectedPlaceAddress: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.gray400,
  },
  mapPreview: {
    marginTop: 12,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  map: {
    flex: 1,
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
  progressOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  progressSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
