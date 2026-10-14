import { useState, useEffect } from 'react';

/**
 * useDebouncedValue — Debounces any fast-changing value.
 *
 * @param {any} value Value to debounce
 * @param {number} delay Milliseconds delay (default: 350ms)
 * @returns {any} Debounced value
 */
export default function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
