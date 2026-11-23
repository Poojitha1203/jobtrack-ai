import { useCallback, useEffect, useRef, useState } from 'react';

interface Result<T> {
  key: string;
  data?: T;
  error?: Error;
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error('Something went wrong'));

/**
 * Loads data whenever `key` changes (or reload() is called).
 * While a new request is in flight, the previous data stays available, so lists
 * don't flash empty between searches. Late responses from old keys are ignored.
 */
export function useAsyncData<T>(load: () => Promise<T>, key: string) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const requestKey = `${key}#${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (!cancelled) setResult({ key: requestKey, data });
      },
      (error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, error: toError(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  const setData = useCallback(
    (update: (current: T) => T) =>
      setResult((prev) => (prev?.data === undefined ? prev : { ...prev, data: update(prev.data) })),
    [],
  );

  return {
    data: result?.data,
    error: result?.key === requestKey ? result.error : undefined,
    loading: result?.key !== requestKey,
    reload,
    setData,
  };
}
