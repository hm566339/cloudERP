import React from 'react';
import { Inbox, RotateCcw } from 'lucide-react';

export default function GstEmptyState({
  title = 'No records found',
  description = 'No report data exists for the selected return period and filters.',
  onReset,
  resetLabel = 'Reset Filters',
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-surface-dark flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3 border border-zinc-200 dark:border-border-dark">
        <Inbox size={22} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] tracking-tight mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] leading-relaxed mb-4">
          {description}
        </p>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary h-8 px-3 text-xs font-semibold bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
        >
          <RotateCcw size={13} />
          <span>{resetLabel}</span>
        </button>
      )}
    </div>
  );
}

