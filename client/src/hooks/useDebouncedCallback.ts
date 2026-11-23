import { useCallback, useEffect, useRef } from 'react';

/** Returns a function that runs `fn` only after calls have stopped for `delay` ms. */
export function useDebouncedCallback<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  const fnRef = useRef(fn);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
