export type PostType = 'photo' | 'video' | 'text';

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
}
