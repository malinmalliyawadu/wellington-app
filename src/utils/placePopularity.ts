import { Post } from '../types';

export interface PlacePopularity {
  placeId: string;
  postCount: number;
  totalLikes: number;
  score: number;
  posterIds: string[];
}

const MIN_SIZE = 28;
const MAX_SIZE = 52;

export function computePlacePopularity(posts: Post[]): Map<string, PlacePopularity> {
  const map = new Map<string, PlacePopularity>();

  for (const post of posts) {
    const existing = map.get(post.placeId);
    if (existing) {
      existing.postCount += 1;
      existing.totalLikes += post.likes;
      existing.score = existing.postCount + existing.totalLikes;
      if (!existing.posterIds.includes(post.userId)) {
        existing.posterIds.push(post.userId);
      }
    } else {
      map.set(post.placeId, {
        placeId: post.placeId,
        postCount: 1,
        totalLikes: post.likes,
        score: 1 + post.likes,
        posterIds: [post.userId],
      });
    }
  }

  return map;
}

export function getMarkerSize(
  score: number,
  allPopularities: Map<string, PlacePopularity>
): number {
  const scores = Array.from(allPopularities.values()).map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  if (maxScore === minScore) return (MIN_SIZE + MAX_SIZE) / 2;

  const t = (score - minScore) / (maxScore - minScore);
  return MIN_SIZE + t * (MAX_SIZE - MIN_SIZE);
}

export function isFollowedPlace(
  posterIds: string[],
  followingIds: string[]
): boolean {
  return posterIds.some((id) => followingIds.includes(id));
}
