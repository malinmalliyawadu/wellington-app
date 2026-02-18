import { useState, useEffect, useCallback, useRef } from 'react';

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useQuery<T>(queryFn: () => Promise<T>, key?: unknown): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const refetch = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  const stableKey = key !== undefined ? JSON.stringify(key) : undefined;
  const prevKeyRef = useRef(stableKey);

  useEffect(() => {
    let cancelled = false;
    const keyChanged = prevKeyRef.current !== stableKey;
    prevKeyRef.current = stableKey;

    // Show loading on initial fetch or when the key changes (e.g. switching places)
    // Don't show loading on refetch so old data stays visible
    if (data === null || keyChanged) {
      setLoading(true);
      if (keyChanged) {
        setData(null);
      }
    }
    setError(null);

    queryFnRef.current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'An error occurred');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableKey, trigger]);

  return { data, loading, error, refetch };
}
