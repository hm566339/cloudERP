import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import MarkLogo from '../components/common/MarkLogo';
import Tooltip from '../components/common/Tooltip';
import { getOwnerSidebarNavGroups } from './ownerSidebarConfig';

/**
 * Enterprise Owner Sidebar Navigation Component matching Company Dashboard visual system.
 * Supports:
 * - Desktop expanded state (260px)
 * - Desktop collapsed state (72px) with tooltips
 * - Mobile / tablet off-canvas drawer
 * - Section groupings: Dashboard, My Company, Modules, Settings
 * - Active / Locked / Entitled states
 */
export default function OwnerSidebar({
  organization,
  membership,
  user,
  entitledModules = [],
  activeCompanyId = null,
  companies = [],
  isTrial = false,
  daysRemaining = null,
  isActive = false,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();

  const navGroups = useMemo(() => {
    return getOwnerSidebarNavGroups({
      entitledModules,
      activeCompanyId,
      companiesCount: companies.length,
      isTrial,
      daysRemaining,
      isActive,
    });
  }, [entitledModules, activeCompanyId, companies.length, isTrial, daysRemaining, isActive]);

  const isItemActive = (itemPath) => {
    if (!itemPath) return false;
    if (itemPath === '/owner/dashboard') {
      return location.pathname === '/owner/dashboard' || location.pathname === '/owner';
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  /**
   * Header block of the sidebar
   */
  const renderHeader = (collapsedMode = false) => {
    if (collapsedMode) {
      return (
        <div className="h-[56px] sm:h-16 flex items-center justify-center border-b border-zinc-200/80 px-2 shrink-0">
          <Tooltip content={`${orgName} (${orgCode || 'OWNER'})`}>
            <button
              type="button"
              onClick={() => navigate('/owner/dashboard')}
              className="flex items-center justify-center p-1.5 rounded-xl hover:bg-zinc-100 transition-colors focus:outline-hidden"
              aria-label="Go to Owner Dashboard"
            >
              <MarkLogo className="h-7 w-7 object-contain cursor-pointer" />
            </button>
          </Tooltip>
        </div>
      );
    }

    return (
      <div className="h-[56px] sm:h-16 flex items-center justify-between border-b border-zinc-200/80 px-4 shrink-0">
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          onClick={() => navigate('/owner/dashboard')}
        >
          <div className="w-24 h-9 flex items-center justify-start transform transition-transform group-hover:scale-102">
            <MarkLogo variant="light" className="w-full h-full object-contain object-left" />
          </div>
          <span className="text-[9px] font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200/60 uppercase tracking-wider shrink-0">
            Owner
          </span>
        </div>

        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  };

  /**
   * Navigation links block
   */
  const renderNav = (collapsedMode = false) => {
    return (
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navGroups.map((group) => {
          return (
            <div key={group.id} className="space-y-1">
              {group.title && (
                collapsedMode ? (
                  <div className="h-px bg-zinc-200/70 my-2 mx-1" aria-hidden="true" />
                ) : (
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase select-none">
                    {group.title}
                  </div>
                )
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);
                  const isLocked = !item.isEntitled;

                  // ── If module is LOCKED / NOT PROVISIONED ──
                  if (isLocked) {
                    const lockedTooltipText = `${item.label} (Not Provisioned • Click to upgrade)`;

                    const lockedContent = (
                      <NavLink
                        to="/subscription"
                        onClick={mobileOpen ? onMobileClose : undefined}
                        className={`group flex items-center rounded-xl text-xs font-medium transition-all duration-150 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 ${
                          collapsedMode
                            ? 'justify-center p-2.5'
                            : 'px-3 py-2 justify-between gap-2.5'
                        }`}
                        title={collapsedMode ? undefined : lockedTooltipText}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={17} className="shrink-0 opacity-50 group-hover:opacity-75 transition-opacity" />
                          {!collapsedMode && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!collapsedMode && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-400 bg-zinc-100/90 px-1.5 py-0.5 rounded border border-zinc-200/60 shrink-0">
                            <Lock size={10} className="text-zinc-400" />
                            <span>Locked</span>
                          </span>
                        )}
                      </NavLink>
                    );

                    if (collapsedMode) {
                      return (
                        <div key={item.id} className="flex justify-center">
                          <Tooltip content={lockedTooltipText}>
                            {lockedContent}
                          </Tooltip>
                        </div>
                      );
                    }

                    return <div key={item.id}>{lockedContent}</div>;
                  }

                  // ── Standard ACTIVE / ENTITLED Link ──
                  const itemTooltipText = item.label;

                  const linkContent = (
                    <NavLink
                      to={item.path}
                      onClick={mobileOpen ? onMobileClose : undefined}
                      className={`flex items-center rounded-xl text-xs transition-all duration-150 ${
                        collapsedMode
                          ? 'justify-center p-2.5'
                          : 'px-3 py-2 justify-between gap-2.5'
                      } ${
                        active
                          ? 'bg-zinc-900 text-white font-bold shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={17}
                          className={`shrink-0 transition-colors ${
                            active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-800'
                          }`}
                        />
                        {!collapsedMode && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!collapsedMode && item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.badgeColor || 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );

                  if (collapsedMode) {
                    return (
                      <div key={item.id} className="flex justify-center">
                        <Tooltip content={itemTooltipText}>
                          {linkContent}
                        </Tooltip>
                      </div>
                    );
                  }

                  return <div key={item.id}>{linkContent}</div>;
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  /**
   * Footer block of the sidebar with collapse button
   */
  const renderFooter = (collapsedMode = false) => {
    return (
      <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/50 shrink-0">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsedMode ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-white border border-zinc-200/80 shadow-2xs transition-all duration-200 ${
              collapsedMode ? 'justify-center p-2.5' : 'px-3 py-2 justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {collapsedMode ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!collapsedMode && <span>Collapse Sidebar</span>}
            </div>
            {!collapsedMode && (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded">
                ⌘B
              </span>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR (Fixed left) ── */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-zinc-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)] fixed top-0 bottom-0 left-0 z-30 transition-[width] duration-300 ease-in-out will-change-[width] ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
        style={{ height: '100vh' }}
      >
        {renderHeader(isCollapsed)}
        {renderNav(isCollapsed)}
        {renderFooter(isCollapsed)}
      </aside>

      {/* ── MOBILE / TABLET OFF-CANVAS DRAWER ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Off-canvas sidebar */}
          <aside className="relative flex flex-col w-[260px] bg-white h-full shadow-2xl border-r border-zinc-200 z-50 animate-slide-in-right">
            {renderHeader(false)}
            {renderNav(false)}
            <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/50 shrink-0">
              <button
                type="button"
                onClick={onMobileClose}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 shadow-2xs hover:bg-zinc-50 transition-colors"
              >
                <X size={15} />
                <span>Close Menu</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
