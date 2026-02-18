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
import { SFSymbol } from "expo-symbols";
import { SFIcon } from "../components/SFIcon";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Place, PostType, EventCategory } from "../types";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useExploration } from "../context/ExplorationContext";
import { useToast } from "../context/ToastContext";
import { findOrCreatePlace, getPlaceById } from "../services/places";
import { createPost } from "../services/posts";
import { uploadMedia } from "../services/storage";
import { createAchievementToast } from "../utils/achievementHelpers";
import { PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { VideoPlayer } from "../components/VideoPlayer";

const POST_TYPES: { type: PostType; icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }; label: string }[] = [
  { type: "photo", icon: { sf: "photo.fill", fallback: "image" }, label: "Photo" },
  { type: "video", icon: { sf: "video.fill", fallback: "videocam" }, label: "Video" },
  { type: "text", icon: { sf: "doc.text.fill", fallback: "document-text" }, label: "Text" },
];

const EVENT_CATEGORIES: { type: EventCategory; label: string }[] = [
  { type: "music", label: "Music" },
  { type: "comedy", label: "Comedy" },
  { type: "art", label: "Art" },
  { type: "food", label: "Food" },
  { type: "market", label: "Market" },
  { type: "community", label: "Community" },
];

const MAX_CONTENT_LENGTH = 500;

type CreateType = "post" | "event";

export function CreatePostSheetScreen() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold });
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { markExplored } = useExploration();
  const { showToast } = useToast();
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
  const [mediaDimensions, setMediaDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

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
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  }, []);

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
      scrollViewRef.current?.scrollToEnd({ animated: true });
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

  // Handle content shared into the app (from Instagram, Safari, etc.)
  useEffect(() => {
    const shared = (global as any).__sharedIntent as
      | {
          text?: string;
          imageUri?: string;
          videoUri?: string;
          mediaWidth?: number;
          mediaHeight?: number;
        }
      | undefined;
    if (!shared) return;
    delete (global as any).__sharedIntent;

    if (shared.videoUri) {
      setPostType("video");
      setMediaUri(shared.videoUri);
    } else if (shared.imageUri) {
      setPostType("photo");
      setMediaUri(shared.imageUri);
    }
    if (shared.mediaWidth && shared.mediaHeight) {
      setMediaDimensions({
        width: shared.mediaWidth,
        height: shared.mediaHeight,
      });
    }
    if (shared.text) {
      setContent(shared.text);
    }
  }, []);

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
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      if (asset.width && asset.height) {
        setMediaDimensions({ width: asset.width, height: asset.height });
      }
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
          mediaWidth: mediaDimensions?.width,
          mediaHeight: mediaDimensions?.height,
        });

        // Mark place as explored via posting
        const newAchievements = await markExplored(placeId, 'posted');
        if (newAchievements.length > 0) {
          showToast(createAchievementToast(newAchievements[0]));
        }

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
                setMediaDimensions(null);
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
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? 350 : insets.bottom + 20,
          }}
        >
          {/* Header */}
          <View style={[styles.header, isScrolled && styles.headerScrolled]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 24,
                alignContent: "center",
                alignItems: "center",
                gap: 16,
              }}
            >
              <View style={styles.headerLeft}>
                <HapticPressable
                  onPress={() => router.dismiss()}
                  style={styles.closeButton}
                >
                  <SFIcon name="xmark" fallback="close" size={24} color={colors.text} />
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
                  title={"Create"}
                  onPress={handleSubmit}
                  disabled={!isFormValid() || posting}
                  size="medium"
                />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            {createType === "post" ? (
              <>
                {/* Composer: Avatar + Text Input */}
                <View style={styles.composerRow}>
                  {profile?.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={styles.composerAvatar}
                    />
                  ) : (
                    <View style={[styles.composerAvatar, styles.composerAvatarPlaceholder]}>
                      <SFIcon name="person.fill" fallback="person" size={20} color={colors.gray400} />
                    </View>
                  )}
                  <View style={styles.composerInputWrapper}>
                    <TextInput
                      style={styles.composerInput}
                      placeholder="What do you recommend?"
                      placeholderTextColor={colors.gray400}
                      multiline
                      value={content}
                      onChangeText={(text) => setContent(text.slice(0, MAX_CONTENT_LENGTH))}
                      textAlignVertical="top"
                      maxLength={MAX_CONTENT_LENGTH}
                    />
                    <Text style={styles.charCount}>
                      {content.length}/{MAX_CONTENT_LENGTH}
                    </Text>
                  </View>
                </View>

                {/* Place Tag */}
                {selectedPlace ? (
                  <View style={styles.placePillRow}>
                    <HapticPressable
                      style={styles.placePill}
                      onPress={() => router.push("./place-search")}
                    >
                      <SFIcon name="mappin" fallback="location" size={14} color={colors.primary} />
                      <Text style={styles.placePillText}>{selectedPlace.name}</Text>
                      <HapticPressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedPlace(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <SFIcon name="xmark" fallback="close" size={12} color={colors.primary} />
                      </HapticPressable>
                    </HapticPressable>
                    <Text style={styles.placePillAddress}>{selectedPlace.address}</Text>
                  </View>
                ) : (
                  <HapticPressable
                    style={styles.placeAddRow}
                    onPress={() => router.push("./place-search")}
                  >
                    <SFIcon name="mappin" fallback="location" size={16} color={colors.gray400} />
                    <Text style={styles.placeAddText}>Add a place</Text>
                  </HapticPressable>
                )}

                {/* Map Preview */}
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

                {/* Media Section */}
                {postType !== "text" && (
                  mediaUri ? (
                    <View style={styles.mediaPreviewContainer}>
                      {postType === "video" ? (
                        <VideoPlayer
                          uri={mediaUri}
                          style={styles.mediaPreview}
                          useNativeControls
                          isMuted
                        />
                      ) : (
                        <HapticPressable onPress={pickMedia}>
                          <Image
                            source={{ uri: mediaUri }}
                            style={styles.mediaPreview}
                          />
                        </HapticPressable>
                      )}
                      <HapticPressable style={styles.mediaChangeButton} onPress={pickMedia}>
                        <SFIcon name="arrow.triangle.2.circlepath" fallback="refresh" size={14} color={colors.primary} />
                        <Text style={styles.mediaChangeText}>Change</Text>
                      </HapticPressable>
                    </View>
                  ) : (
                    <HapticPressable style={styles.mediaButton} onPress={pickMedia}>
                      <SFIcon
                        name={postType === "photo" ? "camera.fill" : "video.fill"}
                        fallback={postType === "photo" ? "camera" : "videocam"}
                        size={28}
                        color={colors.gray400}
                      />
                      <Text style={styles.mediaButtonText}>
                        Add a {postType === "photo" ? "photo" : "video"}
                      </Text>
                    </HapticPressable>
                  )
                )}

                {/* Post Type Selector - compact pills */}
                <View style={styles.typePillRow}>
                  {POST_TYPES.map((item) => (
                    <HapticPressable
                      key={item.type}
                      style={[
                        styles.typePill,
                        postType === item.type && styles.typePillActive,
                      ]}
                      onPress={() => {
                        setPostType(item.type);
                        setMediaUri(null);
                        setMediaDimensions(null);
                      }}
                    >
                      <SFIcon
                        name={item.icon.sf}
                        fallback={item.icon.fallback}
                        size={16}
                        color={
                          postType === item.type
                            ? colors.primary
                            : colors.gray500
                        }
                      />
                      <Text
                        style={[
                          styles.typePillLabel,
                          postType === item.type && styles.typePillLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </HapticPressable>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Event Title - borderless */}
                <TextInput
                  style={styles.eventTitleInput}
                  placeholder="Event title..."
                  placeholderTextColor={colors.gray400}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                />

                {/* Category pills */}
                <View style={styles.typePillRow}>
                  {EVENT_CATEGORIES.slice(0, 3).map((item) => (
                    <HapticPressable
                      key={item.type}
                      style={[
                        styles.typePill,
                        eventCategory === item.type && styles.typePillActive,
                      ]}
                      onPress={() => setEventCategory(item.type)}
                    >
                      <Text
                        style={[
                          styles.typePillLabel,
                          eventCategory === item.type && styles.typePillLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </HapticPressable>
                  ))}
                </View>
                <View style={[styles.typePillRow, { marginTop: 8 }]}>
                  {EVENT_CATEGORIES.slice(3).map((item) => (
                    <HapticPressable
                      key={item.type}
                      style={[
                        styles.typePill,
                        eventCategory === item.type && styles.typePillActive,
                      ]}
                      onPress={() => setEventCategory(item.type)}
                    >
                      <Text
                        style={[
                          styles.typePillLabel,
                          eventCategory === item.type && styles.typePillLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </HapticPressable>
                  ))}
                </View>

                {/* Date & Time */}
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

                {/* Place Tag */}
                {selectedPlace ? (
                  <View style={[styles.placePillRow, { marginTop: 16 }]}>
                    <HapticPressable
                      style={styles.placePill}
                      onPress={() => router.push("./place-search")}
                    >
                      <SFIcon name="mappin" fallback="location" size={14} color={colors.primary} />
                      <Text style={styles.placePillText}>{selectedPlace.name}</Text>
                      <HapticPressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedPlace(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <SFIcon name="xmark" fallback="close" size={12} color={colors.primary} />
                      </HapticPressable>
                    </HapticPressable>
                    <Text style={styles.placePillAddress}>{selectedPlace.address}</Text>
                  </View>
                ) : (
                  <HapticPressable
                    style={[styles.placeAddRow, { marginTop: 16 }]}
                    onPress={() => router.push("./place-search")}
                  >
                    <SFIcon name="mappin" fallback="location" size={16} color={colors.gray400} />
                    <Text style={styles.placeAddText}>Add a place</Text>
                  </HapticPressable>
                )}

                {/* Map Preview */}
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

                {/* Description - borderless */}
                <TextInput
                  style={styles.eventDescriptionInput}
                  placeholder="Tell people about this event..."
                  placeholderTextColor={colors.gray400}
                  multiline
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  textAlignVertical="top"
                />
              </>
            )}
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
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  headerScrolled: {
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.background,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  content: {
    paddingHorizontal: 16,
  },

  // --- Composer (post flow) ---
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 4,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 2,
  },
  composerAvatarPlaceholder: {
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInputWrapper: {
    flex: 1,
  },
  composerInput: {
    fontSize: 16,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },

  // --- Place tag ---
  placePillRow: {
    marginTop: 16,
  },
  placePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  placePillText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.primary,
  },
  placePillAddress: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  placeAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
  },
  placeAddText: {
    fontSize: 15,
    color: colors.gray400,
    fontFamily: "PlusJakartaSans_500Medium",
  },

  // --- Map preview ---
  mapPreview: {
    marginTop: 12,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  map: {
    flex: 1,
  },

  // --- Media section ---
  mediaButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    overflow: "hidden",
  },
  mediaPreviewContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  mediaChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + "10",
  },
  mediaChangeText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.primary,
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray500,
    fontFamily: "PlusJakartaSans_500Medium",
  },

  // --- Post type pills ---
  typePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typePillActive: {
    backgroundColor: colors.primary + "12",
  },
  typePillLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: colors.gray500,
  },
  typePillLabelActive: {
    color: colors.primary,
  },

  // --- Event flow ---
  eventTitleInput: {
    fontSize: 20,
    color: colors.text,
    fontFamily: "PlusJakartaSans_600SemiBold",
    paddingTop: 4,
    paddingBottom: 12,
  },
  eventDescriptionInput: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "PlusJakartaSans_500Medium",
    minHeight: 100,
    marginTop: 16,
    paddingTop: 0,
  },

  // --- Event date/time (kept structured) ---
  label: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
    marginBottom: 10,
    marginTop: 20,
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

  // --- Progress overlay ---
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
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.text,
  },
  progressSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
