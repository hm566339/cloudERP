import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  X,
  ChevronRight,
} from 'lucide-react';
import { ORG_NAV_ITEMS, resolveOrgSubmenuPath } from './organizationNavConfig.js';

export { ORG_NAV_ITEMS };

/**
 * Dedicated vertical sub-sidebar navigation for Organization Management module.
 * Width: 256px (w-64), sticky layout with mobile slide-over drawer support.
 */
export default function OrganizationSubSidebar({
  organization,
  activeSection = 'overview',
  onSelectSection,
  mobileOpen = false,
  onCloseMobile,
  companiesCount = 0,
  membersCount = null,
}) {
  const location = useLocation();

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();

  // Determine base route (/settings/organization or /owner/settings)
  const basePath = location.pathname.startsWith('/settings/organization')
    ? '/settings/organization'
    : '/owner/settings';

  const getItemPath = (itemId) => {
    return resolveOrgSubmenuPath(basePath, itemId);
  };

  const isItemActive = (itemId) => {
    return activeSection === itemId;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#F7F7F0] dark:bg-[#161922] border-r border-[#D5D8CA] dark:border-[#2A2F3D]">
      {/* ── Sub-Sidebar Header ── */}
      <div className="p-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#2E3D28] dark:bg-primary text-white shadow-xs">
              <Building2 size={16} />
            </span>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5]">
                Organization Management
              </h2>
              <div className="text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] truncate max-w-[170px]" title={orgName}>
                {orgName}
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-[#485942] hover:text-[#2E3D28] dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] hover:bg-[#EDEEE4] dark:hover:bg-[#222736]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {orgCode && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D]">
              {orgCode}
            </span>
            <span className="text-[10px] text-[#485942] dark:text-[#A0A6B5]">Organization Scope</span>
          </div>
        )}
      </div>

      {/* ── 9 Submenu Navigation Items ── */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
        {ORG_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.id);
          const path = getItemPath(item.id);

          return (
            <NavLink
              key={item.id}
              to={path}
              onClick={() => {
                if (onSelectSection) onSelectSection(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${active
                  ? 'bg-white dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] font-bold shadow-xs border-l-3 border-[#2E3D28] dark:border-primary pl-2.5'
                  : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] hover:bg-[#EDEEE4]/80 dark:hover:bg-[#222736]/60 font-medium'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${active
                      ? 'text-[#2E3D28] dark:text-primary'
                      : 'text-[#485942] dark:text-[#A0A6B5] group-hover:text-[#2E3D28] dark:group-hover:text-[#E6E8EE]'
                    }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {/* Optional Badges */}
              {item.id === 'companies' && companiesCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EDEEE4] dark:bg-[#1D212C] text-[#485942] dark:text-[#A0A6B5] border border-[#D5D8CA] dark:border-[#2A2F3D]">
                  {companiesCount}
                </span>
              )}
              {item.id === 'users' && membersCount !== null && membersCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EDEEE4] dark:bg-[#1D212C] text-[#485942] dark:text-[#A0A6B5] border border-[#D5D8CA] dark:border-[#2A2F3D]">
                  {membersCount}
                </span>
              )}
              {active && (
                <ChevronRight size={13} className="text-[#2E3D28] dark:text-primary shrink-0 opacity-80" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer Info ── */}
      <div className="p-3 border-t border-[#D5D8CA] dark:border-[#2A2F3D] shrink-0 bg-[#EDEEE4]/40 dark:bg-[#1D212C]/40 text-[11px] text-[#485942] dark:text-[#A0A6B5]">
        <div className="flex items-center justify-between">
          <span>Multi-Tenant ERP</span>
          <span className="font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">v2.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sub-Sidebar (w-64) */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-[calc(100vh-60px)] sticky top-0 self-start">
        {navContent}
      </aside>

      {/* Mobile / Tablet Off-canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in-left">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}