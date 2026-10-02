import React from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  X
} from 'lucide-react';
import DataTableFilters from './DataTableFilters';
import DataTableSearch from './DataTableSearch';
import ColumnVisibilityToggle from '../common/ColumnVisibilityToggle';

/**
 * Top toolbar for DataTable including search, quick filters, advanced filter toggle,
 * column visibility, export, reset, and refresh.
 */
export default function DataTableHeader({
  searchable = false,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchAction,
  searchDebounceMs = 400,
  createOption,
  data = [],
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  hasAdvancedFilters = false,
  isAdvancedOpen = false,
  onToggleAdvanced,
  activeAdvancedCount = 0,
  onRefresh,
  isRefreshing = false,
  columns = [],
  visibleColumns,
  onVisibleColumnsChange,
  onExport,
  exportLabel = 'Export',
  headerActions,
  leftHeaderActions,
  selectable = false,
  selectedCount = 0,
  onClearSelection,
  bulkActions = [],
  selectedRows = []
}) {
  return (
    <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Left Side: Search + Quick Basic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1 items-end">
          {/* Quick Search */}
          {searchable && (
            <DataTableSearch
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              debounceMs={searchDebounceMs}
              createOption={createOption}
              searchAction={searchAction}
              data={data}
            />
          )}

          {/* Basic Filter Inputs */}
          <DataTableFilters
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* Right Side: Toolbar Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
          {/* Selected Count Indicator */}
          {selectable && selectedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 h-9 bg-zinc-900 text-white rounded-lg text-[11px] font-medium animate-in fade-in slide-in-from-left-2 duration-150 shadow-2xs">
              <span className="font-semibold">{selectedCount}</span>
              <span>selected</span>
              {onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="p-0.5 text-zinc-400 hover:text-white rounded transition-colors ml-0.5"
                  title="Clear selection"
                  aria-label="Clear selection"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {/* Bulk Actions */}
          {selectable && selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
            <div className="flex items-center gap-1.5">
              {bulkActions.map((action) => (
                <button
                  key={action.key || action.id || action.label}
                  type="button"
                  onClick={() => action.onClick && action.onClick(selectedRows)}
                  disabled={action.disabled}
                  className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs ${
                    action.className || 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                  title={action.tooltip || action.label}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="h-9 px-3 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
              title={exportLabel}
            >
              <Download size={14} />
              <span>
                {selectedCount > 0 ? `Export (${selectedCount})` : exportLabel}
              </span>
            </button>
          )}

          {/* Left Header Actions */}
          {leftHeaderActions}

          {/* Column Visibility Selector */}
          {columns && columns.length > 0 && onVisibleColumnsChange && (
            <ColumnVisibilityToggle
              allColumns={columns.map((col) => ({
                id: col.key || col.id,
                label: col.label || col.key || col.id
              }))}
              visibleColumns={visibleColumns || columns.map((c) => c.key || c.id)}
              setVisibleColumns={onVisibleColumnsChange}
            />
          )}

          {/* Reset Filters */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          {/* Advanced Filters Toggle */}
          {hasAdvancedFilters && (
            <button
              type="button"
              onClick={onToggleAdvanced}
              className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                isAdvancedOpen || activeAdvancedCount > 0
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Advanced Filters</span>
              {activeAdvancedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                  {activeAdvancedCount}
                </span>
              )}
              {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
              title="Refresh List"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Extra Header Actions */}
          {headerActions}
        </div>
      </div>
    </div>
  );
}
