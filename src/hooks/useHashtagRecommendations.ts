import { useMemo } from 'react';
import type { Place } from '../types';
import { extractHashtags, placeNameToHashtag } from '../utils/hashtags';
import { categoryHashtags } from '../data/categoryHashtags';
import { useQuery } from './useQuery';
import { getTrendingHashtags } from '../services/hashtags';

interface UseHashtagRecommendationsArgs {
  content: string;
  selectedPlace: Place | null;
  cursorPosition: number;
}

interface UseHashtagRecommendationsResult {
  chipRecommendations: string[];
  existingTags: string[];
}

export function useHashtagRecommendations({
  content,
  selectedPlace,
}: UseHashtagRecommendationsArgs): UseHashtagRecommendationsResult {
  const { data: trending } = useQuery(getTrendingHashtags, 'trending-hashtags');

  const existingTags = useMemo(() => extractHashtags(content), [content]);

  const chipRecommendations = useMemo(() => {
    const existing = new Set(existingTags);
    const suggestions: string[] = [];

    // 1. Place name hashtag
    if (selectedPlace) {
      const placeTag = placeNameToHashtag(selectedPlace.name);
      if (placeTag && !existing.has(placeTag)) {
        suggestions.push(placeTag);
      }

      // 2. Category hashtags
      const catTags = categoryHashtags[selectedPlace.category] ?? [];
      for (const tag of catTags) {
        if (!existing.has(tag) && !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      }
    }

    // 3. Trending hashtags
    if (trending) {
      for (const h of trending) {
        if (!existing.has(h.name) && !suggestions.includes(h.name)) {
          suggestions.push(h.name);
        }
      }
    }

    return suggestions.slice(0, 10);
  }, [selectedPlace, trending, existingTags]);

  return {
    chipRecommendations,
    existingTags,
  };
}
