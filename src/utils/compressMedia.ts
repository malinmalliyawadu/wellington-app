import {
  compressImage,
  compress as compressVideo,
} from "expo-image-and-video-compressor";

/**
 * Compress an image or video file before upload.
 * Returns the URI of the compressed file, or the original if compression didn't help.
 */
export async function compressMedia(
  uri: string,
  type: "photo" | "video"
): Promise<string> {
  if (type === "video") {
    return compressVideo(uri, {
      bitrate: 2_500_000,
      maxSize: 1080,
      codec: "h264",
    });
  }

  return compressImage(uri, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
  });
}

/**
 * Compress an avatar image (smaller dimensions for profile photos).
 */
export async function compressAvatar(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
  });
}
