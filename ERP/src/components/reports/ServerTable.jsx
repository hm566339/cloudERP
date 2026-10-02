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
          <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex px-6 py-4 border-b border-gray-100">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-full mx-2"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.cellClassName || ''}`}>
                      {col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : row[col.id]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FileX size={48} className="mb-2 text-gray-400" />
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
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6 rounded-b-lg">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{current + 1}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span>
                {' '}({pagination.totalElements} total records)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(current - 1)}
                  disabled={!pagination.hasPrevious || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onPageChange(current + 1)}
                  disabled={!pagination.hasNext || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
