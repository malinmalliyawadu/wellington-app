import { Platform, Share } from "react-native";

const WEBSITE_URL =
  process.env.EXPO_PUBLIC_WELLY_WEBSITE_URL || "https://wellyapp.nz";

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

export function getGuideUrl(guideId: string): string {
  return `${WEBSITE_URL}/guide/${guideId}`;
}

export function getTrailUrl(trailId: string): string {
  return `${WEBSITE_URL}/trail/${trailId}`;
}

// On iOS, passing `url` gives a clean link preview in the share sheet.
// On Android, `url` is ignored so we pass it as `message`.
function shareUrl(url: string): void {
  Share.share(Platform.OS === "ios" ? { url } : { message: url });
}

// Share helpers
export function sharePost(postId: string): void {
  shareUrl(getPostUrl(postId));
}

export function shareEvent(eventId: string): void {
  shareUrl(getEventUrl(eventId));
}

export function shareGuide(guideId: string): void {
  shareUrl(getGuideUrl(guideId));
}

export function shareTrail(trailId: string): void {
  shareUrl(getTrailUrl(trailId));
}
