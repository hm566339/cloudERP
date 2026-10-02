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
        <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full h-9 pl-8 pr-8 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
        />
        {localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue('');
              onChange('');
              setIsFocused(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && localValue && onCreateClick && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={handleCreate}
            className="w-full flex items-start gap-3 p-3 hover:bg-zinc-50 text-left transition-colors"
          >
            <Plus size={16} className="text-zinc-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-zinc-900 text-[10.4px] truncate">
                {createTitle ? createTitle(localValue) : `Create "${localValue}"`}
              </div>
              {createSubtext && (
                <div className="text-[8.8px] text-zinc-500 mt-0.5 truncate">
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
