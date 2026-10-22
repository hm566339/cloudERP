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
  modules = [],
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
      modules,
      activeCompanyId,
      companiesCount: companies.length,
      isTrial,
      daysRemaining,
      isActive,
    });
  }, [entitledModules, modules, activeCompanyId, companies.length, isTrial, daysRemaining, isActive]);

  const isItemActive = (item) => {
    if (!item) return false;
    const itemPath = typeof item === 'string' ? item : item.path;
    if (!itemPath) return false;

    const currentPath = location.pathname;
    // Strip company prefix: e.g. /company/ea811382.../accounts/dashboard -> /accounts/dashboard
    const strippedPath = currentPath.replace(/^\/company\/[^/]+/, '');

    // 1. Dashboard
    if (item.id === 'dashboard' || itemPath === '/owner/dashboard') {
      return (
        currentPath === '/owner/dashboard' ||
        currentPath === '/owner' ||
        currentPath === '/' ||
        strippedPath === '' ||
        strippedPath === '/' ||
        strippedPath === '/dashboard' ||
        strippedPath === '/company-dashboard' ||
        strippedPath === '/modules'
      );
    }

    // 2. Companies
    if (item.id === 'companies' || itemPath === '/owner/companies') {
      return currentPath.startsWith('/owner/companies');
    }

    // 3. Finance & Accounts (ACCOUNT)
    if (item.moduleKey === 'ACCOUNT' || item.id === 'finance') {
      return (
        strippedPath.startsWith('/accounts') ||
        strippedPath.startsWith('/account') ||
        strippedPath.startsWith('/finance') ||
        strippedPath.startsWith('/accounting')
      );
    }

    // 4. Inventory Management (INVENTORY)
    if (item.moduleKey === 'INVENTORY' || item.id === 'inventory') {
      return strippedPath.startsWith('/inventory');
    }

    // 5. Sales & CRM (CRM)
    if (item.moduleKey === 'CRM' || item.id === 'sales') {
      return (
        strippedPath.startsWith('/crm') ||
        strippedPath.startsWith('/sales') ||
        strippedPath.startsWith('/sales-crm') ||
        strippedPath.startsWith('/customers')
      );
    }

    // 6. Purchasing & Procurement (PURCHASES)
    if (item.moduleKey === 'PURCHASES' || item.id === 'purchases') {
      return (
        strippedPath.startsWith('/purchases') ||
        strippedPath.startsWith('/purchase-requisitions') ||
        strippedPath.startsWith('/rfqs') ||
        strippedPath.startsWith('/supplier-quotations') ||
        strippedPath.startsWith('/purchase-orders') ||
        strippedPath.startsWith('/goods-receipts') ||
        strippedPath.startsWith('/payments')
      );
    }

    // 7. Workflow Automation (WORKFLOW)
    if (item.moduleKey === 'WORKFLOW' || item.id === 'workflow') {
      return (
        strippedPath.startsWith('/workflow') ||
        strippedPath.startsWith('/workflows') ||
        strippedPath.startsWith('/approvals')
      );
    }

    // 8. SSO & Administration (SSO)
    if (item.moduleKey === 'SSO' || item.id === 'sso') {
      return (
        strippedPath.startsWith('/admin') ||
        strippedPath.startsWith('/users') ||
        strippedPath.startsWith('/roles') ||
        strippedPath.startsWith('/portal-access') ||
        strippedPath.startsWith('/sessions') ||
        strippedPath.startsWith('/security') ||
        strippedPath.startsWith('/features') ||
        strippedPath.startsWith('/permissions')
      );
    }

    // 9. Organization Settings
    if (item.id === 'organization-settings') {
      return (
        currentPath === '/owner/settings' ||
        currentPath.startsWith('/owner/settings') ||
        currentPath === '/organization/settings' ||
        currentPath.startsWith('/organization/settings')
      );
    }

    // 10. Subscription / Billing
    if (item.id === 'subscription-billing') {
      return (
        currentPath.startsWith('/subscription') ||
        strippedPath.startsWith('/subscription') ||
        currentPath.startsWith('/owner/subscription')
      );
    }

    // 11. Owner Profile
    if (item.id === 'owner-profile') {
      return (
        currentPath.startsWith('/profile') ||
        strippedPath.startsWith('/profile') ||
        currentPath.startsWith('/owner/profile')
      );
    }

    // Exact or prefix fallback
    return (
      currentPath === itemPath ||
      currentPath.startsWith(`${itemPath}/`) ||
      strippedPath === itemPath ||
      strippedPath.startsWith(`${itemPath}/`)
    );
  };

  /**
   * Header block of the sidebar
   */
  /**
   * Header block of the sidebar matching CompanyLayout
   */
  const renderHeader = (collapsedMode = false) => {
    if (collapsedMode) {
      return (
        <div className="h-[56px] flex items-center justify-center border-b border-zinc-100/50 dark:border-[#2A2F3D] px-2 shrink-0">
          <Tooltip content={`${orgName} (${orgCode || 'OWNER'})`}>
            <button
              type="button"
              onClick={() => navigate('/owner/dashboard')}
              className="flex items-center justify-center p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors focus:outline-hidden"
              aria-label="Go to Owner Dashboard"
            >
              <MarkLogo className="h-7 w-7 object-contain cursor-pointer" />
            </button>
          </Tooltip>
        </div>
      );
    }

    return (
      <div className="h-[56px] px-6 flex items-center gap-3 shrink-0 bg-transparent border-b border-zinc-100/50 dark:border-[#2A2F3D]">
        <div
          className="w-24 h-10 flex items-center justify-start transform transition-transform hover:scale-105 cursor-pointer"
          onClick={() => navigate('/owner/dashboard')}
        >
          <MarkLogo variant="auto" className="w-full h-full object-contain object-left" />
        </div>
        <span className="ml-auto text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 uppercase tracking-wider shrink-0">
          Owner
        </span>

        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
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
      <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto space-y-3 custom-scrollbar">
        {navGroups.map((group) => {
          return (
            <div key={group.id} className="space-y-0.5">
              {group.title && (
                collapsedMode ? (
                  <div className="h-px bg-zinc-200/60 dark:bg-[#2A2F3D] my-2 mx-1" aria-hidden="true" />
                ) : (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-[#6B7184] uppercase select-none">
                    {group.title}
                  </div>
                )
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  const isLocked = !item.isEntitled;

                  // ── Non-clickable display-only item (e.g. Organization Available Modules) ──
                  if (item.isNonClickable || group.isDisplayOnly) {
                    const itemTooltipText = `${item.label} (Active Organization Module)`;

                    const moduleDisplayContent = (
                      <div
                        className={`sidebar-item select-none cursor-default ${
                          collapsedMode ? 'justify-center p-2.5' : 'justify-between'
                        } text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100/60 dark:hover:bg-[#222736] transition-colors`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={18}
                            className={`shrink-0 ${item.accentColor || 'text-zinc-500 dark:text-[#A0A6B5]'}`}
                          />
                          {!collapsedMode && (
                            <span className="truncate text-xs font-medium text-zinc-700 dark:text-[#E6E8EE]">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!collapsedMode && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-[#34C38F]/15 dark:text-[#34C38F] dark:border-[#34C38F]/30 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>
                    );

                    if (collapsedMode) {
                      return (
                        <div key={item.id} className="flex justify-center">
                          <Tooltip content={itemTooltipText}>
                            {moduleDisplayContent}
                          </Tooltip>
                        </div>
                      );
                    }

                    return <div key={item.id}>{moduleDisplayContent}</div>;
                  }

                  // ── If module is LOCKED / NOT PROVISIONED ──
                  if (isLocked) {
                    const lockedTooltipText = `${item.label} (Not Provisioned • Click to upgrade)`;

                    const lockedContent = (
                      <NavLink
                        to="/subscription"
                        onClick={mobileOpen ? onMobileClose : undefined}
                        className={`sidebar-item group ${
                          collapsedMode
                            ? 'justify-center p-2.5'
                            : 'justify-between'
                        } opacity-65 hover:opacity-100 transition-opacity`}
                        title={collapsedMode ? lockedTooltipText : item.label}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1.5">
                          <Icon size={18} className="shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:text-[#6B7184] dark:group-hover:text-[#A0A6B5] transition-colors" />
                          {!collapsedMode && (
                            <span className="truncate text-xs text-zinc-500 dark:text-[#6B7184] font-medium" title={item.label}>
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!collapsedMode && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D] px-2 py-0.5 rounded-full border border-zinc-200/80 shrink-0">
                            <Lock size={10} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
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
                      className={`sidebar-item group ${
                        collapsedMode
                          ? 'justify-center p-2.5'
                          : 'justify-between'
                      } ${
                        active
                          ? 'sidebar-item-active'
                          : 'sidebar-item-inactive'
                      }`}
                      title={collapsedMode ? itemTooltipText : item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1.5">
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            active ? 'text-white' : (item.accentColor || 'text-zinc-500 group-hover:text-zinc-800 dark:text-[#A0A6B5] dark:group-hover:text-[#E6E8EE]')
                          }`}
                        />
                        {!collapsedMode && (
                          <span className="truncate text-xs font-medium dark:text-[#E6E8EE]" title={item.label}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!collapsedMode && (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            active
                              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                              : (item.badgeColor || 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-[#34C38F]/15 dark:text-[#34C38F] dark:border-[#34C38F]/30')
                          }`}
                        >
                          {(item.badge === 'Active' || !item.badge) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <span>{item.badge || 'Active'}</span>
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
      <div className="shrink-0 p-3 border-t border-zinc-100 bg-zinc-50/50 dark:border-[#2A2F3D] dark:bg-[#161922] backdrop-blur-sm">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsedMode ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center rounded-xl text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-white border border-zinc-200/80 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] dark:hover:bg-[#222736] dark:border-[#2A2F3D] shadow-xs transition-all duration-200 ${
              collapsedMode ? 'justify-center p-2.5' : 'px-3 py-2 justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              {collapsedMode ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!collapsedMode && <span>Collapse Sidebar</span>}
            </div>
            {!collapsedMode && (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:text-[#6B7184] dark:bg-[#1D212C] dark:border-[#2A2F3D] px-1.5 py-0.5 rounded border border-zinc-200/50">
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
        className={`hidden lg:flex flex-col bg-[var(--color-sidebar-bg)] border-r border-black/[0.06] dark:border-[#2A2F3D] fixed top-0 bottom-0 left-0 z-20 transition-[width] duration-large ease-move overscroll-contain ${
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
          <aside
            className="relative flex flex-col w-[280px] max-w-[85vw] bg-[var(--color-sidebar-bg)] h-full shadow-2xl border-r border-[var(--color-border)] dark:border-[#2A2F3D] z-50 animate-slide-in-right overscroll-contain"
          >
            {renderHeader(false)}
            {renderNav(false)}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 dark:border-[#2A2F3D] dark:bg-[#161922] shrink-0">
              <button
                type="button"
                onClick={onMobileClose}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 dark:text-[#E6E8EE] dark:bg-[#1D212C] dark:border-[#2A2F3D] dark:hover:bg-[#222736] shadow-xs hover:bg-zinc-50 transition-colors"
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
