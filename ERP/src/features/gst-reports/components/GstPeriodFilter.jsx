import React from 'react';
import { Search, RotateCcw, RefreshCw, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getDefaultPeriod() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  return { month, year };
}

export default function GstPeriodFilter({
  period,
  onPeriodChange,
  gstin,
  onGstinChange,
  onSearch,
  onReset,
  isLoading = false,
  showAdvanced = false,
  onToggleAdvanced,
  advancedCount = 0,
  advancedContent,
  showGstin = true,
  searchButtonText = 'Search',
  className = '',
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSearch) onSearch();
  };

  return (
    <div className={`bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark shadow-xs p-4 space-y-3 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          {/* Left Grid: Month, Year, GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1 items-end min-w-[280px]">
            {/* Return Month */}
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Return Month
              </label>
              <CustomSelect
                value={period?.month || 1}
                onChange={(e) => onPeriodChange && onPeriodChange({ ...period, month: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary dark:focus:border-primary/60 outline-none transition-all cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </CustomSelect>
            </div>

            {/* Return Year */}
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Return Year
              </label>
              <CustomSelect
                value={period?.year || currentYear}
                onChange={(e) => onPeriodChange && onPeriodChange({ ...period, year: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary dark:focus:border-primary/60 outline-none transition-all cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </CustomSelect>
            </div>

            {/* GSTIN (Optional) */}
            {showGstin && (
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={gstin || ''}
                  onChange={(e) => onGstinChange && onGstinChange(e.target.value)}
                  placeholder="e.g. 27AABCU9603R1ZM"
                  maxLength={15}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-primary dark:focus:border-primary/60 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 sm:pt-0">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-9 px-4 text-[10.4px] font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{isLoading ? 'Loading…' : searchButtonText}</span>
            </button>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="btn-secondary h-9 px-3 text-[10.4px] font-semibold bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Reset Filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}

            {onToggleAdvanced && (
              <button
                type="button"
                onClick={onToggleAdvanced}
                className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                  showAdvanced || advancedCount > 0
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-xs dark:bg-hover-dark dark:border-primary/50 dark:text-[#E6E8EE]'
                    : 'bg-white dark:bg-surface-dark border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-hover-dark/40 shadow-2xs'
                }`}
              >
                <Filter size={14} />
                <span>Advanced</span>
                {advancedCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-primary text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                    {advancedCount}
                  </span>
                )}
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showAdvanced && advancedContent && (
          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-border-dark animate-fade-in">
            <div className="bg-zinc-50/70 dark:bg-surface-dark/60 p-4 rounded-xl border border-zinc-200/80 dark:border-border-dark space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.6px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={13} className="text-zinc-500 dark:text-zinc-400" />
                  Additional Filter Parameters
                </span>
                <button
                  type="button"
                  onClick={onToggleAdvanced}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              {advancedContent}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

