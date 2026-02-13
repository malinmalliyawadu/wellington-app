import type { Post } from '../types';

/**
 * Centralized post sorting algorithm.
 * Sorts posts by most recent first (created_at descending).
 *
 * Note: Most data fetching already returns posts sorted by created_at DESC
 * from the database. This function ensures consistency and can be extended
 * with additional sorting logic if needed.
 */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    // Sort by created_at descending (most recent first)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}
