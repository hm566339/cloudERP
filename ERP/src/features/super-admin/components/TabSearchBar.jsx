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
    blue: 'focus:border-blue-500 focus:ring-blue-100',
    indigo: 'focus:border-indigo-500 focus:ring-indigo-100',
    emerald: 'focus:border-emerald-500 focus:ring-emerald-100',
    amber: 'focus:border-amber-500 focus:ring-amber-100',
    violet: 'focus:border-violet-500 focus:ring-violet-100',
  };

  const focusClass = focusColors[accentColor] || focusColors.blue;

  return (
    <div className="p-4 border-b border-zinc-100 bg-zinc-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input Box */}
      <div className="relative flex-1 max-w-xl">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 pl-10 pr-20 text-xs sm:text-sm bg-white rounded-xl border border-zinc-200/90 shadow-2xs hover:border-zinc-300 ${focusClass} focus:ring-2 outline-none transition-all placeholder:text-zinc-400 font-medium`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              title="Clear search"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200/80 rounded shadow-2xs pointer-events-none">
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
            className="flex items-center p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/70 text-xs font-semibold overflow-x-auto"
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
                      ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-600 bg-white border border-zinc-200 shadow-2xs">
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
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
