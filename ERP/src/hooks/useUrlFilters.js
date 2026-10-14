import useListQuery from './useListQuery';

/**
 * useUrlFilters — Compatibility layer built directly on useListQuery.
 * Ensures all existing list views benefit from:
 * 1. URL search params synchronization
 * 2. 350ms debounced search
 * 3. Automatic page reset on filter/search change
 * 4. Bound paginationProps
 * 5. AbortController signal support
 */
export function useUrlFilters({ defaultPageSize = 10, defaultSortBy = '', defaultSortOrder = 'asc' } = {}) {
  const list = useListQuery(null, {
    defaultPageSize,
    defaultSortBy,
    defaultSortOrder,
    sizeParam: 'size',
  });

  return {
    ...list,
    page: list.page,
    setPage: list.setPage,
    pageSize: list.pageSize,
    setPageSize: list.setPageSize,
    searchTerm: list.searchTerm,
    setSearchTerm: list.setSearch,
    debouncedSearch: list.debouncedSearch,
    sortBy: list.sortBy,
    setSortBy: list.setSort,
    sortOrder: list.sortOrder,
    setSortOrder: (dir) => list.setSort(list.sortBy),
    handleColumnSort: list.setSort,
    filters: list.filters,
    setFilter: list.setFilter,
    removeFilter: list.removeFilter,
    resetFilters: list.resetFilters,
    apiParams: list.queryParams,
  };
}

export default useUrlFilters;
