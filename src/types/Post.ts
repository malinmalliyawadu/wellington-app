export type PostType = 'photo' | 'video' | 'text';

export type MediaType = 'photo' | 'video';

export interface MediaItem {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  mediaWidth?: number;
  mediaHeight?: number;
  sortOrder: number;
}

export interface Post {
  id: string;
  userId: string;
  placeId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  likes: number;
  createdAt: string;
  media?: MediaItem[];
}
