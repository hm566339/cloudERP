import React from 'react';
import { ChevronLeft, ChevronRight, FileX } from 'lucide-react';

export default function ServerTable({ 
  columns, 
  data, 
  isLoading, 
  pagination, 
  onPageChange,
  emptyMessage = "No data found for the selected filters."
}) {
  const current = pagination ? (pagination.currentPage !== undefined ? pagination.currentPage : (pagination.page !== undefined ? pagination.page - 1 : 0)) : 0;

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-zinc-100 border-b border-zinc-200"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex px-6 py-4 border-b border-zinc-100">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-zinc-200 rounded w-full mx-2"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col overflow-hidden max-w-full min-w-0">
      <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse" aria-label="Report table">
          <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-20">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap select-none ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-zinc-50/70 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 whitespace-nowrap text-[13px] md:text-sm text-zinc-800 ${col.cellClassName || ''}`}>
                      {col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : row[col.id]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <FileX size={48} className="mb-2 text-zinc-400" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="bg-white px-4 py-3 border-t border-zinc-200 flex items-center justify-between sm:px-6 rounded-b-xl">
          {/* Mobile view */}
          <div className="flex sm:hidden items-center justify-between w-full gap-2">
            <p className="text-xs text-zinc-600 truncate">
              Page <span className="font-semibold text-zinc-900">{current + 1}</span> of{' '}
              <span className="font-semibold text-zinc-900">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onPageChange(current - 1)}
                disabled={!pagination.hasPrevious || isLoading}
                aria-label="Previous page"
                className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(current + 1)}
                disabled={!pagination.hasNext || isLoading}
                aria-label="Next page"
                className="h-8 px-2 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-600">
                Showing page <span className="font-semibold text-zinc-900">{current + 1}</span> of{' '}
                <span className="font-semibold text-zinc-900">{pagination.totalPages}</span>
                {' '}({pagination.totalElements} total records)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-lg shadow-2xs -space-x-px" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => onPageChange(current - 1)}
                  disabled={!pagination.hasPrevious || isLoading}
                  aria-label="Previous page"
                  className="relative inline-flex items-center px-2 py-1.5 rounded-l-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(current + 1)}
                  disabled={!pagination.hasNext || isLoading}
                  aria-label="Next page"
                  className="relative inline-flex items-center px-2 py-1.5 rounded-r-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
