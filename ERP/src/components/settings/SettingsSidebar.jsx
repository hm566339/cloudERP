import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, 
  Search, 
  ChevronRight, 
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { SETTINGS_MENU_ITEMS } from './settingsConfig';

export function SettingsSidebar({
  isOpen = false,
  onClose,
  activeSetting: controlledActiveSetting,
  onSettingSelect,
  items = SETTINGS_MENU_ITEMS,
  title = 'Settings',
  className = '',
  navigateOnSelect = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Find active setting based on route, falling back to 'general'
  const activeFromRoute = items.find(item => location.pathname.includes(item.route))?.id;
  const [internalActiveSetting, setInternalActiveSetting] = useState(
    controlledActiveSetting || activeFromRoute || (items[0]?.id ?? 'general')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync internal active setting if controlled prop or route changes
  useEffect(() => {
    if (controlledActiveSetting !== undefined) {
      setInternalActiveSetting(controlledActiveSetting);
    } else {
      const activeFromRoute = items.find(item => location.pathname.includes(item.route))?.id;
      if (activeFromRoute) setInternalActiveSetting(activeFromRoute);
    }
  }, [controlledActiveSetting, location.pathname, items]);

  // Handle Escape key and focus on open
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus search input smoothly when drawer opens
    const focusTimer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  // Filter settings by search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Handle clicking a setting item
  const handleItemClick = (item) => {
    setInternalActiveSetting(item.id);
    if (onSettingSelect) {
      onSettingSelect(item.id);
    }
    if (navigateOnSelect && item.route) {
      // If we are in a company context, append the route to it, else use absolute route
      const isCompanyRoute = location.pathname.startsWith('/company/');
      const companyId = location.pathname.split('/')[2];
      
      if (isCompanyRoute && companyId) {
        navigate(`/company/${companyId}${item.route}`);
      } else {
        navigate(item.route);
      }
      
      if (onClose) {
        onClose();
      }
    }
  };

  const currentActive = controlledActiveSetting !== undefined ? controlledActiveSetting : internalActiveSetting;

  return (
    <>
      {/* ── Overlay Backdrop ── */}
      <div
        className={`fixed inset-0 z-50 bg-zinc-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* ── Right-Side Slide-in Drawer ── */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[var(--color-surface)] rounded-l-2xl sm:rounded-l-3xl shadow-[-12px_0_35px_-8px_rgba(0,0,0,0.12)] border-l border-[var(--color-border)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-[320px] max-w-[calc(100vw-24px)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        } ${className}`}
      >
        {/* ── Drawer Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-2xs">
              <SettingsIcon size={16} className="transition-transform duration-500 hover:rotate-45 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight leading-none">
                {title}
              </h2>
              <p className="text-[10.5px] font-medium text-[var(--color-text-secondary)] mt-0.5 leading-tight">
                System preferences & controls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all shadow-2xs border border-transparent hover:border-[var(--color-border)]"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Search Input ── */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60 shrink-0">
          <div className="relative flex items-center">
            <Search
              size={15}
              className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              aria-label="Search settings"
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-800 border border-[var(--color-border)] rounded-xl text-xs font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-all shadow-2xs focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 dark:focus:ring-zinc-400/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Clear search query"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Settings Menu Items List ── */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
                <Search size={18} />
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No settings found</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-[200px] mx-auto">
                No configurations matched &ldquo;{searchQuery}&rdquo;. Try another term.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isActive = currentActive === item.id;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full group text-left flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 border ${
                    isActive
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border-transparent hover:border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-none'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    {/* Item Icon */}
                    <div
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-150 ${
                        isActive
                          ? 'bg-[var(--color-primary-hover)] text-white border border-[var(--color-primary-active)] shadow-xs'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] group-hover:bg-[var(--color-sidebar-hover-bg)]'
                      }`}
                    >
                      {IconComponent && (
                        <IconComponent size={17} strokeWidth={isActive ? 2.2 : 2} />
                      )}
                    </div>

                    {/* Text Container */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs tracking-tight truncate ${
                            isActive
                              ? 'text-white font-bold'
                              : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-text-primary)] font-semibold'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 dark:bg-zinc-200 dark:text-zinc-800 dark:border-zinc-300'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] leading-tight truncate mt-0.5 ${
                          isActive
                            ? 'text-white/85 font-normal'
                            : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Chevron */}
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform duration-150 ${
                      isActive
                        ? 'text-white/80 dark:text-zinc-600 translate-x-0.5'
                        : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* ── Drawer Footer ── */}
        <div className="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/60 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <Sparkles size={13} className="text-zinc-400 dark:text-zinc-500" />
              <span>ERP System Admin v2.4</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
              Operational
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default SettingsSidebar;
