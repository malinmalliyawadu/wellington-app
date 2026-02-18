import type { Post, MediaItem } from '../types';

/**
 * Returns media items for a post. If the post has a populated `media` array,
 * returns that. Otherwise synthesizes a 1-item array from the legacy
 * `mediaUrl` field for backward compatibility.
 */
export function getPostMediaItems(post: Post): MediaItem[] {
  if (post.media && post.media.length > 0) {
    return post.media;
  }

  if (post.mediaUrl) {
    return [
      {
        id: `${post.id}-legacy`,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        mediaType: post.type === 'video' ? 'video' : 'photo',
        mediaWidth: post.mediaWidth,
        mediaHeight: post.mediaHeight,
        sortOrder: 0,
      },
    ];
  }

  return [];
}

export function isMultiMediaPost(post: Post): boolean {
  return getPostMediaItems(post).length > 1;
}
