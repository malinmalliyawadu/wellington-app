import { Share } from "react-native";

const WEBSITE_URL =
  process.env.EXPO_PUBLIC_WELLY_WEBSITE_URL || "https://welly.nz";

// URL generators — produce HTTPS URLs for rich link previews
export function getPostUrl(postId: string): string {
  return `${WEBSITE_URL}/post/${postId}`;
}

export function getPlaceUrl(placeId: string): string {
  return `${WEBSITE_URL}/place/${placeId}`;
}

export function getEventUrl(eventId: string): string {
  return `${WEBSITE_URL}/event/${eventId}`;
}

export function getUserUrl(userId: string): string {
  return `${WEBSITE_URL}/user/${userId}`;
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
