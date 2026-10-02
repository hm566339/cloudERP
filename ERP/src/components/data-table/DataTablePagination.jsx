import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

/**
 * Reusable DataTable pagination bar matching enterprise dashboard standards.
 */
export default function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'items',
  pageIndexBase = 0 // 0 for 0-indexed (Spring Boot), 1 for 1-indexed
}) {
  if (!pagination) return null;

  const rawPage = pagination.page ?? pagination.currentPage ?? (pageIndexBase === 0 ? 0 : 1);
  const pageSize = Number(pagination.pageSize ?? pagination.size ?? 10);
  const total = Number(pagination.total ?? pagination.totalElements ?? pagination.totalCount ?? 0);

  // Normalize page to 0-based for internal math
  const pageZero = pageIndexBase === 1 ? Math.max(0, rawPage - 1) : Math.max(0, rawPage);
  const totalPages = pagination.totalPages
    ? Number(pagination.totalPages)
    : Math.max(1, Math.ceil(total / pageSize));

  // 1-based display page
  const displayPage = Math.min(pageZero + 1, totalPages);

  const from = total > 0 ? pageZero * pageSize + 1 : 0;
  const to = Math.min((pageZero + 1) * pageSize, total);

  const canPrev = displayPage > 1;
  const canNext = displayPage < totalPages;

  const handlePageClick = (targetPageOneBased) => {
    if (!onPageChange) return;
    const targetPage = pageIndexBase === 1 ? targetPageOneBased : targetPageOneBased - 1;
    onPageChange(targetPage);
  };

  const getPageNumbers = useCallback(() => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, displayPage - delta);
      i <= Math.min(totalPages - 1, displayPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] - 1 > 1) rangeWithDots.push('...');
    rangeWithDots.unshift(1);
    range.forEach((r) => rangeWithDots.push(r));
    if (totalPages - range[range.length - 1] > 1) rangeWithDots.push('...');
    if (totalPages > 1) rangeWithDots.push(totalPages);

    return rangeWithDots;
  }, [displayPage, totalPages]);

  if (total === 0) return null;

  return (
    <div className="w-full px-4 py-3 sm:px-6 border-t border-zinc-200/80 bg-white">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Left: summary */}
        <div className="flex items-center justify-center md:justify-start">
          <p className="text-xs text-zinc-500 whitespace-nowrap">
            Showing <span className="font-semibold text-zinc-800">{from}–{to}</span> of{' '}
            <span className="font-semibold text-zinc-800">{total.toLocaleString()}</span> {itemName}
          </p>
        </div>

        {/* Middle: rows per page */}
        {onPageSizeChange && (
          <div className="flex items-center justify-center gap-2">
            <label className="text-xs text-zinc-500 whitespace-nowrap">Rows per page:</label>
            <CustomSelect
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              searchable={false}
              className="bg-transparent text-xs font-semibold text-zinc-700 focus:outline-none appearance-none cursor-pointer pr-4 hover:text-zinc-900 transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </CustomSelect>
          </div>
        )}

        {/* Right: navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-end">
          <button
            type="button"
            onClick={() => canPrev && handlePageClick(displayPage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span
                key={`dots-${idx}`}
                className="h-8 min-w-8 px-1 flex items-center justify-center text-zinc-400 text-xs"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => p !== displayPage && handlePageClick(p)}
                className={`h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all active:scale-95 ${
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
            type="button"
            onClick={() => canNext && handlePageClick(displayPage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
