import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebouncedValue from './useDebouncedValue';

/**
 * useListQuery — Universal Enterprise List Query & URL State Hook
 *
 * Bridges React Router URL state with RTK Query / backend APIs to deliver:
 * 1. URL as Single Source of Truth: Shareable, bookmarkable, survives refresh and back/forward.
 * 2. Instant Input Response: Local state updates on every keystroke; debounced API call (350ms).
 * 3. Reset Rules: Filter/search/sort change resets page to 1. Changing page preserves all filters.
 * 4. Stale-While-Revalidate: Retains previous list items during page transitions (no layout flash).
 * 5. Automatic Clamping: Decrements page gracefully if record count shrinks.
 */
export default function useListQuery(queryHook, options = {}) {
  const {
    defaultPageSize = 10,
    pageParam = 'page',
    sizeParam = 'size',
    sortParam = 'sort',
    searchParam = 'search',
    sortStyle = 'spring', // 'spring' (sort=field,desc) or 'explicit' (sortBy=field&sortDirection=DESC)
    defaultSortBy = '',
    defaultSortOrder = 'desc',
    extraParams = {},
    skip = false,
    filterConfig = {},
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // ── 1. Parse initial state from URL ──────────────────────────────────────────
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const initialPageSize = Math.max(
    1,
    parseInt(searchParams.get('pageSize') || searchParams.get('size') || String(defaultPageSize), 10)
  );
  const initialSearch = searchParams.get(searchParam) || searchParams.get('search') || '';
  const initialSortBy = searchParams.get('sortBy') || searchParams.get('sortField') || defaultSortBy;
  const initialSortOrder = (searchParams.get('sortOrder') || searchParams.get('dir') || defaultSortOrder).toLowerCase();

  // Local state (0-indexed page for backend contract; URL displays 1-indexed)
  const [page, setPageInternal] = useState(initialPage - 1);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [sortBy, setSortByInternal] = useState(initialSortBy);
  const [sortOrder, setSortOrderInternal] = useState(initialSortOrder);

  // Dynamic filter state from URL
  const [filters, setFilters] = useState(() => {
    const parsed = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'pageSize', 'size', 'search', searchParam, 'sortBy', 'sortOrder', 'sort'].includes(key)) {
        parsed[key] = value;
      }
    }
    return parsed;
  });

  // Track navigation mode: 'replace' for typing, 'push' for discrete actions
  const navActionRef = useRef('replace');

  // ── 2. Sync State to URL ───────────────────────────────────────────────────
  useEffect(() => {
    const nextParams = new URLSearchParams();

    // 1-indexed display in URL
    const displayPage = page + 1;
    if (displayPage > 1) nextParams.set('page', String(displayPage));
    if (pageSize !== defaultPageSize) nextParams.set('pageSize', String(pageSize));
    if (debouncedSearch && debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (sortBy) nextParams.set('sortBy', sortBy);
    if (sortOrder && sortOrder !== defaultSortOrder) nextParams.set('sortOrder', sortOrder);

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        nextParams.set(key, String(val));
      }
    });

    const isReplace = navActionRef.current === 'replace';
    setSearchParams(nextParams, { replace: isReplace });
    // Default next action to replace unless explicitly set to push
    navActionRef.current = 'replace';
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, filters, defaultPageSize, defaultSortOrder, setSearchParams]);

  // ── 3. Reset Rules ─────────────────────────────────────────────────────────
  // Search change resets page to 0 (1-indexed: page 1)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPageInternal(0);
  }, [debouncedSearch]);

  const setPage = useCallback((newPage) => {
    navActionRef.current = 'push';
    setPageInternal(Math.max(0, newPage));
  }, []);

  const setPageSize = useCallback((newSize) => {
    navActionRef.current = 'push';
    setPageSizeInternal(Number(newSize) || defaultPageSize);
    setPageInternal(0); // Reset page on size change
  }, [defaultPageSize]);

  const handleSearchChange = useCallback((text) => {
    navActionRef.current = 'replace';
    setSearchTerm(text);
  }, []);

  const setSort = useCallback((field) => {
    navActionRef.current = 'push';
    setSortByInternal((prevField) => {
      if (prevField === field) {
        setSortOrderInternal((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrderInternal('asc');
      return field;
    });
    setPageInternal(0);
  }, []);

  const setFilter = useCallback((key, value) => {
    navActionRef.current = 'push';
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageInternal(0);
  }, []);

  const removeFilter = useCallback((key) => {
    navActionRef.current = 'push';
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPageInternal(0);
  }, []);

  const resetFilters = useCallback(() => {
    navActionRef.current = 'push';
    setSearchTerm('');
    setFilters({});
    setSortByInternal(defaultSortBy);
    setSortOrderInternal(defaultSortOrder);
    setPageInternal(0);
  }, [defaultSortBy, defaultSortOrder]);

  // ── 4. Build Backend Query Parameters ──────────────────────────────────────
  const queryParams = useMemo(() => {
    const params = {
      ...extraParams,
      [pageParam]: page,
      [sizeParam]: pageSize,
    };

    if (debouncedSearch && debouncedSearch.trim()) {
      params[searchParam] = debouncedSearch.trim();
    }

    if (sortBy) {
      if (sortStyle === 'spring') {
        params[sortParam] = `${sortBy},${sortOrder}`;
      } else {
        params.sortBy = sortBy;
        params.sortDirection = sortOrder.toUpperCase();
      }
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params[key] = val;
      }
    });

    return params;
  }, [extraParams, pageParam, page, sizeParam, pageSize, debouncedSearch, searchParam, sortBy, sortStyle, sortParam, sortOrder, filters]);

  // ── 5. Execute Data Query ──────────────────────────────────────────────────
  const queryResult = queryHook ? queryHook(queryParams, { skip }) : {};

  const {
    data: rawData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = queryResult;

  // Stale-while-revalidate: keep previous data during background fetches
  const previousDataRef = useRef(null);

  const parsedData = useMemo(() => {
    if (!rawData) return previousDataRef.current || { items: [], total: 0, totalPages: 1 };

    let items = [];
    let total = 0;
    let totalPages = 1;

    // 1) Spring Data Page: { content: [...], totalElements, totalPages }
    if (Array.isArray(rawData.content)) {
      items = rawData.content;
      total = rawData.totalElements ?? items.length;
      totalPages = (rawData.totalPages ?? Math.ceil(total / pageSize)) || 1;
    }
    // 2) Unwrapped array: items = rawData, total = rawData._pageInfo
    else if (Array.isArray(rawData)) {
      items = rawData;
      if (rawData._pageInfo) {
        total = rawData._pageInfo.totalElements ?? items.length;
        totalPages = (rawData._pageInfo.totalPages ?? Math.ceil(total / pageSize)) || 1;
      } else {
        total = items.length;
        totalPages = Math.ceil(total / pageSize) || 1;
      }
    }
    // 3) Envelope like { data: [...] } or { data: { content: [...] } }
    else if (rawData.data) {
      if (Array.isArray(rawData.data)) {
        items = rawData.data;
        total = rawData.pagination?.total ?? items.length;
        totalPages = (rawData.pagination?.totalPages ?? Math.ceil(total / pageSize)) || 1;
      } else if (Array.isArray(rawData.data.content)) {
        items = rawData.data.content;
        total = rawData.data.totalElements ?? items.length;
        totalPages = (rawData.data.totalPages ?? Math.ceil(total / pageSize)) || 1;
      } else {
        const arrayKey = Object.keys(rawData.data).find((k) => Array.isArray(rawData.data[k]));
        if (arrayKey) {
          items = rawData.data[arrayKey];
          total = rawData.data.pagination?.total ?? items.length;
          totalPages = (rawData.data.pagination?.totalPages ?? Math.ceil(total / pageSize)) || 1;
        }
      }
    }
    // 4) Top-level entity array: { organizations: [...] }, { companies: [...] }, etc.
    else {
      const topArrayKey = Object.keys(rawData).find((k) => Array.isArray(rawData[k]));
      if (topArrayKey) {
        items = rawData[topArrayKey];
        total = rawData.totalElements ?? rawData.total ?? rawData.pagination?.totalElements ?? rawData.pagination?.total ?? rawData._pageInfo?.totalElements ?? items.length;
        totalPages = rawData.totalPages ?? rawData.pagination?.totalPages ?? (Math.ceil(total / pageSize) || 1);
      }
    }

    const result = { items, total, totalPages };
    previousDataRef.current = result;
    return result;
  }, [rawData, pageSize]);

  // Automatic clamping if dataset shrank and current page is out of bounds
  useEffect(() => {
    if (parsedData.totalPages > 0 && page >= parsedData.totalPages) {
      setPageInternal(Math.max(0, parsedData.totalPages - 1));
    }
  }, [parsedData.totalPages, page]);

  // Pre-bound props for <Pagination />
  const paginationProps = useMemo(() => ({
    page,
    totalPages: parsedData.totalPages,
    totalElements: parsedData.total,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }), [page, parsedData.totalPages, parsedData.total, pageSize, setPage, setPageSize]);

  // ── AbortController Management ─────────────────────────────────────────────
  const abortControllerRef = useRef(null);

  const getAbortSignal = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Data
    items: parsedData.items,
    data: rawData,
    total: parsedData.total,
    totalPages: parsedData.totalPages,

    // Status
    loading: isLoading,
    isFetching,
    error,
    refetch,

    // State
    page,
    displayPage: page + 1,
    pageSize,
    searchTerm,
    debouncedSearch,
    sortBy,
    sortOrder,
    filters,
    queryParams,
    apiParams: queryParams,

    // Controls
    setPage,
    setPageSize,
    setSearch: handleSearchChange,
    setSearchTerm: handleSearchChange,
    setSort,
    handleColumnSort: setSort,
    handlePageSizeChange: setPageSize,
    setFilter,
    removeFilter,
    resetFilters,

    // AbortController / cancellation
    abortController: abortControllerRef.current,
    signal: abortControllerRef.current?.signal,
    getAbortSignal,

    // Bound component props
    paginationProps,
  };
}
