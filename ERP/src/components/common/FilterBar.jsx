import React, { useState, useMemo } from 'react';
import { Search, X, Filter, ChevronDown, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import CustomSelect from './CustomSelect';
import FilterSidebar from './FilterSidebar';
import DateRangeFilter from './DateRangeFilter';
import ActionableSearchInput from './ActionableSearchInput';

export default function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  
  filters = [],
  onFilterChange,
  
  onRefresh,
  isLoading = false,
  onClearAll,
  
  activeFilterBadges = [],
  variant = 'default',
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeFilterCount = activeFilterBadges.length;

  // Custom sort: 'date' and 'dateRange' types go first, then 'priority', then order
  const sortedFilters = useMemo(() => {
    return [...filters].sort((a, b) => {
      const isADate = a.type === 'date' || a.type === 'dateRange';
      const isBDate = b.type === 'date' || b.type === 'dateRange';
      
      if (isADate && !isBDate) return -1;
      if (!isADate && isBDate) return 1;
      
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      
      return 0;
    });
  }, [filters]);

  const { priorityFilters, sidebarFilters } = useMemo(() => {
    const isAllPriority = sortedFilters.length <= 5;
    return {
      priorityFilters: isAllPriority ? sortedFilters : sortedFilters.slice(0, 5),
      sidebarFilters: isAllPriority ? [] : sortedFilters.slice(5)
    };
  }, [sortedFilters]);
  
  const sidebarActiveCount = activeFilterBadges.filter(
    b => !priorityFilters.some(pf => pf.key === b.id)
  ).length;

  const isMinimal = variant === 'minimal';

  return (
    <div className={isMinimal ? "space-y-3" : "p-4 border-b border-zinc-200 bg-white space-y-3"}>
      <div className={isMinimal ? "flex items-center gap-2" : "flex flex-wrap items-end justify-between gap-3"}>
        <div className={isMinimal ? "flex items-center gap-2 flex-1" : "flex flex-wrap gap-3 flex-1"}>
          {/* Search Input */}
          <div className={isMinimal ? "flex-1 min-w-[80px]" : "flex-[2] min-w-[120px]"}>
            <div className="relative">
              <ActionableSearchInput
                value={searchTerm || ''}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                label={isMinimal ? null : "Search"}
              />
            </div>
          </div>
          
          {/* Priority Filters */}
          {priorityFilters.map(filter => (
            <div key={filter.key} className={isMinimal ? "w-[104px]" : "flex-1 min-w-[96px]"}>
              {!isMinimal && (
                <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block truncate" title={filter.label}>
                  {filter.label}
                </label>
              )}
              {filter.type === 'select' ? (
                <CustomSelect
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  options={!filter.hideAllOption ? [{value: '', label: filter.label}, ...(filter.options || [])] : (filter.options || [])}
                  placeholder={filter.label}
                  searchable={filter.searchable ?? ((filter.options?.length || 0) > 10)}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-900/10 transition-all cursor-pointer"
                  dropdownClassName="bg-white border border-zinc-200 rounded-lg shadow-lg py-1 max-h-[200px] overflow-y-auto min-w-full z-50 text-[10.4px]"
                />
              ) : filter.type === 'dateRange' ? (
                <div className="w-full h-9">
                  <DateRangeFilter
                    value={filter.value || ''}
                    onChange={(v) => onFilterChange(filter.key, v)}
                  />
                </div>
              ) : filter.type === 'date' ? (
                <input
                  type="date"
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                />
              ) : (
                <input
                  type={filter.type}
                  placeholder={filter.label}
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                />
              )}
            </div>
          ))}
        </div>

        {/* Filter Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={onClearAll}
            className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95"
            title="Reset all filters"
          >
            <span>Reset</span>
          </button>

          {sidebarFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${sidebarActiveCount > 0
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {sidebarActiveCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                  {sidebarActiveCount}
                </span>
              )}
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95 shrink-0"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-zinc-800" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Applied Filters Chips */}
      {activeFilterBadges.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-[8.8px] font-bold tracking-wide border border-zinc-200"
            >
              {badge.label}
              <button 
                onClick={badge.onRemove} 
                className="hover:text-zinc-900 hover:bg-zinc-200 rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Render the Sidebar */}
      <FilterSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sidebarFilters={sidebarFilters}
        onFilterChange={onFilterChange}
        onClearAll={onClearAll}
      />
    </div>
  );
}
