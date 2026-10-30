import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sliders, Layers } from 'lucide-react';
import { useAppSelector } from '../../app/hooks';
import { selectAuthContext, selectCurrentUser } from '../../features/auth/authSlice';
import { selectSelectedCompany } from '../../features/company-management/companySlice';
import { useGetModulesQuery } from '../../api/sso/module';
import { getAllFeatures } from '../../api/sso/feature';
import { resolveSettingsNavigation } from './settingsNavigation';

/**
 * Reusable SettingsNavbar component with dual logical groups:
 * 1. General Settings
 * 2. Module Settings (Accounting, Inventory, Workflow, CRM, SSO)
 */
export function SettingsNavbar({
  activeTab: controlledActiveTab,
  onTabChange,
  className = '',
  showGroupSwitcher = true,
  defaultGroup = 'general', // Default to 'general' so the 8 General Settings tabs are immediately visible and open
  align = 'right', // Align navigation tabs toward the right side
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const authContext = useAppSelector(selectAuthContext);
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  const companyId =
    params?.companyId ||
    selectedCompany?.id ||
    currentUser?.companyId ||
    currentUser?.companyCode ||
    null;

  const rawRole = currentUser?.role || 'employee';
  const userRole = String(
    Array.isArray(rawRole) ? (rawRole[0]?.name || rawRole[0]) : (rawRole?.name || rawRole)
  ).toLowerCase();

  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    userRole === 'owner' ||
    Boolean(authContext?.isOwner);

  // Fetch modules from API (or fallback to authContext.modules)
  const { data: modulesData } = useGetModulesQuery({}, { skip: false });
  const rawModulesList = Array.isArray(modulesData?.modules)
    ? modulesData.modules
    : (Array.isArray(modulesData) ? modulesData : (authContext?.modules || []));

  // Fetch features from API
  const [featuresList, setFeaturesList] = useState([]);
  useEffect(() => {
    let isMounted = true;
    getAllFeatures()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setFeaturesList(data);
        }
      })
      .catch(() => {
        // Fallback gracefully to default features catalog if API unavailable
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve navigation items
  const navResolution = useMemo(() => {
    return resolveSettingsNavigation({
      modules: rawModulesList,
      features: featuresList,
      permissions: authContext?.permissions || currentUser?.permissions || [],
      userRole,
      memberType: authContext?.membership?.memberType,
      isOwner,
      companyId,
      currentPath: location.pathname,
    });
  }, [rawModulesList, featuresList, authContext, currentUser, userRole, isOwner, companyId, location.pathname]);

  const { generalItems, moduleItems, activeItem, activeGroup: computedActiveGroup } = navResolution;

  // Selected Group State ('all', 'general', or 'module')
  const [selectedGroup, setSelectedGroup] = useState(() => {
    if (computedActiveGroup) return computedActiveGroup;
    if (defaultGroup && defaultGroup !== 'all') return defaultGroup;
    return 'general';
  });

  // Sync group with active route when user navigates
  useEffect(() => {
    if (computedActiveGroup && selectedGroup !== 'all') {
      setSelectedGroup(computedActiveGroup);
    }
  }, [computedActiveGroup]);

  // Horizontal scroll controls
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [generalItems, moduleItems, selectedGroup]);

  // Scroll active tab into view on load and tab change without requiring extra arrow clicks
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[aria-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
      checkScroll();
    }
  }, [controlledActiveTab, activeItem?.id, selectedGroup]);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -220 : 220;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  // Keyboard navigation
  const handleKeyDown = (e, targetPath, index, currentList) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % currentList.length;
      navigate(currentList[nextIndex].fullPath);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + currentList.length) % currentList.length;
      navigate(currentList[prevIndex].fullPath);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onTabChange) {
        onTabChange(targetPath);
      } else {
        navigate(targetPath);
      }
    }
  };

  // Filter items based on selected group
  const displayedItems = useMemo(() => {
    if (selectedGroup === 'general') return generalItems;
    if (selectedGroup === 'module') return moduleItems;
    return [...generalItems, ...moduleItems];
  }, [selectedGroup, generalItems, moduleItems]);

  return (
    <nav
      aria-label="Settings Navigation"
      className={`w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs transition-all overflow-hidden ${className}`}
    >
      {/* ── Top Bar: Group Switcher & Active Section Summary ── */}
      {showGroupSwitcher && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setSelectedGroup('general')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'general'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar-hover-bg)]/50'
              }`}
            >
              <Sliders size={13} className={selectedGroup === 'general' ? 'text-white' : 'text-[var(--color-text-secondary)]'} />
              <span>General Settings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedGroup === 'general' ? 'bg-[var(--color-primary-hover)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                }`}
              >
                {generalItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGroup('module')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'module'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar-hover-bg)]/50'
              }`}
            >
              <Layers size={13} className={selectedGroup === 'module' ? 'text-white' : 'text-[var(--color-text-secondary)]'} />
              <span>Module Settings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedGroup === 'module' ? 'bg-[var(--color-primary-hover)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                }`}
              >
                {moduleItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGroup('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'all'
                  ? 'bg-[#2E3D28] text-white dark:bg-[#1D212C] dark:text-[#4C8DFF] shadow-2xs font-semibold'
                  : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] hover:bg-[#DCE2CF]/50 dark:hover:bg-[#222736]'
              }`}
            >
              <span>All</span>
            </button>
          </div>

          {/* Active section summary indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#A0A6B5]">
            <span className="font-medium">Active:</span>
            <span className="font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-2)] px-2.5 py-0.5 rounded-md border border-[var(--color-border)] shadow-2xs">
              {activeItem?.label || 'General Settings'}
            </span>
          </div>
        </div>
      )}

      {/* ── Sub Navigation Tabs Aligned Toward Right Side with Horizontal Scroll ── */}
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} px-2 py-2 gap-1.5 w-full`}>
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll settings tabs left"
            className="shrink-0 p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
        )}

        {/* Scrollable Tabs Container - Aligned toward the right */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          tabIndex={0}
          role="tablist"
          aria-orientation="horizontal"
          className={`flex-1 flex items-center ${align === 'right' ? 'justify-start sm:justify-end' : 'justify-start'} gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 min-w-0`}
        >
          {displayedItems.map((item, index) => {
            const Icon = item.icon;
            const isItemActive =
              controlledActiveTab === item.id ||
              item.isActive ||
              activeItem?.id === item.id;

            return (
              <Link
                key={item.id}
                to={item.fullPath}
                role="tab"
                tabIndex={0}
                aria-selected={isItemActive}
                aria-current={isItemActive ? 'page' : undefined}
                title={item.description}
                onKeyDown={(e) => handleKeyDown(e, item.fullPath, index, displayedItems)}
                onClick={() => onTabChange && onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] shrink-0 ${
                  isItemActive
                    ? 'bg-[var(--color-primary)] text-white shadow-xs border border-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar-hover-bg)]/60 border border-transparent'
                }`}
              >
                {Icon && (
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isItemActive ? 'text-white' : 'text-[var(--color-text-secondary)]'
                    }`}
                  />
                )}
                <span>{item.label}</span>
                {item.category === 'module' && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                      isItemActive ? 'bg-[var(--color-primary-hover)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    Module
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll settings tabs right"
            className="shrink-0 p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </nav>
  );
}

export default SettingsNavbar;
