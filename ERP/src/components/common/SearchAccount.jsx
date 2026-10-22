import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  Loader2,
  ArrowRight,
  Building2,
  LayoutDashboard,
  Plus,
  Briefcase,
  Layers,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chartOfAccountsApi } from '../../api/account/chartOfAccounts';
import { useGetOrganizationsQuery } from '../../api/sso';
import { useRoutePath } from '../../hooks/useRoutePath';
import useDebounce from '../../hooks/useDebounce';

/**
 * Enterprise Search Account / Platform Console Search component.
 * In Standard ERP: Searches chart of accounts with instant suggestions & ledger navigation.
 * In Super Admin: Searches platform console destinations and tenant organizations.
 */
export default function SearchAccount({
  placeholder,
  onSelect,
  className = "",
  autoNavigate = true
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();

  const isSuperAdmin = location.pathname.startsWith('/super-admin');

  const defaultPlaceholder = isSuperAdmin
    ? "Search platform, organizations, consoles... (⌘K)"
    : "Search account (e.g. 1001, Cash, Bank)...";

  const effectivePlaceholder = placeholder || defaultPlaceholder;

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountResults, setAccountResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Super Admin console navigation destinations
  const superAdminDestinations = useMemo(() => [
    {
      id: 'dest-dash',
      type: 'nav',
      title: 'Super Admin Dashboard',
      subtitle: 'Platform overview, tenant metrics & system health',
      category: 'Console Navigation',
      icon: LayoutDashboard,
      path: '/super-admin/dashboard',
    },
    {
      id: 'dest-orgs',
      type: 'nav',
      title: 'Organizations & Tenants',
      subtitle: 'Manage all provisioned enterprise tenants',
      category: 'Console Navigation',
      icon: Building2,
      path: '/super-admin/organizations',
    },
    {
      id: 'dest-prov',
      type: 'nav',
      title: 'Provision New Organization',
      subtitle: 'Create tenant container, admin user & workspace',
      category: 'Platform Action',
      icon: Plus,
      path: '/super-admin/organizations/provision',
    },
    {
      id: 'dest-comps',
      type: 'nav',
      title: 'Workspaces & Companies',
      subtitle: 'Cross-tenant company catalog & provisioning',
      category: 'Console Navigation',
      icon: Briefcase,
      path: '/super-admin/companies',
    },
    {
      id: 'dest-mods',
      type: 'nav',
      title: 'Global Modules Registry',
      subtitle: 'SSO, Account, Inventory, Workflow & CRM config',
      category: 'Console Navigation',
      icon: Layers,
      path: '/super-admin/modules',
    },
    {
      id: 'dest-roles',
      type: 'nav',
      title: 'Roles & Access Control',
      subtitle: 'Cross-tenant policy definitions & permission scopes',
      category: 'Console Navigation',
      icon: ShieldCheck,
      path: '/super-admin/roles',
    },
    {
      id: 'dest-audit',
      type: 'nav',
      title: 'Platform Audit Logs',
      subtitle: 'Security, authentication and administrative audit trail',
      category: 'Console Navigation',
      icon: ScrollText,
      path: '/super-admin/audit-logs',
    },
  ], []);

  // Super Admin live organizations query
  const {
    data: orgsData,
    isLoading: isOrgsLoading,
  } = useGetOrganizationsQuery(
    { page: 0, size: 20, search: debouncedSearch.trim() },
    { skip: !isSuperAdmin || !debouncedSearch.trim() }
  );

  const matchingOrgs = useMemo(() => {
    if (!isSuperAdmin) return [];
    const orgs = orgsData?.organizations || [];
    return orgs.map((o) => ({
      id: `org-${o.id}`,
      orgId: o.id,
      type: 'organization',
      title: o.name || 'Organization',
      subtitle: `Code: ${o.code || '—'} • ${o.status || 'ACTIVE'}`,
      category: 'Tenant Organization',
      icon: Building2,
      path: `/super-admin/organizations/${o.id}`,
    }));
  }, [isSuperAdmin, orgsData]);

  const matchingDestinations = useMemo(() => {
    if (!isSuperAdmin) return [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) {
      // When opened with empty text, show top primary destinations
      return superAdminDestinations.slice(0, 4);
    }
    return superAdminDestinations.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [isSuperAdmin, debouncedSearch, superAdminDestinations]);

  // Combined results
  const results = useMemo(() => {
    if (isSuperAdmin) {
      return [...matchingOrgs, ...matchingDestinations];
    }
    return accountResults;
  }, [isSuperAdmin, matchingOrgs, matchingDestinations, accountResults]);

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

  // Fetch accounts on debounced search (Standard ERP mode)
  useEffect(() => {
    if (isSuperAdmin) return;

    let isMounted = true;
    const fetchAccounts = async () => {
      if (!debouncedSearch || debouncedSearch.trim().length === 0) {
        setAccountResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await chartOfAccountsApi.getList({
          searchKey: debouncedSearch.trim(),
          size: 20,
        });

        const raw =
          res?.data?.data || res?.data?.content || res?.content || res?.data || res || [];
        const list = Array.isArray(raw)
          ? raw
          : raw?.content && Array.isArray(raw.content)
          ? raw.content
          : [];

        if (isMounted) {
          setAccountResults(list.filter((acc) => acc.isActive !== false));
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Error searching accounts:", err);
        if (isMounted) setAccountResults([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAccounts();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, isSuperAdmin]);

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

  const handleSelect = useCallback(
    (item) => {
      setIsOpen(false);
      setSearchTerm('');

      if (isSuperAdmin) {
        if (item?.path) {
          navigate(buildPath(item.path));
        }
        return;
      }

      if (onSelect) {
        onSelect(item);
      }
      if (autoNavigate && item?.id) {
        navigate(buildPath(`/accounts/reports/ledger?accountId=${item.id}`));
      }
    },
    [isSuperAdmin, onSelect, autoNavigate, navigate, buildPath]
  );

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
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

  const isCurrentLoading = isSuperAdmin ? isOrgsLoading : loading;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-zinc-400 dark:text-[#6B7184]">
          {isCurrentLoading ? (
            <Loader2 size={15} className="animate-spin text-zinc-500 dark:text-[#A0A6B5]" />
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
          placeholder={effectivePlaceholder}
          className="w-full h-9 pl-9 pr-14 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white dark:bg-[#1D212C] dark:hover:bg-[#1D212C] dark:focus:bg-[#1D212C] border border-zinc-200 focus:border-zinc-300 dark:border-[#2A2F3D] dark:focus:border-[#4C8DFF] rounded-xl text-[11px] font-medium text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-[#4C8DFF]/20 transition-all shadow-2xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-auto">
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAccountResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 dark:text-[#A0A6B5] bg-zinc-200/60 dark:bg-[#161922] rounded border border-zinc-300/40 dark:border-[#2A2F3D]">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (searchTerm.trim().length > 0 || (isSuperAdmin && results.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-lg dark:shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 bg-zinc-50/70 dark:bg-[#1D212C] border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between text-[10px] text-zinc-400 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider">
            <span>
              {isSuperAdmin
                ? `Platform Results (${results.length})`
                : `Matching Accounts (${results.length})`}
            </span>
            <span>Press ↵ to open</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50 dark:divide-[#2A2F3D] p-1">
            {isCurrentLoading && results.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 dark:text-[#6B7184] flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-zinc-500 dark:text-[#A0A6B5]" />
                <span>Searching {isSuperAdmin ? 'platform...' : 'accounts...'}</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 dark:text-[#6B7184]">
                No matching results found for "{searchTerm}"
              </div>
            ) : (
              results.map((item, index) => {
                const isSelected = index === selectedIndex;

                if (isSuperAdmin) {
                  const ItemIcon = item.icon || Building2;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-zinc-100/80 dark:bg-[#222736] text-zinc-900 dark:text-[#E6E8EE]' : 'hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-center text-zinc-600 dark:text-[#4C8DFF] shrink-0">
                          <ItemIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] truncate">
                              {item.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-semibold bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D] uppercase shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2 text-zinc-400 dark:text-[#6B7184] text-xs font-medium">
                        <span className="text-[10px] hidden sm:inline text-zinc-400 dark:text-[#6B7184]">Open</span>
                        <ArrowRight size={13} className="text-zinc-500 dark:text-[#A0A6B5]" />
                      </div>
                    </button>
                  );
                }

                // Standard ERP Chart of Accounts Result
                const acc = item;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelect(acc)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-zinc-100/80 dark:bg-[#222736] text-zinc-900 dark:text-[#E6E8EE]' : 'hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-center text-zinc-600 dark:text-[#4C8DFF] shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                            {acc.accountCode || '—'}
                          </span>
                          <span className="text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] truncate">
                            {acc.accountName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400 dark:text-[#6B7184] font-medium">
                            {acc.groupName || acc.groupCode || 'Account Group'}
                          </span>
                          {acc.accountType && (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-semibold bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D] uppercase">
                              {acc.accountType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2 text-zinc-400 dark:text-[#6B7184] text-xs font-medium">
                      <span className="text-[10px] hidden sm:inline text-zinc-400 dark:text-[#6B7184]">View Ledger</span>
                      <ArrowRight size={13} className="text-zinc-500 dark:text-[#A0A6B5]" />
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
