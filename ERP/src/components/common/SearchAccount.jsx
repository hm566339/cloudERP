import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chartOfAccountsApi } from '../../api/account/chartOfAccounts';
import { useRoutePath } from '../../hooks/useRoutePath';
import useDebounce from '../../hooks/useDebounce';

/**
 * Enterprise Search Account component.
 * Allows searching accounts by code or name with instant suggestions.
 * On selection, automatically navigates to General Ledger for the selected account.
 */
export default function SearchAccount({
  placeholder = "Search account (e.g. 1001, Cash, Bank)...",
  onSelect,
  className = "",
  autoNavigate = true
}) {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Global Ctrl+K / Cmd+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch accounts on debounced search
  useEffect(() => {
    let isMounted = true;
    const fetchAccounts = async () => {
      if (!debouncedSearch || debouncedSearch.trim().length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await chartOfAccountsApi.getList({
          searchKey: debouncedSearch.trim(),
          size: 20
        });

        const raw = res?.data?.data || res?.data?.content || res?.content || res?.data || res || [];
        const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);

        if (isMounted) {
          setResults(list.filter(acc => acc.isActive !== false));
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Error searching accounts:", err);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAccounts();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((account) => {
    setIsOpen(false);
    setSearchTerm('');
    if (onSelect) {
      onSelect(account);
    }
    if (autoNavigate && account?.id) {
      navigate(buildPath(`/accounts/reports/ledger?accountId=${account.id}`));
    }
  }, [onSelect, autoNavigate, navigate, buildPath]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-zinc-400">
          {loading ? (
            <Loader2 size={15} className="animate-spin text-zinc-500" />
          ) : (
            <Search size={15} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-14 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white border border-zinc-200 focus:border-zinc-300 rounded-xl text-[11px] font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all shadow-2xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-auto">
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300/40">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Matching Accounts ({results.length})</span>
            <span>Press ↵ to view ledger</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50 p-1">
            {loading && results.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-zinc-500" />
                <span>Searching accounts...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No accounts found matching "{searchTerm}"
              </div>
            ) : (
              results.map((acc, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelect(acc)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-zinc-100/80 text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900">
                            {acc.accountCode || '—'}
                          </span>
                          <span className="text-xs font-medium text-zinc-800 truncate">
                            {acc.accountName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {acc.groupName || acc.groupCode || 'Account Group'}
                          </span>
                          {acc.accountType && (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                              {acc.accountType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2 text-zinc-400 text-xs font-medium">
                      <span className="text-[10px] hidden sm:inline text-zinc-400">View Ledger</span>
                      <ArrowRight size={13} className="text-zinc-500" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
