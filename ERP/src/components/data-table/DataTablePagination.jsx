import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import { getSerialNumberRange } from '../../utils/serialNumberHelper';

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

  const effectiveBase = (pagination.currentPage !== undefined && pagination.page === undefined) ? 1 : pageIndexBase;
  // Normalize page to 0-based for internal math
  const pageZero = effectiveBase === 1 ? Math.max(0, rawPage - 1) : Math.max(0, rawPage);
  const totalPages = pagination.totalPages
    ? Number(pagination.totalPages)
    : Math.max(1, Math.ceil(total / pageSize));

  // 1-based display page
  const displayPage = Math.min(pageZero + 1, totalPages);

  const { from, to } = getSerialNumberRange({ page: rawPage, pageSize, total, pageBase: effectiveBase });

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
    <div className="w-full px-4 py-3 sm:px-6 border-t border-zinc-200/80 dark:border-[#2A2F3D] bg-white dark:bg-[#161922]">
      {/* Mobile view (< sm) */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] truncate">
          <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{from}–{to}</span> of{' '}
          <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{total.toLocaleString()}</span>
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-zinc-500 mr-1">
            {displayPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => canPrev && handlePageClick(displayPage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => canNext && handlePageClick(displayPage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Desktop / Tablet view (>= sm) */}
      <div className="hidden sm:flex flex-wrap gap-4 items-center justify-between">
        {/* Left: summary */}
        <div className="flex items-center justify-center md:justify-start">
          <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] whitespace-nowrap">
            Showing <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{from}–{to}</span> of{' '}
            <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{total.toLocaleString()}</span> {itemName}
          </p>
        </div>

        {/* Middle: rows per page */}
        {onPageSizeChange && (
          <div className="flex items-center justify-center gap-2">
            <label className="text-xs text-zinc-500 dark:text-[#A0A6B5] whitespace-nowrap">Rows per page:</label>
            <CustomSelect
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              searchable={false}
              className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] focus:outline-none appearance-none cursor-pointer pr-4 hover:text-zinc-900 dark:hover:text-[#E6E8EE] transition-colors"
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
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-[#3A4154] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span
                key={`dots-${idx}`}
                className="h-8 min-w-8 px-1 flex items-center justify-center text-zinc-400 dark:text-[#6B7184] text-xs"
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
                    ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF] dark:text-white border border-zinc-900 dark:border-[#4C8DFF] shadow-xs'
                    : 'border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-[#3A4154]'
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
            className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-[#3A4154] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
