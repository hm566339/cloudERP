import { useMemo, useCallback } from 'react';
import useUrlFilters from './useUrlFilters';

/**
 * useApiFilters — Wraps useUrlFilters with a filterConfig to produce:
 *   1. filterBarProps  → spread directly onto <FilterBar />
 *   2. apiParams       → pass directly to RTK Query hooks (with correct param names)
 *   3. paginationProps → spread onto <Pagination />
 *   4. raw state       → page, setPage, etc. for custom usage
 *
 * Usage:
 *   const { filterBarProps, apiParams, paginationProps } = useApiFilters(FILTER_CONFIGS.bankAccounts);
 */
export default function useApiFilters(filterConfig = {}, options = {}) {
  const {
    fields = [],
    sortFields = [],
    pagination = {},
  } = filterConfig;

  const {
    defaultPageSize = 10,
    searchPlaceholder = 'Search...',
    defaultSortBy: optDefaultSortBy,
    defaultSortOrder: optDefaultSortOrder,
  } = options;

  // Resolve default sort — support combined 'field-asc'/'field-desc' format from callers
  let defaultSortField = sortFields.length > 0 ? sortFields[0].value : '';
  let defaultSortDirection = 'desc';
  if (optDefaultSortBy) {
    const match = optDefaultSortBy.match(/^(.+)-(asc|desc)$/i);
    if (match) {
      defaultSortField = match[1];
      defaultSortDirection = match[2].toLowerCase();
    } else {
      defaultSortField = optDefaultSortBy;
      if (optDefaultSortOrder) defaultSortDirection = optDefaultSortOrder;
    }
  } else if (optDefaultSortOrder) {
    defaultSortDirection = optDefaultSortOrder;
  }

  const urlFilters = useUrlFilters({
    defaultPageSize,
    defaultSortBy: defaultSortField,
    defaultSortOrder: defaultSortDirection,
  });

  const {
    page, setPage, pageSize, setPageSize,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, setSortBy, sortOrder, setSortOrder,
    filters, setFilter, removeFilter, resetFilters,
  } = urlFilters;

  // Build API params with correct pagination/sort param names per endpoint config
  const apiParams = useMemo(() => {
    const params = {};

    // Pagination
    const { pageParam = 'page', sizeParam = 'size' } = pagination;
    params[pageParam] = page;
    params[sizeParam] = pageSize;

    // Sort
    const { sortStyle = 'spring' } = pagination;
    if (sortBy) {
      // Robustness: Validate if the sortBy field actually exists in config
      const isValidSort = sortFields && sortFields.some(f => f.value === sortBy);
      const finalSortBy = isValidSort ? sortBy : (sortFields?.[0]?.value || sortBy);

      if (sortStyle === 'spring') {
        // Spring format: sort=field,direction
        const dir = sortOrder || 'desc';
        params[pagination.sortParam || 'sort'] = `${finalSortBy},${dir}`;
      } else {
        // Explicit params
        params[pagination.sortByParam || 'sortBy'] = finalSortBy;
        params[pagination.dirParam || 'sortDirection'] = (sortOrder || 'desc').toUpperCase();
      }
    }

    // Search — can be overridden (e.g. searchKey instead of search)
    if (debouncedSearch) {
      const searchParam = filterConfig.searchParam || 'search';
      params[searchParam] = debouncedSearch;
    }

    // Dynamic filters from URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const fieldConfig = fields.find(f => f.key === key);
        if (fieldConfig?.type === 'dateRange' && typeof value === 'string' && value.includes('|')) {
          const [start, end] = value.split('|');
          const startKey = fieldConfig.startKey || 'startDate';
          const endKey = fieldConfig.endKey || 'endDate';
          if (start) params[startKey] = start;
          if (end) params[endKey] = end;
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, filters, pagination]);

  // Build filter bar props — maps config fields to FilterBar's expected format
  const filterBarFilters = useMemo(() => {
    return fields
      .filter(f => f.type !== 'text' || f.key !== 'search') // search is handled by the search bar
      .map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value: filters[field.key] || '',
        options: field.options || [],
        hideAllOption: field.hideAllOption || false,
        priority: field.priority || false,
      }));
  }, [fields, filters]);

  // Active filter badges for the filter bar
  const activeFilterBadges = useMemo(() => {
    const badges = [];
    if (searchTerm) {
      badges.push({
        id: 'search',
        label: `Search: ${searchTerm}`,
        onRemove: () => setSearchTerm(''),
      });
    }
    fields.forEach(field => {
      const val = filters[field.key];
      if (val !== undefined && val !== null && val !== '') {
        const opt = field.options?.find(o => String(o.value) === String(val));
        badges.push({
          id: field.key,
          label: `${field.label}: ${opt?.label || val}`,
          onRemove: () => removeFilter(field.key),
        });
      }
    });
    return badges;
  }, [searchTerm, filters, fields, setSearchTerm, removeFilter]);

  const handleColumnSort = useCallback((field) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortBy('');
        setSortOrder('');
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0);
  }, [sortBy, sortOrder, setSortBy, setSortOrder, setPage]);

  // Assemble filterBarProps — spread directly onto <FilterBar />
  const filterBarProps = {
    searchTerm,
    onSearchChange: setSearchTerm,
    searchPlaceholder,
    filters: filterBarFilters,
    onFilterChange: setFilter,
    onClearAll: resetFilters,
    activeFilterBadges,
  };

  // Pagination props — for <Pagination /> component
  const paginationProps = {
    page,
    onPageChange: setPage,
    pageSize,
    onPageSizeChange: setPageSize,
  };

  return {
    filterBarProps,
    apiParams,
    paginationProps,
    handleColumnSort,
    // Raw accessors for custom needs
    page, setPage, pageSize, setPageSize,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, setSortBy, sortOrder, setSortOrder,
    filters, setFilter, removeFilter, resetFilters,
  };
}
