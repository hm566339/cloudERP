import React from 'react';
import { Inbox, RotateCcw } from 'lucide-react';

/**
 * Domain-agnostic empty state for DataTable when no records match.
 */
export default function DataTableEmptyState({
  colSpan,
  message = 'No records found',
  description = 'Try adjusting your search or filters to find what you are looking for.',
  onReset,
  resetLabel = 'Reset Filters'
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-12 text-center">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#1D212C] flex items-center justify-center text-zinc-400 dark:text-[#A0A6B5] mb-3 border border-zinc-200 dark:border-[#2A2F3D]">
            <Inbox size={22} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] tracking-tight mb-1">{message}</h3>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] leading-relaxed mb-4">{description}</p>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95 shadow-2xs"
            >
              <RotateCcw size={13} />
              <span>{resetLabel}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
