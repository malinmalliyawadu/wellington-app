import * as FileSystem from 'expo-file-system/legacy';
import { getAccessToken } from './instagram';
import type { InstagramMedia, InstagramMediaPage } from '../types/Instagram';

const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const CHILDREN_FIELDS = 'id,media_type,media_url,thumbnail_url';

export async function fetchInstagramMedia(
  after?: string
): Promise<InstagramMediaPage> {
  const token = await getAccessToken();
  if (!token) throw new Error('No Instagram connection');

  let url = `https://graph.instagram.com/me/media?fields=${MEDIA_FIELDS}&limit=25&access_token=${token}`;
  if (after) {
    url += `&after=${after}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Instagram API error: ${res.status} ${body}`);
  }

  return res.json();
}

export async function fetchCarouselChildren(
  mediaId: string
): Promise<InstagramMedia[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('No Instagram connection');

  const url = `https://graph.instagram.com/${mediaId}/children?fields=${CHILDREN_FIELDS}&access_token=${token}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch carousel children: ${res.status}`);
  }

  const data = await res.json();
  return data.data;
}

export async function downloadMediaToCache(
  mediaUrl: string,
  mediaId: string,
  isVideo: boolean
): Promise<string> {
  const extension = isVideo ? 'mp4' : 'jpg';
  const localUri = `${FileSystem.cacheDirectory}ig_${mediaId}.${extension}`;

  // Check if already cached
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists) return localUri;

  const download = await FileSystem.downloadAsync(mediaUrl, localUri);
  return download.uri;
}
