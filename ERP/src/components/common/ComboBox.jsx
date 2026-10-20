import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

export default function ComboBox({
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  label,
  onCreateClick,
  createSubtext = "Create new",
  createTitle,
  required = false,
  onSearchChange,
  serverSideSearch = false,
  inputClassName = "w-full h-9 pl-8 pr-8 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isFocused && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isFocused]);

  // Initialize search term from selected value
  // Do NOT overwrite if focused, so we don't erase user's active typing when API options return
  useEffect(() => {
    if (isFocused) return;

    if (value) {
      const selectedOption = options.find(o => o.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, options, isFocused]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        // On blur, if they typed something but didn't select, reset to current value
        if (value) {
          const selectedOption = options.find(o => o.value === value);
          setSearchTerm(selectedOption ? selectedOption.label : '');
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm) return options;
    return options.filter(o => 
      o.label?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      o.subLabel?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [options, debouncedSearchTerm]);

  const handleCreate = () => {
    if (onCreateClick) {
      onCreateClick(searchTerm);
      setIsFocused(false);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsFocused(false);
  };

  const showCreateOption = onCreateClick && (!searchTerm || !options.some(o => o.label?.toLowerCase() === searchTerm.toLowerCase()));

  return (
    <div className={`relative group ${isFocused ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (onSearchChange) {
              onSearchChange(e.target.value);
            }
            if (!isFocused) setIsFocused(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => setIsFocused(true)}
          className={inputClassName}
          required={required && !value}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearchTerm('');
              if (onSearchChange) {
                onSearchChange('');
              }
              setIsFocused(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && (filteredOptions.length > 0 || showCreateOption) && (
        <div className={`absolute left-0 w-full min-w-full sm:min-w-[220px] max-w-[calc(100vw-2rem)] bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto z-50 ${
          openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1'
        }`}>
          <div className="py-1">
            {filteredOptions.length === 0 && !showCreateOption && (
              <div className="py-6 text-center text-sm text-zinc-500">
                <p className="text-base mb-1">😕</p>
                No options found
              </div>
            )}
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 text-left transition-colors ${value === option.value ? 'bg-blue-50/50' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`text-[10.4px] truncate ${value === option.value ? 'font-semibold text-blue-700' : 'text-zinc-900 font-medium'}`}>
                    {option.label}
                  </div>
                  {option.subLabel && (
                    <div className="text-[8.8px] text-zinc-500 truncate mt-0.5">
                      {option.subLabel}
                    </div>
                  )}
                </div>
                {value === option.value && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            ))}
            
            {showCreateOption && (
              <>
                {filteredOptions.length > 0 && <div className="h-px bg-zinc-100 my-1"></div>}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreate}
                  className="w-full flex items-start gap-3 p-3 hover:bg-zinc-50 text-left transition-colors"
                >
                  <Plus size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 text-[10.4px] truncate">
                      {searchTerm ? (createTitle ? createTitle(searchTerm) : `Create "${searchTerm}"`) : (createSubtext || 'Create new')}
                    </div>
                    {searchTerm && createSubtext && (
                      <div className="text-[8.8px] text-zinc-500 mt-0.5 truncate">
                        {createSubtext}
                      </div>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
