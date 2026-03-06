import { useCallback, useRef } from 'react';
import { useQuery as useTanstackQuery } from '@tanstack/react-query';

export const STALE_TIME = 2 * 60 * 1000; // 2 minutes

// Hermes can't JSON.stringify Symbol, so use a plain counter for keyless queries
let _keylessId = 0;

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<T>;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  key?: unknown,
  options?: { staleTime?: number; enabled?: boolean }
): QueryResult<T> {
  // Keyless calls get a stable unique number — never shares cache with other call sites
  const fallbackKey = useRef(_keylessId++).current;
  const queryKey = key !== undefined ? ['q', key] : ['q', fallbackKey];

  // Keep queryFn stable across renders (TanStack uses queryKey, not queryFn identity, for caching)
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const effectiveStaleTime = key !== undefined ? (options?.staleTime ?? STALE_TIME) : 0;

  const { data, isPending, error, refetch: tanstackRefetch } = useTanstackQuery<T, Error>({
    queryKey,
    queryFn: () => queryFnRef.current(),
    staleTime: effectiveStaleTime,
    // Keyless entries are ephemeral — remove from cache immediately on unmount
    gcTime: key !== undefined ? (options?.staleTime ?? STALE_TIME) : 0,
    enabled: options?.enabled,
  });

  const refetch = useCallback(async (): Promise<T> => {
    const result = await tanstackRefetch().catch((err) => {
      if (err?.name === 'CancelledError' || err?.message?.includes?.('CancelledError')) {
        return { data: undefined };
      }
      throw err;
    });
    return result.data as T;
  }, [tanstackRefetch]);

  return {
    data: data ?? null,
    loading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}
