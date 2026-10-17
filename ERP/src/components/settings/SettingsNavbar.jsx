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
  defaultGroup = 'all', // 'all' | 'general' | 'module'
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
    if (defaultGroup !== 'all') return defaultGroup;
    return computedActiveGroup || 'general';
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
      className={`w-full bg-white border border-zinc-200/80 rounded-2xl shadow-xs transition-all overflow-hidden ${className}`}
    >
      {/* ── Top Bar: Group Switcher & Module Count ── */}
      {showGroupSwitcher && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedGroup('general')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'general'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <Sliders size={13} className={selectedGroup === 'general' ? 'text-zinc-900' : 'text-zinc-500'} />
              <span>General Settings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedGroup === 'general' ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-200 text-zinc-600'
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
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <Layers size={13} className={selectedGroup === 'module' ? 'text-zinc-900' : 'text-zinc-500'} />
              <span>Module Settings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedGroup === 'module' ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-200 text-zinc-600'
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
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <span>All</span>
            </button>
          </div>

          {/* Active section summary indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium">Active:</span>
            <span className="font-semibold text-zinc-900 bg-white px-2.5 py-0.5 rounded-md border border-zinc-200 shadow-2xs">
              {activeItem?.label || 'General Settings'}
            </span>
          </div>
        </div>
      )}

      {/* ── Sub Navigation Tabs with Horizontal Scroll ── */}
      <div className="relative flex items-center px-2 py-2">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll settings tabs left"
            className="absolute left-2 z-10 p-1.5 rounded-lg bg-white/95 border border-zinc-200 shadow-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          tabIndex={0}
          role="tablist"
          aria-orientation="horizontal"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 w-full"
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 shrink-0 ${
                  isItemActive
                    ? 'bg-zinc-900 text-white shadow-xs border border-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 border border-transparent'
                }`}
              >
                {Icon && (
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isItemActive ? 'text-white' : 'text-zinc-500'
                    }`}
                  />
                )}
                <span>{item.label}</span>
                {item.category === 'module' && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                      isItemActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
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
            className="absolute right-2 z-10 p-1.5 rounded-lg bg-white/95 border border-zinc-200 shadow-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </nav>
  );
}

export default SettingsNavbar;

