import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
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
import { SFIcon } from "../components/SFIcon";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Place, PostType, EventCategory } from "../types";
import type { MediaPickerItem } from "../components/create/PostForm";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useExploration } from "../context/ExplorationContext";
import { useToast } from "../context/ToastContext";
import { findOrCreatePlace, getPlaceById } from "../services/places";
import { createPost } from "../services/posts";
import { uploadMedia } from "../services/storage";
import { createEvent } from "../services/events";
import { createAchievementToast } from "../utils/achievementHelpers";
import { compressMedia, compressAvatar } from "../utils/compressMedia";
import { fonts } from "../theme/fonts";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { PlacePicker } from "../components/create/PlacePicker";
import { PostForm } from "../components/create/PostForm";
import { EventForm } from "../components/create/EventForm";

const glassEnabled = isLiquidGlassAvailable();

type CreateType = "post" | "event";

export function CreatePostSheetScreen() {
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
  const [mediaItems, setMediaItems] = useState<MediaPickerItem[]>([]);

  // Event-specific state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("music");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [eventImageUri, setEventImageUri] = useState<string | null>(null);
  const [eventPrice, setEventPrice] = useState("");

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
          mediaFiles?: Array<{
            uri: string;
            type: 'photo' | 'video';
            width?: number;
            height?: number;
          }>;
        }
      | undefined;
    if (!shared) return;
    delete (global as any).__sharedIntent;

    if (shared.mediaFiles && shared.mediaFiles.length > 0) {
      // Multi-file share
      const hasVideo = shared.mediaFiles.some((f) => f.type === 'video');
      setPostType(hasVideo ? 'video' : 'photo');
      setMediaItems(shared.mediaFiles);
    } else if (shared.videoUri) {
      setPostType("video");
      setMediaItems([{
        uri: shared.videoUri,
        type: 'video',
        width: shared.mediaWidth,
        height: shared.mediaHeight,
      }]);
    } else if (shared.imageUri) {
      setPostType("photo");
      setMediaItems([{
        uri: shared.imageUri,
        type: 'photo',
        width: shared.mediaWidth,
        height: shared.mediaHeight,
      }]);
    }
    if (shared.text) {
      setContent(shared.text);
    }
  }, []);

  useEffect(() => {
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
    const remaining = 5 - mediaItems.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newItems: MediaPickerItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: (asset.type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
        width: asset.width || undefined,
        height: asset.height || undefined,
      }));
      setMediaItems((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const pickEventImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEventImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!profile) {
      Alert.alert(
        "Not signed in",
        `Please sign in to create ${createType === "post" ? "a post" : "an event"}`
      );
      return;
    }
    if (!selectedPlace) {
      Alert.alert("Select a place", `Please select a place for your ${createType}`);
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
        let coverMediaUrl: string | undefined;
        let coverWidth: number | undefined;
        let coverHeight: number | undefined;
        let uploadedMediaItems: Array<{
          mediaUrl: string;
          mediaType: 'photo' | 'video';
          mediaWidth?: number;
          mediaHeight?: number;
          sortOrder: number;
        }> | undefined;

        if (mediaItems.length > 0 && postType !== "text") {
          // Compress and upload all media in parallel
          const uploadResults = await Promise.all(
            mediaItems.map(async (item, index) => {
              const compressedUri = await compressMedia(item.uri, item.type);
              const extension = item.type === "video" ? "mp4" : "jpg";
              const mimeType = item.type === "video" ? "video/mp4" : "image/jpeg";
              const fileName = `${profile.id}-${Date.now()}-${index}.${extension}`;
              const url = await uploadMedia(compressedUri, fileName, mimeType);
              return {
                mediaUrl: url,
                mediaType: item.type,
                mediaWidth: item.width,
                mediaHeight: item.height,
                sortOrder: index,
              };
            })
          );

          // Set cover to first item
          coverMediaUrl = uploadResults[0].mediaUrl;
          coverWidth = uploadResults[0].mediaWidth;
          coverHeight = uploadResults[0].mediaHeight;

          // Only create post_media rows for multi-media posts
          if (uploadResults.length > 1) {
            uploadedMediaItems = uploadResults;
          }
        }

        await createPost({
          userId: profile.id,
          placeId: placeId,
          type: postType,
          content: content.trim(),
          mediaUrl: coverMediaUrl,
          mediaWidth: coverWidth,
          mediaHeight: coverHeight,
          mediaItems: uploadedMediaItems,
        });

        const newAchievements = await markExplored(placeId, "posted");
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
                setMediaItems([]);
                router.dismiss();
              },
            },
          ]
        );
      } else {
        let imageUrl: string | undefined;

        if (eventImageUri) {
          const compressedUri = await compressMedia(eventImageUri, "photo");
          const fileName = `${profile.id}-event-${Date.now()}.jpg`;
          imageUrl = await uploadMedia(compressedUri, fileName, "image/jpeg");
        }

        const dateStr = eventDate!.toISOString().split("T")[0];
        const pad = (n: number) => n.toString().padStart(2, "0");
        const startTimeStr = `${pad(eventStartTime!.getHours())}:${pad(eventStartTime!.getMinutes())}`;
        const endTimeStr = eventEndTime
          ? `${pad(eventEndTime.getHours())}:${pad(eventEndTime.getMinutes())}`
          : undefined;

        await createEvent({
          title: eventTitle.trim(),
          description: eventDescription.trim(),
          placeId: placeId,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          imageUrl,
          category: eventCategory,
          creatorId: profile.id,
          price: eventPrice.trim() ? parseFloat(eventPrice) || null : null,
        });

        Alert.alert(
          "Event Created!",
          `"${eventTitle}" at ${selectedPlace.name} has been created.`,
          [
            {
              text: "OK",
              onPress: () => {
                setEventTitle("");
                setEventDescription("");
                setEventDate(null);
                setEventStartTime(null);
                setEventEndTime(null);
                setEventImageUri(null);
                setEventPrice("");
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
        eventDate !== null &&
        eventStartTime !== null
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
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <HapticPressable
                  onPress={() => router.dismiss()}
                  style={styles.closeButton}
                >
                  <SFIcon name="xmark" fallback="close" size={24} color={colors.text} />
                </HapticPressable>
              </View>
              <View style={styles.headerCenter}>
                {glassEnabled ? (
                  <GlassView style={styles.segmentControlGlass} glassEffectStyle="regular">
                    <HapticPressable
                      style={[styles.segment, createType === "post" && styles.segmentActiveGlass]}
                      onPress={() => setCreateType("post")}
                    >
                      <Text style={[styles.segmentText, createType === "post" && styles.segmentTextActive]}>
                        Post
                      </Text>
                    </HapticPressable>
                    <HapticPressable
                      style={[styles.segment, createType === "event" && styles.segmentActiveGlass]}
                      onPress={() => setCreateType("event")}
                    >
                      <Text style={[styles.segmentText, createType === "event" && styles.segmentTextActive]}>
                        Event
                      </Text>
                    </HapticPressable>
                  </GlassView>
                ) : (
                  <View style={styles.segmentControl}>
                    <HapticPressable
                      style={[styles.segment, createType === "post" && styles.segmentActive]}
                      onPress={() => setCreateType("post")}
                    >
                      <Text style={[styles.segmentText, createType === "post" && styles.segmentTextActive]}>
                        Post
                      </Text>
                    </HapticPressable>
                    <HapticPressable
                      style={[styles.segment, createType === "event" && styles.segmentActive]}
                      onPress={() => setCreateType("event")}
                    >
                      <Text style={[styles.segmentText, createType === "event" && styles.segmentTextActive]}>
                        Event
                      </Text>
                    </HapticPressable>
                  </View>
                )}
              </View>
              <View style={styles.headerRight}>
                <LiquidGlassButton
                  title="Create"
                  onPress={handleSubmit}
                  disabled={!isFormValid() || posting}
                  size="medium"
                />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <PlacePicker
              selectedPlace={selectedPlace}
              onPress={() => router.push("./place-search")}
              onClear={() => setSelectedPlace(null)}
            />

            {createType === "post" ? (
              <PostForm
                avatarUrl={profile?.avatarUrl}
                content={content}
                onContentChange={setContent}
                postType={postType}
                onPostTypeChange={setPostType}
                mediaItems={mediaItems}
                onPickMedia={pickMedia}
                onRemoveMedia={(index) => {
                  setMediaItems((prev) => prev.filter((_, i) => i !== index));
                }}
              />
            ) : (
              <EventForm
                title={eventTitle}
                onTitleChange={setEventTitle}
                category={eventCategory}
                onCategoryChange={setEventCategory}
                imageUri={eventImageUri}
                onPickImage={pickEventImage}
                date={eventDate}
                onDateChange={setEventDate}
                startTime={eventStartTime}
                onStartTimeChange={setEventStartTime}
                endTime={eventEndTime}
                onEndTimeChange={setEventEndTime}
                description={eventDescription}
                onDescriptionChange={setEventDescription}
                price={eventPrice}
                onPriceChange={setEventPrice}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full screen progress overlay */}
      <Modal visible={posting} transparent animationType="fade" statusBarTranslucent>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 24,
    alignItems: "center",
    gap: 16,
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
  segmentControlGlass: {
    flexDirection: "row",
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
  segmentActiveGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  content: {
    paddingHorizontal: 16,
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
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  progressSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
