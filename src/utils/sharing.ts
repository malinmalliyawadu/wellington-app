import { Share } from "react-native";
import { createURL } from "expo-linking";

// URL generators
export function getPostUrl(postId: string): string {
  return createURL(`/feed/post/${postId}`);
}

export function getPlaceUrl(placeId: string): string {
  return createURL(`/feed/place/${placeId}`);
}

export function getEventUrl(eventId: string): string {
  return createURL(`/events/${eventId}`);
}

export function getUserUrl(userId: string): string {
  return createURL(`/feed/user/${userId}`);
}

// Share helpers
export function sharePost(
  postId: string,
  placeName: string,
  content: string
): void {
  const url = getPostUrl(postId);
  Share.share({
    message: `Check out ${placeName}: ${content}\n${url}`,
  });
}

export function shareEvent(
  eventId: string,
  title: string,
  date: string,
  placeName: string,
  description: string
): void {
  const url = getEventUrl(eventId);
  Share.share({
    message: `${title} — ${date} at ${placeName}\n${description}\n${url}`,
  });
}
