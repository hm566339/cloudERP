import React from 'react';
import { Outlet } from 'react-router-dom';
import SettingsNavbar from '../SettingsNavbar';

/**
 * Shared SettingsLayout component.
 * Integrates the application header, SettingsNavbar, active title/description,
 * and nested route content or children.
 */
export function SettingsLayout({
  children,
  title,
  description,
  badge,
  activeTab,
  onTabChange,
  showNavbar = true,
  className = '',
}) {
  return (
    <div className={`p-4 sm:p-6 w-full space-y-6 animate-fade-in ${className}`}>
      {/* ── Reusable Settings Navigation Bar ── */}
      {showNavbar && (
        <div className="shrink-0">
          <SettingsNavbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}

      {/* ── Optional Page Header when passed directly to Layout ── */}
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-[#2A2F3D] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{title}</h1>
              {badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] rounded-md border border-zinc-200 dark:border-[#2A2F3D]">
                  {badge}
                </span>
              )}
            </div>
            {description && <p className="text-zinc-500 dark:text-[#A0A6B5] text-xs md:text-sm mt-1">{description}</p>}
          </div>
        </div>
      )}

      {/* ── Main Settings Content (Children or Nested Route Outlet) ── */}
      <div className="w-full">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export default SettingsLayout;
