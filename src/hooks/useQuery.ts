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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
