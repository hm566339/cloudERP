import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebounce from './useDebounce';

export function useUrlFilters({ defaultPageSize = 10, defaultSortBy = '', defaultSortOrder = 'asc' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial state from URL
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const initialPageSize = parseInt(searchParams.get('pageSize')) || defaultPageSize;
  const initialSearch = searchParams.get('search') || '';
  const initialSortBy = searchParams.get('sortBy') || defaultSortBy;
  const initialSortOrder = searchParams.get('sortOrder') || defaultSortOrder;

  // Local state for instant updates, synced to URL below
  // UI is 1-indexed, but the state `page` is 0-indexed to match backend.
  const [page, setPage] = useState(initialPage > 0 ? initialPage - 1 : 0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 400);
  
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Dynamic filters state
  const [filters, setFilters] = useState(() => {
    const initialFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'pageSize', 'search', 'sortBy', 'sortOrder', 'sort', 'size'].includes(key)) {
        initialFilters[key] = value;
      }
    }
    return initialFilters;
  });

  // Sync state changes back to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    // UI is 1-indexed
    const displayPage = page + 1;
    if (displayPage > 1) params.set('page', displayPage);
    if (pageSize !== defaultPageSize) params.set('pageSize', pageSize);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder && sortOrder !== 'asc') params.set('sortOrder', sortOrder);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    setSearchParams(params, { replace: true });
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, filters, setSearchParams, defaultPageSize]);

  // Expose setters
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to page 1 (0-indexed) on filter change
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setSortBy(defaultSortBy);
    setSortOrder(defaultSortOrder);
    setPage(0);
  }, [defaultSortBy, defaultSortOrder]);

  const handleSearchChange = useCallback((val) => {
    setSearchTerm(val);
  }, []);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(0);
  }, [debouncedSearch]);

  // Compute final API parameters
  const apiParams = useMemo(() => {
    return {
      page,
      size: pageSize,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters
    };
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, filters]);

  const handleColumnSort = useCallback((field) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') { setSortBy(''); setSortOrder(''); }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0);
  }, [sortBy, sortOrder]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  return {
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    searchTerm,
    setSearchTerm: handleSearchChange,
    debouncedSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleColumnSort,
    filters,
    setFilter,
    removeFilter,
    resetFilters,
    apiParams
  };
}
export default useUrlFilters;
