import React from 'react';

/**
 * DataTableShell standardizes the table boundary, horizontal scroll behavior,
 * and pagination footer alignment.
 *
 * Spacing Specs:
 * - Table border: border border-zinc-200 rounded-lg overflow-hidden bg-white
 * - Cells: px-4 py-3
 * - Header: bg-zinc-100/80 border-b border-zinc-200
 */
export default function DataTableShell({
  children,
  toolbar,
  pagination,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full space-y-4 ${className}`} {...props}>
      {toolbar && (
        <div className="w-full">
          {toolbar}
        </div>
      )}
      <div className="w-full bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto w-full custom-scrollbar">
          {children}
        </div>
        {pagination && (
          <div className="border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 px-4 py-3">
            {pagination}
          </div>
        )}
      </div>
    </div>
  );
}
