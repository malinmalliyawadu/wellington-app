import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFIcon } from "../components/SFIcon";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, usePathname, useFocusEffect } from "expo-router";
import { Place, PostType, EventCategory } from "../types";
import type { MediaPickerItem } from "../components/create/PostForm";
import { useTheme, type Colors } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useExploration } from "../context/ExplorationContext";
import { useToast } from "../context/ToastContext";
import { findOrCreatePlace, getPlaceById } from "../services/places";
import { createPost } from "../services/posts";
import { uploadMedia } from "../services/storage";
import { createEvent, updateEvent, getEventById } from "../services/events";
import { createAchievementToast } from "../utils/achievementHelpers";
import { compressMedia, compressAvatar } from "../utils/compressMedia";
import * as ExpoVideoThumbnails from "expo-video-thumbnails";
import { fonts } from "../theme/fonts";
import { HapticPressable } from "src/components/HapticPressable";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { PlacePicker } from "../components/create/PlacePicker";
import { PostForm } from "../components/create/PostForm";
import { EventForm } from "../components/create/EventForm";
import { HashtagKeyboardToolbar, HashtagInlineToolbar, HASHTAG_TOOLBAR_ID } from "../components/create/HashtagKeyboardToolbar";
import { useHashtagRecommendations } from "../hooks/useHashtagRecommendations";
import { detectHashtagAtCursor } from "../utils/hashtags";
import { detectMentionAtCursor, extractMentions } from "../utils/mentions";
import { useMentionSuggestions } from "../hooks/useMentionSuggestions";
import { MentionSuggestions } from "../components/create/MentionSuggestions";
import { getProfileByUsername } from "../services/users";
import { createMentionNotification } from "../services/notifications";

const glassEnabled = isLiquidGlassAvailable();

type CreateType = "post" | "event";

export function CreatePostSheetScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { markExplored } = useExploration();
  const { showToast } = useToast();
  const {
    placeId: placeIdParam,
    defaultType,
    selectedPlaceData,
    editEventId,
  } = useLocalSearchParams<{
    placeId?: string;
    defaultType?: CreateType;
    selectedPlaceData?: string;
    editEventId?: string;
  }>();
  const router = useRouter();
  const pathname = usePathname();
  const tabBase = "/" + pathname.split("/")[1];
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Determine initial create type based on defaultType param (events tab -> event, otherwise -> post)
  const [createType, setCreateType] = useState<CreateType>(
    editEventId ? "event" : defaultType || "post"
  );
  const isEditingEvent = !!editEventId;

  // Post-specific state
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaPickerItem[]>([]);

  // Derive post type from attached media
  const getPostType = (): PostType => {
    if (mediaItems.length === 0) return "text";
    if (mediaItems.some((item) => item.type === "video")) return "video";
    return "photo";
  };

  // Event-specific state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("music");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [eventImageUri, setEventImageUri] = useState<string | null>(null);
  const [eventPrice, setEventPrice] = useState("");

  // Hashtag state
  const [cursorPosition, setCursorPosition] = useState(0);

  // Shared state
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  }, []);

  const {
    chipRecommendations,
  } = useHashtagRecommendations({
    content,
    selectedPlace,
    cursorPosition,
  });

  // Mention autocomplete
  const mentionQuery = detectMentionAtCursor(content, cursorPosition);
  const mentionSuggestions = useMentionSuggestions(mentionQuery, profile?.id);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCursorPosition(e.nativeEvent.selection.end);
    },
    [],
  );

  const insertHashtag = useCallback(
    (tagName: string) => {
      const MAX = 500;
      const partial = detectHashtagAtCursor(content, cursorPosition);

      if (partial !== null) {
        // Autocomplete mode: replace the partial #word
        // Find the start of the #partial
        const start = cursorPosition - partial.length - 1; // -1 for the #
        const before = content.slice(0, start);
        const after = content.slice(cursorPosition);
        const insertion = `#${tagName} `;
        const newContent = (before + insertion + after).slice(0, MAX);
        setContent(newContent);
        setCursorPosition(Math.min(before.length + insertion.length, MAX));
      } else {
        // Chip mode: append at end
        const trimmed = content.trimEnd();
        const separator = trimmed.length > 0 ? ' ' : '';
        const insertion = `${separator}#${tagName}`;
        const newContent = (trimmed + insertion).slice(0, MAX);
        setContent(newContent);
        setCursorPosition(newContent.length);
      }
    },
    [content, cursorPosition],
  );

  const insertHash = useCallback(() => {
    const MAX = 500;
    if (content.length >= MAX) return;
    const before = content.slice(0, cursorPosition);
    const after = content.slice(cursorPosition);
    const newContent = (before + '#' + after).slice(0, MAX);
    setContent(newContent);
    setCursorPosition(Math.min(cursorPosition + 1, MAX));
  }, [content, cursorPosition]);

  const insertAt = useCallback(() => {
    const MAX = 500;
    if (content.length >= MAX) return;
    const before = content.slice(0, cursorPosition);
    const after = content.slice(cursorPosition);
    const newContent = (before + '@' + after).slice(0, MAX);
    setContent(newContent);
    setCursorPosition(Math.min(cursorPosition + 1, MAX));
  }, [content, cursorPosition]);

  const insertMention = useCallback(
    (user: { username: string }) => {
      const MAX = 500;
      const partial = detectMentionAtCursor(content, cursorPosition);
      if (partial === null) return;

      const start = cursorPosition - partial.length - 1; // -1 for the @
      const before = content.slice(0, start);
      const after = content.slice(cursorPosition);
      const insertion = `@${user.username} `;
      const newContent = (before + insertion + after).slice(0, MAX);
      setContent(newContent);
      setCursorPosition(Math.min(before.length + insertion.length, MAX));
    },
    [content, cursorPosition],
  );

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

  // Load existing event data for editing
  useEffect(() => {
    if (!editEventId) return;
    getEventById(editEventId).then(async (event) => {
      if (!event) return;
      setEventTitle(event.title);
      setEventDescription(event.description);
      setEventCategory(event.category);
      setEventDate(new Date(event.date + "T00:00:00"));
      if (event.startTime) {
        const [h, m] = event.startTime.split(":");
        const d = new Date();
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        setEventStartTime(d);
      }
      if (event.endTime) {
        const [h, m] = event.endTime.split(":");
        const d = new Date();
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        setEventEndTime(d);
      }
      if (event.imageUrl) {
        setEventImageUri(event.imageUrl);
      }
      if (event.price != null) {
        setEventPrice(event.price > 0 ? event.price.toString() : "");
      }
      // Load the associated place
      const place = await getPlaceById(event.placeId);
      if (place) setSelectedPlace(place);
    });
  }, [editEventId]);

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
          mediaFiles?: {
            uri: string;
            type: 'photo' | 'video';
            width?: number;
            height?: number;
          }[];
        }
      | undefined;
    if (!shared) return;
    delete (global as any).__sharedIntent;

    if (shared.mediaFiles && shared.mediaFiles.length > 0) {
      setMediaItems(shared.mediaFiles);
    } else if (shared.videoUri) {
      setMediaItems([{
        uri: shared.videoUri,
        type: 'video',
        width: shared.mediaWidth,
        height: shared.mediaHeight,
      }]);
    } else if (shared.imageUri) {
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

  const takeMedia = async () => {
    if (mediaItems.length >= 5) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Access Required',
        'Please allow camera access in Settings to take photos and videos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const newItem: MediaPickerItem = {
        uri: asset.uri,
        type: (asset.type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
        width: asset.width || undefined,
        height: asset.height || undefined,
      };
      setMediaItems((prev) => [...prev, newItem].slice(0, 5));
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
    setUploadProgress(0);
    setUploadStage("");
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
        let coverThumbnailUrl: string | undefined;
        let coverWidth: number | undefined;
        let coverHeight: number | undefined;
        let uploadedMediaItems: {
          mediaUrl: string;
          thumbnailUrl?: string;
          mediaType: 'photo' | 'video';
          mediaWidth?: number;
          mediaHeight?: number;
          sortOrder: number;
        }[] | undefined;

        const postType = getPostType();

        if (mediaItems.length > 0 && postType !== "text") {
          const totalItems = mediaItems.length;
          const hasVideo = mediaItems.some((item) => item.type === "video");

          // Process media items sequentially for accurate progress tracking
          const uploadResults: typeof uploadedMediaItems & {} = [];
          for (let index = 0; index < mediaItems.length; index++) {
            const item = mediaItems[index];

            // Compress
            if (item.type === "video") {
              setUploadStage(totalItems > 1 ? `Compressing video ${index + 1}/${totalItems}` : "Compressing video");
            } else if (hasVideo) {
              setUploadStage(totalItems > 1 ? `Compressing photo ${index + 1}/${totalItems}` : "Compressing photo");
            } else {
              setUploadStage(totalItems > 1 ? `Compressing ${index + 1}/${totalItems}` : "Compressing");
            }
            const compressWeight = 0.7; // compression is ~70% of the work
            const itemBase = index / totalItems;
            const itemSlice = 1 / totalItems;
            const compressedUri = await compressMedia(item.uri, item.type, (p) => {
              setUploadProgress(itemBase + itemSlice * compressWeight * p);
            });

            // Upload
            setUploadStage(totalItems > 1 ? `Uploading ${index + 1}/${totalItems}` : "Uploading");
            const extension = item.type === "video" ? "mp4" : "jpg";
            const mimeType = item.type === "video" ? "video/mp4" : "image/jpeg";
            const fileName = `${profile.id}-${Date.now()}-${index}.${extension}`;
            const url = await uploadMedia(profile.id, compressedUri, fileName, mimeType);
            setUploadProgress(itemBase + itemSlice * 0.9);

            // Generate and upload thumbnail for video items
            let thumbnailUrl: string | undefined;
            if (item.type === "video") {
              try {
                const { uri: thumbUri } = await ExpoVideoThumbnails.getThumbnailAsync(item.uri, { time: 500 });
                const thumbFileName = `${profile.id}-${Date.now()}-${index}-thumb.jpg`;
                thumbnailUrl = await uploadMedia(profile.id, thumbUri, thumbFileName, "image/jpeg");
              } catch {
                // Thumbnail generation failed, will fall back to placeholder
              }
            }
            setUploadProgress((index + 1) / totalItems);

            uploadResults.push({
              mediaUrl: url,
              thumbnailUrl,
              mediaType: item.type,
              mediaWidth: item.width,
              mediaHeight: item.height,
              sortOrder: index,
            });
          }

          // Set cover to first item
          coverMediaUrl = uploadResults[0].mediaUrl;
          coverThumbnailUrl = uploadResults[0].thumbnailUrl;
          coverWidth = uploadResults[0].mediaWidth;
          coverHeight = uploadResults[0].mediaHeight;

          // Only create post_media rows for multi-media posts
          if (uploadResults.length > 1) {
            uploadedMediaItems = uploadResults;
          }
        }

        const newPost = await createPost({
          userId: profile.id,
          placeId: placeId,
          type: postType,
          content: content.trim(),
          mediaUrl: coverMediaUrl,
          thumbnailUrl: coverThumbnailUrl,
          mediaWidth: coverWidth,
          mediaHeight: coverHeight,
          mediaItems: uploadedMediaItems,
        });

        const newAchievements = await markExplored(placeId, "posted");
        if (newAchievements.length > 0) {
          showToast(createAchievementToast(newAchievements[0]));
        }

        // Send mention notifications
        const mentionedUsernames = extractMentions(content.trim());
        for (const username of mentionedUsernames) {
          getProfileByUsername(username).then((u) => {
            if (u) createMentionNotification(profile.id, u.id, newPost.id).catch(() => {});
          });
        }

        // Invalidate caches so feed/map/profile show the new post
        queryClient.invalidateQueries({ queryKey: ['q', 'posts'] });
        queryClient.invalidateQueries({ queryKey: ['q', 'feed'] });
        queryClient.invalidateQueries({ queryKey: ['q', 'places'] });

        setContent("");
        setSelectedPlace(null);
        setMediaItems([]);
        router.dismiss();
        router.push(`${tabBase}/post/${newPost.id}` as any);
      } else {
        let imageUrl: string | undefined;

        if (eventImageUri) {
          const isRemoteUrl = eventImageUri.startsWith("http");
          if (isRemoteUrl) {
            // Existing remote image — no need to re-upload
            imageUrl = eventImageUri;
          } else {
            const compressedUri = await compressMedia(eventImageUri, "photo");
            const fileName = `${profile.id}-event-${Date.now()}.jpg`;
            imageUrl = await uploadMedia(profile.id, compressedUri, fileName, "image/jpeg");
          }
        }

        const dateStr = eventDate!.toISOString().split("T")[0];
        const pad = (n: number) => n.toString().padStart(2, "0");
        const startTimeStr = `${pad(eventStartTime!.getHours())}:${pad(eventStartTime!.getMinutes())}`;
        const endTimeStr = eventEndTime
          ? `${pad(eventEndTime.getHours())}:${pad(eventEndTime.getMinutes())}`
          : undefined;

        if (isEditingEvent) {
          await updateEvent(editEventId!, {
            title: eventTitle.trim(),
            description: eventDescription.trim(),
            placeId: placeId,
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            imageUrl: imageUrl ?? (eventImageUri ? undefined : null),
            category: eventCategory,
            price: eventPrice.trim() ? parseFloat(eventPrice) || null : null,
          });

          queryClient.invalidateQueries({ queryKey: ['q', 'events'] });
          queryClient.invalidateQueries({ queryKey: ['q', 'upcoming-events'] });
          queryClient.invalidateQueries({ queryKey: ['q', ['event', editEventId]] });

          showToast({ message: "Event updated" });
          router.dismiss();
        } else {
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

          // Invalidate event caches so events screen shows the new event
          queryClient.invalidateQueries({ queryKey: ['q', 'events'] });
          queryClient.invalidateQueries({ queryKey: ['q', 'upcoming-events'] });

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
                {isEditingEvent ? (
                  <Text style={styles.editTitle}>Edit Event</Text>
                ) : glassEnabled ? (
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
                  title={isEditingEvent ? "Save" : "Create"}
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
              <>
                {mentionSuggestions.length > 0 && (
                  <MentionSuggestions
                    suggestions={mentionSuggestions}
                    onSelect={insertMention}
                  />
                )}
                <PostForm
                  avatarUrl={profile?.avatarUrl}
                  content={content}
                  onContentChange={setContent}
                  onSelectionChange={handleSelectionChange}
                  inputAccessoryViewID={Platform.OS === 'ios' ? HASHTAG_TOOLBAR_ID : undefined}
                  mediaItems={mediaItems}
                  onPickMedia={pickMedia}
                  onTakeMedia={takeMedia}
                  onRemoveMedia={(index) => {
                    setMediaItems((prev) => prev.filter((_, i) => i !== index));
                  }}
                  hashtagChips={
                    Platform.OS !== 'ios' && chipRecommendations.length > 0 ? (
                      <View style={styles.hashtagSection}>
                        <HashtagInlineToolbar
                          chipTags={chipRecommendations}
                          onChipPress={insertHashtag}
                          onHashPress={insertHash}
                          onAtPress={insertAt}
                        />
                      </View>
                    ) : null
                  }
                />
              </>
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

      {/* iOS keyboard toolbar with # and @ buttons and hashtag chips */}
      {createType === "post" && (
        <HashtagKeyboardToolbar
          chipTags={chipRecommendations}
          onChipPress={insertHashtag}
          onHashPress={insertHash}
          onAtPress={insertAt}
        />
      )}

      {/* Full screen progress overlay */}
      <Modal visible={posting} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.progressOverlay}>
          <View style={styles.progressContent}>
            {mediaItems.length > 0 && uploadStage ? (
              <>
                <Text style={styles.progressText}>{uploadStage}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
                </View>
                <Text style={styles.progressSubtext}>{Math.round(uploadProgress * 100)}%</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.progressText}>
                  {createType === "post" ? "Posting..." : isEditingEvent ? "Saving..." : "Creating event..."}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.translucentCardBackground,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  headerScrolled: {
    backgroundColor: colors.background,
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
  editTitle: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
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
  hashtagSection: {
    marginTop: 10,
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
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
  },
});
