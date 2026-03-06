import { useState } from "react";
import { Alert } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { Router } from "expo-router";
import { Place, PostType, EventCategory } from "../../types";
import type { MediaPickerItem } from "../../components/create/PostForm";
import type { User } from "../../types";
import type { ExplorationMethod } from "../../types/database";
import type { PointActionType } from "../../types/Exploration";
import { findOrCreatePlace } from "../../services/places";
import { createPost } from "../../services/posts";
import { uploadMedia } from "../../services/storage";
import { createEvent, updateEvent } from "../../services/events";
import { createAchievementToast } from "../../utils/achievementHelpers";
import { compressMedia } from "../../utils/compressMedia";
import { extractMentions } from "../../utils/mentions";
import { getProfileByUsername } from "../../services/users";
import { createMentionNotification } from "../../services/notifications";
import { dismissAndPush } from "../../utils/navigation";
import * as ExpoVideoThumbnails from "expo-video-thumbnails";

interface UsePostSubmitParams {
  profile: User | null;
  selectedPlace: Place | null;
  createType: "post" | "event";
  content: string;
  mediaItems: MediaPickerItem[];
  getPostType: () => PostType;
  eventTitle: string;
  eventDescription: string;
  eventCategory: EventCategory;
  eventDate: Date | null;
  eventStartTime: Date | null;
  eventEndTime: Date | null;
  eventImageUri: string | null;
  eventPrice: string;
  editEventId?: string;
  queryClient: QueryClient;
  markExplored: (placeId: string, method: ExplorationMethod) => Promise<string[]>;
  awardPointsForAction: (actionType: PointActionType, referenceId?: string) => Promise<void>;
  showToast: (toast: any) => void;
  router: Router;
  tabBase: string;
  resetPostForm: () => void;
  resetEventForm: () => void;
}

export function usePostSubmit({
  profile,
  selectedPlace,
  createType,
  content,
  mediaItems,
  getPostType,
  eventTitle,
  eventDescription,
  eventCategory,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventImageUri,
  eventPrice,
  editEventId,
  queryClient,
  markExplored,
  awardPointsForAction,
  showToast,
  router,
  tabBase,
  resetPostForm,
  resetEventForm,
}: UsePostSubmitParams) {
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  const isEditingEvent = !!editEventId;

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
      // No content requirement - posts can be media-only
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

        // Award points for post creation
        const pointAction = postType === 'text' ? 'post_text' as const : 'post_photo' as const;
        awardPointsForAction(pointAction, newPost.id);

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

        resetPostForm();
        dismissAndPush(router, `${tabBase}/post/${newPost.id}` as any);
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

          // Award points for event creation
          awardPointsForAction('event_create', undefined);

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
                  resetEventForm();
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

  return { handleSubmit, posting, uploadProgress, uploadStage };
}
