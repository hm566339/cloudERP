import { useState, useCallback } from 'react';

/**
 * A simple hook for managing filter state as a single object.
 * This is meant to replace legacy usages of useUrlFilters.
 */
export function useSimpleFilters(initialState = {}) {
  const [filters, setFiltersState] = useState(initialState);

  const setFilters = useCallback((newFilters) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialState);
  }, [initialState]);

  return { filters, setFilters, clearFilters };
}

export default useSimpleFilters;
