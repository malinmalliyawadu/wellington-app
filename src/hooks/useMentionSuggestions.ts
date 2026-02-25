import { useMemo } from 'react';
import { useQuery } from './useQuery';
import { getProfiles } from '../services/users';
import type { User } from '../types';

/**
 * Returns up to 5 user suggestions matching a partial @mention query.
 * Filters by username startsWith or displayName includes (case-insensitive).
 * Returns empty array when query is null or empty.
 */
export function useMentionSuggestions(
  query: string | null,
  currentUserId: string | undefined,
): User[] {
  const { data: allUsers } = useQuery(getProfiles, 'all-profiles', { staleTime: 60_000 });

  return useMemo(() => {
    if (!query || !allUsers) return [];
    const q = query.toLowerCase();
    return allUsers
      .filter((u) => {
        if (u.id === currentUserId) return false;
        return (
          u.username.toLowerCase().startsWith(q) ||
          u.displayName.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [query, allUsers, currentUserId]);
}
