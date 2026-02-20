import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const POST_MEDIA_BUCKET = 'post-media';
const AVATARS_BUCKET = 'avatars';

export async function uploadMedia(
  userId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  console.log('Starting media upload:', fileName);
  console.log('Image URI:', uri);

  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const arrayBuffer = new Uint8Array(byteNumbers).buffer;

    console.log('File size:', arrayBuffer.byteLength, 'bytes');

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Media file is empty');
    }

    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('Upload successful');
    return getPublicUrl(POST_MEDIA_BUCKET, filePath);
  } catch (error) {
    console.error('Upload media error:', error);
    throw error;
  }
}

export async function uploadAvatar(
  uri: string,
  userId: string,
): Promise<string> {
  console.log('Starting avatar upload for user:', userId);
  console.log('Image URI:', uri);

  try {
    // Read file as base64 using FileSystem
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const arrayBuffer = new Uint8Array(byteNumbers).buffer;

    console.log('File size:', arrayBuffer.byteLength, 'bytes');

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Image file is empty');
    }

    // Use userId to make avatar path predictable (allows overwriting old avatar)
    const filePath = `${userId}-${Date.now()}.jpg`;
    console.log('Uploading to path:', filePath);

    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true, // Allow overwriting
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('Upload successful, data:', data);

    const publicUrl = getPublicUrl(AVATARS_BUCKET, filePath);
    console.log('Public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Upload avatar error:', error);
    throw error;
  }
}

export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
