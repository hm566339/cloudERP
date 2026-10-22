import React from 'react';

/**
 * Skeleton loading state for DataTable matching column layout.
 */
export default function DataTableLoading({ columnCount = 6, rowCount = 8 }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="border-b border-zinc-100 dark:border-[#2A2F3D] animate-pulse">
          {Array.from({ length: columnCount }).map((_, cIdx) => (
            <td key={`skeleton-cell-${cIdx}`} className="p-3.5">
              <div
                className="h-4 bg-zinc-200/70 dark:bg-[#1D212C] rounded-md"
                style={{
                  width: cIdx === 0 ? '24px' : cIdx === 1 ? '70%' : cIdx === columnCount - 1 ? '80px' : `${Math.floor(40 + ((cIdx * 19 + rIdx * 13) % 45))}%`
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
