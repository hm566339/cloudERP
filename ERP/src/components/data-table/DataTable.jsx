import React, { useState, useMemo } from 'react';
import DataTableHeader from './DataTableHeader';
import DataTableAdvancedFilters from './DataTableAdvancedFilters';
import DataTableBody from './DataTableBody';
import DataTablePagination from './DataTablePagination';
import { getSerialNumber } from '../../utils/serialNumberHelper';

/**
 * Enterprise-grade generic reusable DataTable component.
 *
 * Supports:
 * - Configuration-driven columns and custom cell rendering
 * - Built-in search, quick filters, and expandable grouped advanced filters
 * - Sortable columns with direction indicators
 * - Column visibility controls
 * - Responsive table with horizontal scroll and sticky action column
 * - Customizable row actions with permission checks & tooltips
 * - Expandable row drawers
 * - Skeleton loading state and clean empty state
 * - Full pagination with rows-per-page selector
 * - Export and refresh buttons
 * - Both server-side API integration and client-side operation
 */
export default function DataTable({
  // Data & Columns
  columns = [],
  data = [],
  rowKey = 'id',

  // Column Visibility
  visibleColumns,
  defaultVisibleColumns,
  onVisibleColumnsChange,

  // Search
  search,
  searchable = false,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchDebounceMs = 400,
  createOption,
  searchAction,

  // Basic Filters
  basicFilters,
  filters: rawFilters = [],
  filterValues: rawFilterValues,
  onFilterChange,

  // Advanced Filters
  advancedFilters = [],
  isAdvancedOpen: controlledAdvancedOpen,
  defaultAdvancedOpen = false,
  onToggleAdvanced: controlledToggleAdvanced,

  // Actions & Callbacks
  onReset,
  onResetFilters,
  onRefresh,
  isRefreshing = false,
  onExport,
  exportLabel = 'Export',
  headerActions,
  leftHeaderActions,

  // Table Rows & Expansion
  rowActions = [],
  getRowActions,
  showIndex = true,
  pageIndexBase = 0, // 0 for 0-indexed APIs, 1 for 1-indexed APIs
  expandedRowId: controlledExpandedRowId,
  onToggleExpand: controlledToggleExpand,
  renderExpandedRow,
  onRowClick,
  rowClassName,

  // Sorting
  sort,
  onSortChange,

  // Pagination
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'items',

  // States
  loading = false,
  skeletonRows = 8,
  emptyMessage = 'No records found',
  emptyDescription,

  // Layout & Container Styling
  className = '',
  tableClassName = '',

  // Row Selection
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  bulkActions = [],

  // Permissions & Dynamic RBAC
  permissionFeature,
  feature,
  module
}) {
  const effectivePermissionFeature = permissionFeature || feature || module;
  // Row Selection (Controlled or Uncontrolled)
  const [internalSelectedRows, setInternalSelectedRows] = useState([]);
  const activeSelectedRows = controlledSelectedRows !== undefined ? controlledSelectedRows : internalSelectedRows;

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (rowKey && row[rowKey] !== undefined) return row[rowKey];
    if (row.id !== undefined) return row.id;
    if (row._id !== undefined) return row._id;
    return index;
  };

  const handleSelectionChange = (nextSelectedKeys) => {
    if (onSelectionChange) {
      const selectedObjects = (data || []).filter((row, idx) =>
        nextSelectedKeys.includes(getRowKey(row, idx))
      );
      onSelectionChange(nextSelectedKeys, selectedObjects);
    } else {
      setInternalSelectedRows(nextSelectedKeys);
    }
  };

  const handleSelectRow = (key, row, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const isSelected = activeSelectedRows.includes(key);
    const nextSelected = isSelected
      ? activeSelectedRows.filter((id) => id !== key)
      : [...activeSelectedRows, key];
    handleSelectionChange(nextSelected);
  };

  const handleSelectAll = (shouldSelectAll, currentPageKeys) => {
    let nextSelected;
    if (shouldSelectAll) {
      nextSelected = Array.from(new Set([...activeSelectedRows, ...currentPageKeys]));
    } else {
      nextSelected = activeSelectedRows.filter((id) => !currentPageKeys.includes(id));
    }
    handleSelectionChange(nextSelected);
  };

  const handleClearSelection = () => {
    handleSelectionChange([]);
  };
  // Internal Column Visibility State (if not controlled)
  const [internalVisibleColumns, setInternalVisibleColumns] = useState(() => {
    if (defaultVisibleColumns) return defaultVisibleColumns;
    return columns.map((c) => c.key || c.id);
  });

  const activeVisibleColumns = visibleColumns !== undefined ? visibleColumns : internalVisibleColumns;
  const handleVisibleColumnsChange = (next) => {
    if (onVisibleColumnsChange) {
      onVisibleColumnsChange(next);
    } else {
      setInternalVisibleColumns(next);
    }
  };

  // Filter columns by active visibility
  const displayedColumns = useMemo(() => {
    if (!activeVisibleColumns || activeVisibleColumns.length === 0) return columns;
    return columns.filter((c) => activeVisibleColumns.includes(c.key || c.id));
  }, [columns, activeVisibleColumns]);

  // Internal Advanced Filter Drawer State (if not controlled)
  const [internalAdvancedOpen, setInternalAdvancedOpen] = useState(defaultAdvancedOpen);
  const isAdvancedOpen = controlledAdvancedOpen !== undefined ? controlledAdvancedOpen : internalAdvancedOpen;

  const handleToggleAdvanced = () => {
    if (controlledToggleAdvanced) {
      controlledToggleAdvanced(!isAdvancedOpen);
    } else {
      setInternalAdvancedOpen((prev) => !prev);
    }
  };

  // Internal Row Expansion State (if not controlled)
  const [internalExpandedId, setInternalExpandedId] = useState(null);
  const activeExpandedId = controlledExpandedRowId !== undefined ? controlledExpandedRowId : internalExpandedId;

  const handleToggleExpand = (id, row) => {
    if (controlledToggleExpand) {
      controlledToggleExpand(id, row);
    } else {
      setInternalExpandedId((prev) => (prev === id ? null : id));
    }
  };

  // Normalize Basic Filters (Schema/Config)
  const effectiveBasicFilters = Array.isArray(basicFilters)
    ? basicFilters
    : Array.isArray(rawFilters)
    ? rawFilters
    : [];

  // Normalize Filter Values (Values dictionary)
  const effectiveFilterValues =
    rawFilterValues && typeof rawFilterValues === 'object' && !Array.isArray(rawFilterValues)
      ? rawFilterValues
      : rawFilters && typeof rawFilters === 'object' && !Array.isArray(rawFilters)
      ? rawFilters
      : {};

  const effectiveOnReset = onReset || onResetFilters;

  // Count active advanced filter values
  const activeAdvancedCount = useMemo(() => {
    if (!Array.isArray(advancedFilters) || advancedFilters.length === 0) return 0;
    let count = 0;
    advancedFilters.forEach((group) => {
      (group.fields || []).forEach((field) => {
        const fieldKey = field.key || field.id;
        const val = effectiveFilterValues[fieldKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          count++;
        }
      });
    });
    return count;
  }, [advancedFilters, effectiveFilterValues]);

  // Calculate page offset for index numbering (#)
  const pageIndexOffset = useMemo(() => {
    if (!pagination) return 0;
    const rawPage = pagination.page ?? pagination.currentPage ?? (pageIndexBase === 0 ? 0 : 1);
    const size = Number(pagination.pageSize ?? pagination.size ?? 10);
    const effectiveBase = (pagination.currentPage !== undefined && pagination.page === undefined) ? 1 : pageIndexBase;
    const firstSerial = getSerialNumber({ page: rawPage, pageSize: size, rowIndex: 0, pageBase: effectiveBase });
    return typeof firstSerial === 'number' ? firstSerial - 1 : 0;
  }, [pagination, pageIndexBase]);

  // Search Configuration Normalization
  const searchConfig = typeof search === 'object' && search !== null ? search : {};
  const isSearchable = Boolean(searchable || search);
  const activeSearchValue = searchConfig.value !== undefined ? searchConfig.value : searchValue;
  const activeSearchPlaceholder = searchConfig.placeholder || searchPlaceholder || 'Search...';
  const activeOnSearchChange = searchConfig.onChange || onSearchChange;
  const activeDebounceMs = searchConfig.debounceMs ?? searchDebounceMs ?? 400;
  const activeCreateOption = searchConfig.createOption || createOption;
  const activeSearchAction = searchConfig.searchAction || searchAction;

  const hasToolbar = Boolean(
    isSearchable ||
    (effectiveBasicFilters && effectiveBasicFilters.length > 0) ||
    effectiveOnReset ||
    (Array.isArray(advancedFilters) && advancedFilters.length > 0) ||
    onRefresh ||
    onExport ||
    (columns && columns.length > 0) ||
    (selectable && activeSelectedRows.length > 0) ||
    headerActions
  );

  return (
    <div
      className={`bg-[var(--color-surface)] dark:bg-[#161922] rounded-xl shadow-xs border border-[var(--color-border)] dark:border-[#2A2F3D] flex flex-col flex-1 h-full overflow-hidden min-h-0 ${className}`}
    >
      {/* 1. Header Toolbar */}
      {hasToolbar && (
        <DataTableHeader
          searchable={isSearchable}
          searchValue={activeSearchValue}
          searchPlaceholder={activeSearchPlaceholder}
          onSearchChange={activeOnSearchChange}
          searchDebounceMs={activeDebounceMs}
          createOption={activeCreateOption}
          searchAction={activeSearchAction}
          data={data}
          filters={effectiveBasicFilters}
          filterValues={effectiveFilterValues}
          onFilterChange={onFilterChange}
          onReset={effectiveOnReset}
          hasAdvancedFilters={Array.isArray(advancedFilters) && advancedFilters.length > 0}
          isAdvancedOpen={isAdvancedOpen}
          onToggleAdvanced={handleToggleAdvanced}
          activeAdvancedCount={activeAdvancedCount}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing || loading}
          columns={columns}
          visibleColumns={activeVisibleColumns}
          onVisibleColumnsChange={handleVisibleColumnsChange}
          onExport={onExport ? () => onExport({ selectedRows: activeSelectedRows, selectedCount: activeSelectedRows.length }) : undefined}
          exportLabel={exportLabel}
          headerActions={headerActions}
          leftHeaderActions={leftHeaderActions}
          selectable={selectable}
          selectedCount={activeSelectedRows.length}
          onClearSelection={handleClearSelection}
          bulkActions={bulkActions}
          selectedRows={activeSelectedRows}
          permissionFeature={effectivePermissionFeature}
        />
      )}

      {/* 2. Expandable Advanced Filters Panel */}
      {advancedFilters && advancedFilters.length > 0 && (
        <DataTableAdvancedFilters
          isOpen={isAdvancedOpen}
          onClose={() => handleToggleAdvanced()}
          groups={advancedFilters}
          filterValues={effectiveFilterValues}
          onFilterChange={onFilterChange}
        />
      )}

      {/* 3. Main Table Body */}
      <DataTableBody
        columns={displayedColumns}
        data={data}
        loading={loading}
        skeletonRows={skeletonRows}
        emptyMessage={emptyMessage}
        emptyDescription={emptyDescription}
        onReset={effectiveOnReset}
        sort={sort}
        onSortChange={onSortChange}
        showIndex={showIndex}
        pageIndexOffset={pageIndexOffset}
        rowActions={getRowActions || rowActions}
        selectable={selectable}
        selectedRows={activeSelectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        expandedRowId={activeExpandedId}
        onToggleExpand={handleToggleExpand}
        renderExpandedRow={renderExpandedRow}
        rowKey={rowKey}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        tableClassName={tableClassName}
        permissionFeature={effectivePermissionFeature}
      />

      {/* 4. Bottom Pagination */}
      {pagination && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          itemName={itemName}
          pageIndexBase={pageIndexBase}
        />
      )}
    </div>
  );
}
