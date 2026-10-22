import React from 'react';
import { Search, X } from 'lucide-react';

export default function TabSearchBar({
  search,
  setSearch,
  placeholder,
  totalCount,
  filteredCount,
  filters = [],
  accentColor = 'blue',
  onReset,
}) {
  const isFiltered = Boolean(
    (search && search.trim().length > 0) ||
    filters.some((f) => f.value && f.value !== 'ALL')
  );

  const focusColors = {
    blue: 'focus:border-zinc-400 focus:ring-blue-100',
    indigo: 'focus:border-zinc-400 focus:ring-indigo-100',
    emerald: 'focus:border-emerald-500 focus:ring-emerald-100',
    amber: 'focus:border-amber-500 focus:ring-amber-100',
    violet: 'focus:border-violet-500 focus:ring-violet-100',
  };

  const focusClass = focusColors[accentColor] || focusColors.blue;

  return (
    <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/60 dark:bg-[#1D212C] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input Box */}
      <div className="relative flex-1 max-w-xl">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 pl-10 pr-20 text-xs sm:text-sm bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 ${focusClass} focus:ring-2 outline-none transition-all placeholder:text-zinc-400 dark:placeholder-[#6B7184] font-medium`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-lg transition-colors"
              title="Clear search"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 dark:text-[#6B7184] bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] rounded shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Filter Options & Results Count */}
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map((filterGroup) => (
          <div
            key={filterGroup.id}
            className="flex items-center p-1 bg-zinc-100/90 dark:bg-[#161922] rounded-xl border border-zinc-200/70 dark:border-[#2A2F3D] text-xs font-semibold overflow-x-auto"
          >
            {filterGroup.options.map((opt) => {
              const active = filterGroup.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => filterGroup.onChange(opt.value)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200/60 dark:border-[#2A2F3D]'
                      : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-white/50 dark:hover:bg-[#1D212C]/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ))}

        {/* Counter Badge & Reset */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-[#A0A6B5] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            {filteredCount === totalCount ? (
              <span>{totalCount} Total</span>
            ) : (
              <span>{filteredCount} of {totalCount}</span>
            )}
          </span>

          {isFiltered && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-bold text-blue-600 dark:text-[#4C8DFF] hover:text-blue-800 dark:hover:text-[#6AA1FF] hover:underline transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
