import React, { useRef, useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';

export default function ActionableSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
  onCreateClick,
  createSubtext = "Create new",
  createTitle
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const containerRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreate = () => {
    if (onCreateClick && localValue) {
      onCreateClick(localValue);
      setIsFocused(false);
    }
  };

  return (
    <div className="relative group z-20" ref={containerRef}>
      {label && (
        <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
        <input
          type="text"
          placeholder={placeholder}
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full h-9 pl-8 pr-8 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all"
        />
        {localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue('');
              onChange('');
              setIsFocused(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-[#6B7184] dark:hover:text-[#E6E8EE] transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && localValue && onCreateClick && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={handleCreate}
            className="w-full flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-[#222736] text-left transition-colors"
          >
            <Plus size={16} className="text-zinc-600 dark:text-[#4C8DFF] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE] text-[10.4px] truncate">
                {createTitle ? createTitle(localValue) : `Create "${localValue}"`}
              </div>
              {createSubtext && (
                <div className="text-[8.8px] text-zinc-500 dark:text-[#A0A6B5] mt-0.5 truncate">
                  {createSubtext}
                </div>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
