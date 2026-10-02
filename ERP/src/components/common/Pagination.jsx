
import CustomSelect from './CustomSelect';
import React, { useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({
  page, // 0-based index from Spring Boot
  currentPage, // fallback for legacy usage
  totalPages,
  totalElements,
  totalCount, // fallback for legacy usage
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = 'items'
}) {
  const actualPage = page ?? currentPage ?? 0;
  const actualTotalElements = totalElements ?? totalCount ?? 0;
  const actualPageSize = Number(pageSize) || 10;
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  const displayPage = Math.min(actualPage + 1, safeTotalPages); // Convert 0-based to 1-based for UI
  const from = actualTotalElements > 0 ? (actualPage * actualPageSize) + 1 : 0;
  const to = Math.min((actualPage + 1) * actualPageSize, actualTotalElements);

  const canPrev = displayPage > 1;
  const canNext = displayPage < safeTotalPages;

  const getPageNumbers = useCallback(() => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, displayPage - delta);
      i <= Math.min(safeTotalPages - 1, displayPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] - 1 > 1) rangeWithDots.push('...');
    rangeWithDots.unshift(1);
    range.forEach((r) => rangeWithDots.push(r));
    if (safeTotalPages - range[range.length - 1] > 1) rangeWithDots.push('...');
    if (safeTotalPages > 1) rangeWithDots.push(safeTotalPages);

    return rangeWithDots;
  }, [displayPage, safeTotalPages]);

  if (actualTotalElements === 0) return null;

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4 border-t border-zinc-200/80 bg-white">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Left: summary */}
        <div className="flex items-center justify-center md:justify-start">
          <p className="text-sm text-zinc-500 whitespace-nowrap">
            Showing{' '}
            <span className="font-semibold text-zinc-800">{from}–{to}</span> of{' '}
            <span className="font-semibold text-zinc-800">{actualTotalElements.toLocaleString()}</span> {itemName}
          </p>
        </div>

        {/* Middle: rows per page */}
        {onPageSizeChange && (
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm text-zinc-500 whitespace-nowrap">Rows per page:</label>
            <CustomSelect
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              searchable={false}
              className="bg-transparent text-sm font-semibold text-zinc-700 focus:outline-none appearance-none cursor-pointer pr-4 hover:text-zinc-900 transition-colors"
              style={{ background: 'url(\'data:image/svg+xml;utf8,<svg fill="none" height="24" stroke="%2371717a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"/></svg>\') no-repeat right center / 14px 14px' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </CustomSelect>
          </div>
        )}

        {/* Right: previous / current page / next */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-end">
          <button
            onClick={() => canPrev && onPageChange(actualPage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <ChevronLeft size={15} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="h-8 min-w-8 px-1 flex items-center justify-center text-zinc-400 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => p !== displayPage && onPageChange(p - 1)}
                className={`h-8 min-w-8 px-1 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ${
                  p === displayPage
                    ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs'
                    : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => canNext && onPageChange(actualPage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Pagination)
