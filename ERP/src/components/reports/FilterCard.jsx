import React, { useState } from 'react';
import { Filter, ChevronDown, RotateCcw, Search, Loader2 } from 'lucide-react';

/**
 * Collapsible filter card for report dashboards.
 *
 * @param {Object}  props
 * @param {string}  props.title         Card title (default "Report Filters")
 * @param {string}  props.subtitle      Optional helper text under the title
 * @param {ReactNode} props.children    Filter fields rendered in a responsive grid
 * @param {Function} props.onSearch     Called when the Search button is clicked
 * @param {Function} props.onReset      Called when the Reset button is clicked
 * @param {boolean}  props.isLoading    Disables Search and shows a spinner
 * @param {string}   props.searchLabel  Search button label (default "Search")
 * @param {ReactNode} props.toolbar     Optional action toolbar rendered on the left of the footer
 * @param {boolean}  props.defaultOpen  Whether the card starts expanded
 */
export default function FilterCard({
  title = 'Report Filters',
  subtitle,
  children,
  onSearch,
  onReset,
  isLoading = false,
  searchLabel = 'Search',
  toolbar = null,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10.4px] font-bold text-zinc-800">
          <Filter size={15} className="text-zinc-500" />
          {title}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[8.8px] font-semibold text-zinc-400">{isOpen ? 'Collapse' : 'Expand'}</span>
          <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <>
          <div className="px-5 pt-1 pb-3">
            {subtitle && <p className="text-[9.6px] text-zinc-400 mb-3">{subtitle}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{children}</div>
          </div>
          <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between gap-3 flex-wrap">
            {toolbar}
            <div className="flex items-center gap-2 ml-auto">
              {onReset && (
                <button onClick={onReset} type="button" className="btn-secondary">
                  <RotateCcw size={14} className="text-zinc-500" />
                  Reset
                </button>
              )}
              {onSearch && (
                <button onClick={onSearch} disabled={isLoading} type="button" className="btn-primary disabled:opacity-60">
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {isLoading ? 'Searching…' : searchLabel}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
