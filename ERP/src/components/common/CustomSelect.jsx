import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, Loader2, X } from 'lucide-react';
import debounce from 'lodash/debounce';
import useDebounce from '../../hooks/useDebounce';

/**
 * Enterprise ERP CustomSelect Component.
 * Supports single-select, searchable select, multi-select, loading, empty states,
 * keyboard accessibility, and portal-rendered floating menus to avoid container clipping.
 */
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
  isMulti = false,
  size = 'md',
  icon: PrefixIcon = null,
  isClearable = false,
  onClear = null,
  children,
  ...restProps
}, ref) => {
  // Extract options from propOptions or <option> children
  const options = useMemo(() => {
    if (children) {
      const extracted = [];
      const traverse = (node) => {
        React.Children.forEach(node, child => {
          if (!child) return;
          if (child.type === 'option') {
            extracted.push({
              value: child.props.value !== undefined ? child.props.value : child.props.children,
              label: child.props.children,
              disabled: Boolean(child.props.disabled),
              subLabel: child.props['data-sublabel'] || child.props.subLabel,
              icon: child.props.icon,
            });
          } else if (child.type === React.Fragment && child.props.children) {
            traverse(child.props.children);
          }
        });
      };
      traverse(children);
      if (extracted.length > 0) return extracted;
    }

    if (Array.isArray(propOptions)) {
      return propOptions.map((opt) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { value: opt, label: String(opt) };
        }
        return {
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label || opt.name || String(opt.value ?? opt.id ?? ''),
          subLabel: opt.subLabel || opt.code || opt.description,
          disabled: Boolean(opt.disabled),
          icon: opt.icon,
          badge: opt.badge,
        };
      });
    }

    return [];
  }, [children, propOptions]);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Automatically enable search if searchable is true or option count > 7
  const isSearchable = searchable !== undefined ? searchable : (Boolean(onSearch) || options.length > 7);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        if (onSearchRef.current) {
          onSearchRef.current(term);
        }
      }, 250),
    []
  );

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      debouncedSearch(term);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  const displayedOptions = useMemo(() => {
    if (onSearch) {
      return options;
    }
    if (!debouncedSearchTerm.trim()) return options;
    const lower = debouncedSearchTerm.toLowerCase();
    return options.filter((opt) => {
      const optLabel = String(opt.label || opt.name || '');
      const optSub = String(opt.subLabel || '');
      const optVal = String(opt.value || '');
      return optLabel.toLowerCase().includes(lower) ||
             optSub.toLowerCase().includes(lower) ||
             optVal.toLowerCase().includes(lower);
    });
  }, [options, debouncedSearchTerm, onSearch]);

  // Notify parent of internal search changes if subscribed
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);

  // Click outside and scroll listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        const isDropdownClick = event.target.closest('[data-custom-select-dropdown]');
        if (!isDropdownClick) {
          setIsOpen(false);
        }
      }
    }

    function handleScroll(event) {
      // Close dropdown if user scrolls the parent document or modal
      if (isOpen && event.target && event.target.nodeType === 1) {
        if (!event.target.closest('[data-custom-select-dropdown]')) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Reset search term when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setFocusedIndex(-1);
      if (onSearchRef.current) {
        onSearchRef.current('');
      }
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Reposition dropdown coordinates
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const estimatedHeight = Math.min(displayedOptions.length * 36 + (isSearchable ? 48 : 12), 260);
      const shouldOpenUpwards = placement === 'top' || (placement === 'auto' && spaceBelow < estimatedHeight && spaceAbove > spaceBelow);

      let topPosition = rect.bottom + 4;
      let bottomPosition = 'auto';
      let maxHeight = 260;

      if (shouldOpenUpwards) {
        topPosition = 'auto';
        bottomPosition = viewportHeight - rect.top + 4;
        maxHeight = Math.max(120, Math.min(260, spaceAbove - 16));
      } else {
        maxHeight = Math.max(120, Math.min(260, spaceBelow - 16));
      }

      setDropdownCoords({
        top: topPosition,
        bottom: bottomPosition,
        left: Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8)),
        width: rect.width,
        openUpwards: shouldOpenUpwards,
        maxHeight,
      });
    }
  }, [displayedOptions.length, isSearchable, placement]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Value resolution
  const isValueSelected = (optVal) => {
    if (isMulti) {
      if (!Array.isArray(value)) return false;
      return value.some((v) => v === optVal || String(v) === String(optVal));
    }
    if (value === undefined || value === null || value === '') return false;
    return value === optVal || String(value) === String(optVal);
  };

  const selectedOption = useMemo(() => {
    if (isMulti) return null;
    return options.find((opt) => isValueSelected(opt.value !== undefined ? opt.value : opt.id));
  }, [options, value, isMulti]);

  const selectedMultiOptions = useMemo(() => {
    if (!isMulti || !Array.isArray(value)) return [];
    return options.filter((opt) => isValueSelected(opt.value !== undefined ? opt.value : opt.id));
  }, [options, value, isMulti]);

  const displayLabel = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(value) || value.length === 0) return placeholder;
      if (value.length === 1 && selectedMultiOptions[0]) {
        return selectedMultiOptions[0].label || selectedMultiOptions[0].name;
      }
      return `${value.length} selected`;
    }
    return selectedOption ? (selectedOption.label || selectedOption.name) : placeholder;
  }, [isMulti, value, selectedOption, selectedMultiOptions, placeholder]);

  // Selection handler
  const handleSelect = (opt) => {
    if (opt.disabled) return;
    const optVal = opt.value !== undefined ? opt.value : opt.id;

    if (isMulti) {
      const currentArr = Array.isArray(value) ? [...value] : [];
      const existsIndex = currentArr.findIndex((v) => v === optVal || String(v) === String(optVal));
      let nextArr;
      if (existsIndex >= 0) {
        nextArr = currentArr.filter((_, i) => i !== existsIndex);
      } else {
        nextArr = [...currentArr, optVal];
      }

      if (onChange) {
        const syntheticEvent = {
          target: { name, value: nextArr },
          currentTarget: { name, value: nextArr },
          stopPropagation: () => {},
          preventDefault: () => {},
        };
        onChange(syntheticEvent, nextArr);
      }
      return;
    }

    if (onChange) {
      const syntheticEvent = {
        target: { name, value: optVal },
        currentTarget: { name, value: optVal },
        stopPropagation: () => {},
        preventDefault: () => {},
      };
      onChange(syntheticEvent, optVal);
    }
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    const allEnabledValues = displayedOptions.filter((o) => !o.disabled).map((o) => (o.value !== undefined ? o.value : o.id));
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: allEnabledValues },
        currentTarget: { name, value: allEnabledValues },
        stopPropagation: () => {},
        preventDefault: () => {},
      };
      onChange(syntheticEvent, allEnabledValues);
    }
  };

  const handleClearAll = (e) => {
    e?.stopPropagation();
    if (isMulti) {
      if (onChange) {
        onChange({ target: { name, value: [] } }, []);
      }
    } else {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { name, value: '' } }, '');
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        let next = prev + 1;
        while (next < displayedOptions.length && displayedOptions[next]?.disabled) {
          next++;
        }
        return next < displayedOptions.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && displayedOptions[next]?.disabled) {
          next--;
        }
        return next >= 0 ? next : 0;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < displayedOptions.length) {
        handleSelect(displayedOptions[focusedIndex]);
        if (!isMulti) {
          buttonRef.current?.focus();
        }
      }
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionsListRef.current) {
      const childrenNodes = optionsListRef.current.querySelectorAll('[role="option"]');
      const targetNode = childrenNodes[focusedIndex];
      if (targetNode && typeof targetNode.scrollIntoView === 'function') {
        targetNode.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Size styling presets
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-xs',
    lg: 'h-10 px-3.5 text-sm',
  };

  const hasSelectedValue = isMulti ? Array.isArray(value) && value.length > 0 : (value !== undefined && value !== null && value !== '');

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form submissions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={Array.isArray(value) ? JSON.stringify(value) : (value || '')}
        />
      )}

      {comboInput ? (
        <div
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={`w-full flex items-center justify-between transition-all duration-150 shadow-2xs bg-white border rounded-lg
            ${buttonClassName ? buttonClassName : sizeClasses[size] || sizeClasses.md}
            ${isOpen ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200 hover:border-zinc-300'}
            ${error ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/10' : ''}
            ${disabled ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed shadow-none' : 'cursor-pointer'}
          `}
          onClick={() => {
            if (!disabled && !isOpen) setIsOpen(true);
            searchInputRef.current?.focus();
          }}
        >
          {PrefixIcon && <span className="mr-2 text-zinc-400 shrink-0">{PrefixIcon}</span>}
          <input
            ref={searchInputRef}
            type="text"
            placeholder={hasSelectedValue ? displayLabel : placeholder}
            value={isOpen ? searchTerm : (hasSelectedValue ? displayLabel : '')}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearch) debouncedSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent border-none outline-none text-zinc-800 placeholder:text-zinc-400 truncate focus:ring-0 p-0 text-inherit font-medium"
            disabled={disabled}
            style={{ fontSize: 'inherit' }}
          />
          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {isClearable && hasSelectedValue && !disabled && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded"
                title="Clear selection"
              >
                <X size={12} />
              </button>
            )}
            <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      ) : (
        <button
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          className={`w-full flex items-center justify-between transition-all duration-150 shadow-2xs bg-white border rounded-lg select-none text-left
            ${buttonClassName ? buttonClassName : sizeClasses[size] || sizeClasses.md}
            ${isOpen ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200 hover:border-zinc-300'}
            ${error ? 'border-red-400 ring-red-500/10' : ''}
            ${disabled ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed shadow-none border-zinc-200' : 'cursor-pointer'}
          `}
          {...restProps}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
            {PrefixIcon && <span className="text-zinc-500 shrink-0">{PrefixIcon}</span>}
            <span className={`block truncate ${!hasSelectedValue ? 'text-zinc-400 font-normal' : 'text-zinc-900 font-medium'}`}>
              {displayLabel}
            </span>
            {isMulti && Array.isArray(value) && value.length > 1 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 shrink-0">
                {value.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {isClearable && hasSelectedValue && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearAll}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearAll(e); }}
                className="p-0.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100"
                title="Clear"
              >
                <X size={13} />
              </span>
            )}
            <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-zinc-700' : ''}`} />
          </div>
        </button>
      )}

      {/* Floating Dropdown via Portal */}
      {isOpen && !disabled && createPortal(
        <div
          data-custom-select-dropdown="true"
          style={{
            position: 'fixed',
            top: dropdownCoords.top !== 'auto' ? `${dropdownCoords.top}px` : 'auto',
            bottom: dropdownCoords.bottom !== 'auto' ? `${dropdownCoords.bottom}px` : 'auto',
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
            minWidth: Math.max(dropdownCoords.width, 180),
            zIndex: 99999,
          }}
          className={dropdownClassName || "bg-white border border-zinc-200/90 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"}
        >
          {/* In-Menu Search Input */}
          {isSearchable && !comboInput && (
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/70 sticky top-0 z-10 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  className="w-full h-8 pl-8 pr-7 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 placeholder:text-zinc-400 transition-all font-medium text-zinc-900"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); if (onSearchRef.current) onSearchRef.current(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Multi-Select Action Bar */}
          {isMulti && displayedOptions.length > 1 && (
            <div className="px-2.5 py-1.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[11px] font-semibold text-zinc-600">
              <button
                type="button"
                onClick={handleSelectAll}
                className="hover:text-zinc-900 hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-red-600"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Options Scrollable Container */}
          <div
            ref={optionsListRef}
            role="listbox"
            aria-multiselectable={isMulti}
            className="overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
            style={{ maxHeight: `${dropdownCoords.maxHeight || 260}px` }}
          >
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                <Loader2 size={18} className="animate-spin text-zinc-500" />
                <span>Loading options...</span>
              </div>
            ) : displayedOptions.length === 0 ? (
              <div className="px-3 py-6 text-xs text-zinc-500 text-center flex flex-col items-center justify-center gap-2">
                <span>{emptyMessage}</span>
                {emptyStateAction && (
                  <div>
                    {typeof emptyStateAction === 'function'
                      ? emptyStateAction({ closeDropdown: () => setIsOpen(false), searchTerm })
                      : emptyStateAction}
                  </div>
                )}
              </div>
            ) : (
              displayedOptions.map((opt, idx) => {
                const optVal = opt.value !== undefined ? opt.value : opt.id;
                const optLabel = opt.label || opt.name || String(optVal);
                const isSelected = isValueSelected(optVal);
                const isFocused = focusedIndex === idx;
                const isDisabled = Boolean(opt.disabled);

                return (
                  <button
                    key={`${optVal}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2
                      ${isDisabled
                        ? 'opacity-40 cursor-not-allowed text-zinc-400 bg-transparent'
                        : isSelected
                        ? 'bg-zinc-900/[0.06] text-zinc-900 font-semibold'
                        : isFocused
                        ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200'
                        : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900'}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                      {opt.icon && <span className="text-zinc-400 shrink-0">{opt.icon}</span>}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{optLabel}</span>
                        {opt.subLabel && (
                          <span className={`text-[10px] truncate font-mono mt-0.5 ${isSelected ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="text-zinc-900 font-bold shrink-0" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Custom Actions */}
          {bottomAction && !isLoading && (displayedOptions.length > 0 || !emptyStateAction) && (
            <div className="shrink-0 overflow-hidden rounded-b-xl border-t border-zinc-100 bg-zinc-50/50">
              {typeof bottomAction === 'function'
                ? bottomAction({ closeDropdown: () => setIsOpen(false), searchTerm })
                : bottomAction}
            </div>
          )}
        </div>,
        document.body
      )}

      {error && typeof error === 'string' && (
        <p className="text-red-600 text-xs mt-1 font-medium">{error}</p>
      )}
    </div>
  );
});

CustomSelect.displayName = 'CustomSelect';

export { CustomSelect, CustomSelect as WorkflowSelect };
export default CustomSelect;
