import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * ActiveFilterChips Component
 *
 * Displays applied filter badges with individual remove buttons and a "Clear all" action.
 */
export default function ActiveFilterChips({
  chips = [],
  onClearAll,
  className = '',
}) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 pt-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mr-1">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id || chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/80 dark:bg-[#1D212C] dark:text-[#E6E8EE] dark:border-[#2A2F3D] shadow-2xs transition-all hover:bg-zinc-200/70 dark:hover:bg-[#222736]"
        >
          {chip.label && <span className="text-zinc-500 dark:text-[#A0A6B5] font-medium">{chip.label}:</span>}
          <span>{chip.value || chip.displayValue}</span>
          {chip.onRemove && (
            <button
              type="button"
              onClick={chip.onRemove}
              className="p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-[#222736] text-zinc-400 dark:text-[#6B7184] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors"
              title={`Remove ${chip.label || 'filter'}`}
            >
              <X size={11} />
            </button>
          )}
        </span>
      ))}

      {onClearAll && chips.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-[#4C8DFF] dark:hover:text-[#6AA1FF] hover:underline transition-colors ml-1 px-1.5 py-0.5"
        >
          <RotateCcw size={11} />
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
}
