import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Search, Plus, X } from 'lucide-react';

/**
 * Generic reusable search input for DataTable with:
 * - Debounced search input (default 400ms)
 * - Immediate clear
 * - Configurable "Create New" autocomplete dropdown suggestion
 * - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
 * - Click-outside dismissal
 * - Matching detection to prevent redundant create suggestions
 */
export default function DataTableSearch({
  value = '',
  onChange,
  placeholder = 'Search...',
  label = 'Search',
  debounceMs = 400,
  createOption,
  searchAction,
  data = [],
  className = ''
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value changes (e.g. filter reset or URL change)
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Handle debounced search notification
  const handleInputChange = (e) => {
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    setIsHighlighted(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onChange && nextVal !== value) {
        onChange(nextVal);
      }
    }, debounceMs);
  };

  // Immediate clear on X button
  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue('');
    setIsHighlighted(false);
    setIsFocused(false);
    if (onChange) {
      onChange('');
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        setIsHighlighted(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine if exact match exists in current data
  const hasExactMatch = useCallback(() => {
    const trimmed = (localValue || '').trim().toLowerCase();
    if (!trimmed) return false;

    if (createOption?.matchExisting) {
      return createOption.matchExisting(localValue, data);
    }

    return (data || []).some((item) => {
      if (!item) return false;
      if (typeof item === 'string') return item.trim().toLowerCase() === trimmed;

      const candidates = [
        item.customerName,
        item.name,
        item.title,
        item.customerCode,
        item.code,
        item.quotationNumber,
        item.invoiceNumber,
        item.orderNumber,
        item.challanNumber,
        item.receiptNo
      ].filter(Boolean);

      return candidates.some((c) => String(c).trim().toLowerCase() === trimmed);
    });
  }, [localValue, data, createOption]);

  // Determine if create option should be shown
  const shouldShowCreateOption = Boolean(
    isFocused &&
    localValue &&
    localValue.trim().length > 0 &&
    (
      (createOption?.enabled &&
        !hasExactMatch() &&
        (!createOption.showWhenNoResults || (data && data.length === 0))
      ) ||
      searchAction
    )
  );

  const handleTriggerCreate = () => {
    const trimmed = (localValue || '').trim();
    if (!trimmed) return;

    if (createOption?.onCreate) {
      createOption.onCreate(trimmed);
      setIsFocused(false);
      setIsHighlighted(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!shouldShowCreateOption) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsHighlighted(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsHighlighted(false);
    } else if (e.key === 'Enter') {
      if (isHighlighted || shouldShowCreateOption) {
        e.preventDefault();
        handleTriggerCreate();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      setIsHighlighted(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-9 pl-8 pr-8 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] p-0.5 focus:outline-none transition-colors"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}

        {/* Suggestion Dropdown */}
        {shouldShowCreateOption && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-lg dark:shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {createOption?.enabled ? (
              <button
                type="button"
                onClick={handleTriggerCreate}
                className={`w-full text-left px-3 py-2 text-[10.4px] transition-colors flex items-center gap-2 ${
                  isHighlighted
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-[#222736] dark:text-[#E6E8EE]'
                    : 'text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 dark:bg-[#4C8DFF]/15 flex items-center justify-center shrink-0">
                  <Plus size={14} className="text-primary dark:text-[#4C8DFF]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">
                    {typeof createOption.label === 'function'
                      ? createOption.label(localValue)
                      : (createOption.label || `Create "${localValue}"`)}
                  </span>
                  {createOption.description && (
                    <span className="text-[8.8px] text-zinc-500 dark:text-[#A0A6B5] truncate">
                      {typeof createOption.description === 'function'
                        ? createOption.description(localValue)
                        : createOption.description}
                    </span>
                  )}
                </div>
              </button>
            ) : searchAction ? (
              searchAction(localValue)
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
