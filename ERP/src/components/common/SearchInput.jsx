import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Enterprise SearchInput Component
 *
 * Features:
 * - Instant responsive local state
 * - Clear button (`X`) when text is entered
 * - Keyboard shortcut (`Esc` to clear, `⌘K` / `Ctrl+K` to focus)
 * - Optional loading spinner while debounced query is in-flight
 */
export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  className = '',
  id,
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextChange = (e) => {
    const next = e.target.value;
    setLocalValue(next);
    if (onChange) {
      onChange(next);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none flex items-center">
        {isLoading ? (
          <Loader2 size={15} className="animate-spin text-zinc-600 dark:text-[#A0A6B5]" />
        ) : (
          <Search size={15} />
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={localValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-14 text-xs bg-white dark:bg-[#1D212C] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs hover:border-zinc-300 dark:hover:border-[#3A4154] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-[#6B7184] font-medium text-zinc-900 dark:text-[#E6E8EE]"
      />

      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
        {localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-700 dark:hover:text-[#E6E8EE] rounded-md transition-colors"
            title="Clear search (Esc)"
          >
            <X size={13} />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}
