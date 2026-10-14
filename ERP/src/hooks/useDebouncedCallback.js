import { useRef, useCallback, useEffect } from 'react';

/**
 * useDebouncedCallback — Debounces a callback execution with immediate flush option.
 *
 * @param {Function} callback Callback to debounce
 * @param {number} delay Milliseconds delay (default: 350ms)
 * @returns {Function} Debounced function with .flush() and .cancel()
 */
export default function useDebouncedCallback(callback, delay = 350) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);
  const argsRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...argsRef.current);
      argsRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args) => {
      argsRef.current = args;
      cancel();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callbackRef.current(...args);
        argsRef.current = null;
      }, delay);
    },
    [cancel, delay]
  );

  debounced.cancel = cancel;
  debounced.flush = flush;

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return debounced;
}
