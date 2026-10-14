import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { getResourceConfig } from '../metadata/resourceRegistry';
import useDebouncedValue from './useDebouncedValue';

/**
 * Enterprise resource list query hook.
 * Uses metadata registry for endpoints, parameters, and pagination style.
 * Synchronizes search, page, sort, and filters to browser URL.
 */
export function useResourceList(resourceKey, options = {}) {
  const config = useMemo(() => getResourceConfig(resourceKey), [resourceKey]);
  const [searchParams, setSearchParams] = useSearchParams();

  const listCaps = config?.listCapabilities || {};
  const searchParam = options.searchParam || listCaps.searchParam || 'search';
  const sizeParam = options.sizeParam || listCaps.sizeParam || 'size';
  const pageParam = options.pageParam || listCaps.pageParam || 'page';
  const pageBase = options.defaultPageBase !== undefined ? options.defaultPageBase : (listCaps.defaultPageBase !== undefined ? listCaps.defaultPageBase : 0);
  const defaultPageSize = options.defaultPageSize || listCaps.defaultPageSize || 10;
  const listPath = options.listPath || config?.listPath;

  // Read initial values from URL
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPage = Math.max(0, urlPage - 1); // 0-indexed internally
  const initialPageSize = parseInt(searchParams.get(sizeParam) || String(defaultPageSize), 10);
  const initialSearch = searchParams.get(searchParam) || '';

  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [sortField, setSortField] = useState(options.defaultSortField || (listCaps.defaultSort ? listCaps.defaultSort.split(',')[0] : 'createdAt'));
  const [sortDir, setSortDir] = useState(options.defaultSortDir || (listCaps.defaultSort ? listCaps.defaultSort.split(',')[1] : 'desc'));

  // Custom filters
  const [filters, setFiltersState] = useState(() => {
    const parsed = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'pageSize', 'size', 'search', searchParam, 'sort', 'dir', 'sortBy', 'sortOrder'].includes(key)) {
        parsed[key] = value;
      }
    }
    return { ...options.initialFilters, ...parsed };
  });

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state to URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (page > 0) newParams.set('page', String(page + 1));
    if (pageSize !== defaultPageSize) newParams.set(sizeParam, String(pageSize));
    if (debouncedSearch) newParams.set(searchParam, debouncedSearch);
    if (sortField) newParams.set('sort', `${sortField},${sortDir}`);

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        newParams.set(k, String(v));
      }
    });

    setSearchParams(newParams, { replace: true });
  }, [page, pageSize, debouncedSearch, sortField, sortDir, filters, defaultPageSize, sizeParam, searchParam, setSearchParams]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!listPath) {
      setError(new Error(`No listPath configured for resource '${resourceKey}'`));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const backendPage = pageBase === 0 ? page : page + 1;
      const params = {
        [pageParam]: backendPage,
        [sizeParam]: pageSize,
        ...options.extraParams,
        ...filters,
      };

      if (debouncedSearch) {
        params[searchParam] = debouncedSearch;
      }

      if (sortField) {
        params.sort = `${sortField},${sortDir}`;
      }

      const res = await api.get(listPath, { params });
      const envelope = res.data;
      const data = envelope?.data !== undefined ? envelope.data : envelope;

      let extractedItems = [];
      let extractedTotal = 0;
      let extractedPages = 1;

      if (Array.isArray(data)) {
        extractedItems = data;
        extractedTotal = data.length;
        extractedPages = Math.ceil(data.length / pageSize) || 1;
      } else if (data?.content && Array.isArray(data.content)) {
        extractedItems = data.content;
        extractedTotal = data.totalElements !== undefined ? data.totalElements : data.content.length;
        extractedPages = data.totalPages !== undefined ? data.totalPages : Math.ceil(extractedTotal / pageSize) || 1;
      } else if (data?.items && Array.isArray(data.items)) {
        extractedItems = data.items;
        extractedTotal = data.total !== undefined ? data.total : data.items.length;
        extractedPages = data.pages !== undefined ? data.pages : Math.ceil(extractedTotal / pageSize) || 1;
      }

      setItems(extractedItems);
      setTotal(extractedTotal);
      setTotalPages(extractedPages);
    } catch (err) {
      console.error(`[useResourceList] Error fetching ${resourceKey}:`, err);
      setError(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [listPath, resourceKey, page, pageBase, pageParam, sizeParam, pageSize, options.extraParams, filters, debouncedSearch, searchParam, sortField, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helpers
  const setPage = (p) => setPageInternal(Math.max(0, p));
  const setPageSize = (s) => {
    setPageSizeInternal(s);
    setPageInternal(0);
  };
  const setFilter = (key, val) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      if (val === undefined || val === null || val === '') {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
    setPageInternal(0);
  };
  const resetFilters = () => {
    setFiltersState({});
    setSearchTerm('');
    setPageInternal(0);
  };

  const setSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPageInternal(0);
  };

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    sortField,
    sortDir,
    setSort,
    setPage,
    setPageSize,
    loading,
    error,
    refetch: fetchData,
    config,
  };
}

export default useResourceList;
