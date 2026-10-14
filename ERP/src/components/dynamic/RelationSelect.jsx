import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Search, Loader2, ChevronDown, X } from 'lucide-react';
import api from '../../services/api';
import { getResourceConfig } from '../../metadata/resourceRegistry';

// Simple in-memory LRU cache for relation options
const relationCache = new Map();

/**
 * Universal RelationSelect component
 * Dynamically queries options from backend list endpoints using metadata registry.
 */
export default function RelationSelect({
  resource,
  value,
  onChange,
  valueKey = 'id',
  labelKey,
  codeKey,
  placeholder = 'Select option...',
  filters = {},
  disabled = false,
  required = false,
  className = '',
  id,
  name,
}) {
  const config = useMemo(() => getResourceConfig(resource), [resource]);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapperRef = useRef(null);

  // Derive label and code keys from config if not explicitly passed
  const effectiveLabelKey = labelKey || config?.nameField || 'name';
  const effectiveCodeKey = codeKey || config?.codeField || 'code';
  const listPath = config?.listPath || (resource.startsWith('/') ? resource : `/api/${resource}`);
  const searchParam = config?.listCapabilities?.searchParam || 'search';
  const maxPageSize = config?.listCapabilities?.maxPageSize || 50;

  // Resolve initial selected item label
  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }

    // Check if in current options
    const match = options.find((opt) => String(opt[valueKey]) === String(value));
    if (match) {
      const code = match[effectiveCodeKey] ? `[${match[effectiveCodeKey]}] ` : '';
      setSelectedLabel(`${code}${match[effectiveLabelKey] || match.name || value}`);
      return;
    }

    // Otherwise fetch detail by id if detailPath exists
    if (config?.detailPath) {
      const detailUrl = config.detailPath.replace(':id', value);
      api
        .get(detailUrl)
        .then((res) => {
          const item = res.data?.data || res.data;
          if (item) {
            const code = item[effectiveCodeKey] ? `[${item[effectiveCodeKey]}] ` : '';
            setSelectedLabel(`${code}${item[effectiveLabelKey] || item.name || value}`);
          }
        })
        .catch(() => {
          setSelectedLabel(String(value));
        });
    } else {
      setSelectedLabel(String(value));
    }
  }, [value, options, valueKey, effectiveLabelKey, effectiveCodeKey, config]);

  // Fetch options with debounce and caching
  const fetchOptions = useCallback(
    async (searchQuery = '') => {
      const cacheKey = `${listPath}?search=${searchQuery}&filters=${JSON.stringify(filters)}`;
      if (relationCache.has(cacheKey)) {
        setOptions(relationCache.get(cacheKey));
        return;
      }

      setLoading(true);
      try {
        const params = {
          size: maxPageSize,
          pageSize: maxPageSize,
          page: config?.listCapabilities?.defaultPageBase || 0,
          ...filters,
        };
        if (searchQuery.trim()) {
          params[searchParam] = searchQuery.trim();
        }

        const res = await api.get(listPath, { params });
        const data = res.data?.data || res.data;
        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data?.content && Array.isArray(data.content)) {
          items = data.content;
        } else if (data?.items && Array.isArray(data.items)) {
          items = data.items;
        }

        relationCache.set(cacheKey, items);
        setOptions(items);
      } catch (err) {
        console.error(`Failed to fetch relation options for ${resource}:`, err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [listPath, maxPageSize, config, filters, searchParam, resource]
  );

  // Trigger fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchOptions(searchTerm);
    }
  }, [isOpen, fetchOptions]);

  // Debounced search inside opened dropdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchOptions(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, fetchOptions]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const val = item[valueKey];
    const code = item[effectiveCodeKey] ? `[${item[effectiveCodeKey]}] ` : '';
    setSelectedLabel(`${code}${item[effectiveLabelKey] || item.name || val}`);
    if (onChange) {
      onChange(val, item);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedLabel('');
    if (onChange) {
      onChange(null, null);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Hidden input for standard form compliance */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ''}
        required={required}
      />

      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border cursor-pointer transition-all ${
          disabled
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
      >
        <span className={`truncate ${selectedLabel ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400'}`}>
          {selectedLabel || placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden max-h-60 flex flex-col">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />}
          </div>

          {/* Options list */}
          <div role="listbox" className="overflow-y-auto flex-1 p-1">
            {loading && options.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading options...
              </div>
            ) : options.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">No results found</div>
            ) : (
              options.map((opt) => {
                const optVal = opt[valueKey];
                const isSelected = String(optVal) === String(value);
                const code = opt[effectiveCodeKey] ? `[${opt[effectiveCodeKey]}] ` : '';
                const label = opt[effectiveLabelKey] || opt.name || optVal;

                return (
                  <div
                    key={String(optVal)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="truncate">
                      {code && <span className="font-mono text-zinc-400 mr-1">{code}</span>}
                      {label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

RelationSelect.propTypes = {
  resource: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  codeKey: PropTypes.string,
  placeholder: PropTypes.string,
  filters: PropTypes.object,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};
