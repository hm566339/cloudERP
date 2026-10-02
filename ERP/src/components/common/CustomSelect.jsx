import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';
import useDebounce from '../../hooks/useDebounce';

const CustomSelect = React.forwardRef(({
  value,
  onChange,
  options: propOptions = [],
  placeholder = "Select an option",
  emptyMessage = "No options available",
  name,
  label,
  error,
  disabled = false,
  required = false,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  searchable,
  onSearch,
  isLoading = false,
  emptyStateAction = null,
  bottomAction = null,
  placement = 'auto',
  comboInput = false,
  onSearchChange = null,
  children
}, ref) => {
  const options = React.useMemo(() => {
    if (children) {
      const extracted = [];
      const traverse = (node) => {
        React.Children.forEach(node, child => {
          if (!child) return;
          if (child.type === 'option') {
            extracted.push({
              value: child.props.value !== undefined ? child.props.value : child.props.children,
              label: child.props.children
            });
          } else if (child.type === React.Fragment && child.props.children) {
            traverse(child.props.children);
          }
        });
      };
      traverse(children);
      if (extracted.length > 0) return extracted;
    }
    return propOptions;
  }, [children, propOptions]);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isSearchable = searchable !== undefined ? searchable : (!!onSearch || options.length > 10);

  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const debouncedSearch = React.useMemo(
    () =>
      debounce((term) => {
        if (onSearchRef.current) {
          onSearchRef.current(term);
        }
      }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      debouncedSearch(value);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const displayedOptions = React.useMemo(() => {
    if (onSearch) {
      return options;
    }
    if (!debouncedSearchTerm) return options;
    const lowerTerm = debouncedSearchTerm.toLowerCase();
    return options.filter(opt => {
      const optLabel = String(opt.label || opt.name || '');
      const optSubLabel = String(opt.subLabel || '');
      return optLabel.toLowerCase().includes(lowerTerm) || optSubLabel.toLowerCase().includes(lowerTerm);
    });
  }, [options, debouncedSearchTerm, onSearch]);

  // Notify parent when internal search term changes
  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);

  // Handle click outside and scroll to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Also check if the click was inside the portal dropdown (since it's outside the container tree in DOM)
        const isDropdownClick = event.target.closest('[data-custom-select-dropdown]');
        if (!isDropdownClick) {
          setIsOpen(false);
        }
      }
    }

    function handleScroll(event) {
      // Close dropdown when scrolling to prevent floating detached menu
      if (isOpen && event.target.nodeType === 1 && !event.target.closest('[data-custom-select-dropdown]')) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  // Clear search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      if (onSearchRef.current) {
        onSearchRef.current('');
      }
    }
  }, [isOpen]);

  // Reset focus when options change or dropdown opens
  useEffect(() => {
    setFocusedIndex(-1);
    if (isOpen && isSearchable && searchInputRef.current) {
      // Small timeout to ensure portal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, displayedOptions.length, isSearchable]);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Estimate actual dropdown height from option count (each item ~34px + 4px margin) + search bar (~36px) + footer (~40px)
      const estimatedHeight = Math.min(options.length * 38 + 76, 180);

      let topPosition = rect.bottom + 4;
      let bottomPosition = 'auto';
      let maxHeight = 180;

      // Flip upward if there isn't enough space below AND there is more space above, or if forced to top
      const shouldOpenUpwards = placement === 'top' || (placement === 'auto' && spaceBelow < estimatedHeight && spaceAbove > spaceBelow);

      if (shouldOpenUpwards) {
        topPosition = 'auto';
        bottomPosition = window.innerHeight - rect.top + 4;
        maxHeight = Math.min(180, spaceAbove - 10);
      } else {
        maxHeight = Math.min(180, spaceBelow - 10);
      }

      setDropdownCoords({
        top: topPosition,
        bottom: bottomPosition,
        left: rect.left,
        width: rect.width,
        openUpwards: shouldOpenUpwards,
        maxHeight
      });
    }
  }, [isOpen, options.length]);

  const selectedOption = options.find(opt => {
    if (value === undefined || value === null || value === '') return false;
    const optVal = opt.value !== undefined ? opt.value : opt.id;
    return optVal === value || String(optVal) === String(value);
  });
  const displayLabel = selectedOption ? (selectedOption.label || selectedOption.name) : placeholder;

  const handleSelect = (opt) => {
    if (onChange) {
      onChange({ target: { name, value: opt.value !== undefined ? opt.value : opt.id } });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, displayedOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < displayedOptions.length) {
        handleSelect(displayedOptions[focusedIndex]);
        buttonRef.current?.focus();
      }
    }
  };

  return (
    <div className={`relative w-full`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {label}
        </label>
      )}
      {/* Hidden input for form data if name is provided (without native browser validation popup) */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ''}
        />
      )}

      {comboInput ? (
        <div
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={`w-full flex items-center justify-between transition-all duration-200 shadow-sm
            ${buttonClassName ? buttonClassName : className ? className : `px-3 py-2 bg-white border border-zinc-200 rounded-md text-[10.4px] ${isOpen ? 'ring-2 ring-primary/20 border-primary' : 'hover:border-zinc-300'}`}
            ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''}
            ${disabled ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed' : ''}
          `}
          onClick={() => {
            if (!disabled && !isOpen) setIsOpen(true);
            searchInputRef.current?.focus();
          }}
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder={value ? displayLabel : placeholder}
            value={isOpen ? searchTerm : (value ? displayLabel : '')}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearch) debouncedSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent border-none outline-none text-zinc-800 placeholder:text-zinc-800 truncate focus:ring-0 p-0 text-inherit"
            disabled={disabled}
            style={{ fontSize: 'inherit' }}
          />
          <ChevronDown size={16} className={`text-zinc-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      ) : (
        <button
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between transition-all duration-200 shadow-sm
            ${buttonClassName ? buttonClassName : className ? className : `px-3 py-2 bg-white border border-zinc-200 rounded-md text-[10.4px] ${isOpen ? 'ring-2 ring-primary/20 border-primary' : 'hover:border-zinc-300'}`}
            ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''}
            ${disabled ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed' : ''}
          `}
        >
          <span className={`block truncate ${!value ? 'text-zinc-400' : 'text-zinc-800'}`}>
            {displayLabel}
          </span>
          <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && !disabled && createPortal(
        <div
          data-custom-select-dropdown="true"
          style={{
            position: 'fixed',
            top: dropdownCoords.top !== 'auto' ? `${dropdownCoords.top}px` : 'auto',
            bottom: dropdownCoords.bottom !== 'auto' ? `${dropdownCoords.bottom}px` : 'auto',
            left: `${dropdownCoords.left}px`,
            minWidth: `${dropdownCoords.width}px`,
            zIndex: 99999
          }}
          className={dropdownClassName ? dropdownClassName : "bg-white border border-zinc-200 rounded-lg shadow-md flex flex-col animate-in fade-in zoom-in-95 duration-100"}
        >
          {isSearchable && !comboInput && (
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0 z-10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  className="w-full h-8 pl-8 pr-3 text-[10.4px] bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 placeholder:text-zinc-400 transition-shadow"
                />
              </div>
            </div>
          )}

          <div
            role="listbox"
            className="overflow-y-auto p-1 flex-1"
            style={{ maxHeight: dropdownCoords.maxHeight ? `${dropdownCoords.maxHeight}px` : '180px' }}
          >
            {isLoading ? (
              <div className="py-4 flex items-center justify-center text-zinc-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : displayedOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500 text-center flex flex-col gap-2">
                <span>{emptyMessage}</span>
                {emptyStateAction && (
                  <div>
                    {typeof emptyStateAction === 'function' ? emptyStateAction({ closeDropdown: () => setIsOpen(false), searchTerm }) : emptyStateAction}
                  </div>
                )}
              </div>
            ) : (
              <>
                {displayedOptions.map((opt, idx) => {
                  const optValue = opt.value !== undefined ? opt.value : opt.id;
                  const optLabel = opt.label || opt.name;
                  const isSelected = value !== undefined && value !== null && value !== '' && (optValue === value || String(optValue) === String(value));
                  const isFocused = focusedIndex === idx;

                  return (
                    <button
                      key={idx}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full mb-1 last:mb-0 text-left px-2 py-1.5 min-h-[27.2px] rounded-md text-[10.4px] transition-colors flex items-center justify-between
                          ${isSelected ? 'bg-primary/10 text-primary font-bold' : isFocused ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'}
                        `}
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <span className="truncate">{optLabel}</span>
                        {opt.subLabel && (
                          <span className={`text-[8.8px] truncate mt-0.5 ${isSelected ? 'text-primary/80' : 'text-zinc-500'}`}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </>
            )}
          </div>
          {bottomAction && !isLoading && (displayedOptions.length > 0 || !emptyStateAction) && (
            <div className="shrink-0 overflow-hidden rounded-b-lg border-t border-zinc-100 bg-white">
              {typeof bottomAction === 'function' ? bottomAction({ closeDropdown: () => setIsOpen(false), searchTerm }) : bottomAction}
            </div>
          )}
        </div>,
        document.body
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

export default CustomSelect;
