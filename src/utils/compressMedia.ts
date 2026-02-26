import { Video, Image } from "react-native-compressor";

/**
 * Compress an image or video file before upload.
 * Returns the URI of the compressed file, or the original if compression didn't help.
 */
export async function compressMedia(
  uri: string,
  type: "photo" | "video",
  onProgress?: (progress: number) => void
): Promise<string> {
  if (type === "video") {
    return Video.compress(
      uri,
      {
        compressionMethod: "auto",
        minimumFileSizeForCompress: 10,
      },
      onProgress
    );
  }

  return Image.compress(uri, {
    compressionMethod: "manual",
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
  });
}

/**
 * Compress an avatar image (smaller dimensions for profile photos).
 */
export async function compressAvatar(uri: string): Promise<string> {
  return Image.compress(uri, {
    compressionMethod: "manual",
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
  });
}
