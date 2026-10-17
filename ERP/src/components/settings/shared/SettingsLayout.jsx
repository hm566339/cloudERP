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
    <div className={`p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in ${className}`}>
      {/* ── Reusable Settings Navigation Bar ── */}
      {showNavbar && (
        <div className="shrink-0">
          <SettingsNavbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      )}

      {/* ── Optional Page Header when passed directly to Layout ── */}
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
              {badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200">
                  {badge}
                </span>
              )}
            </div>
            {description && <p className="text-zinc-500 text-xs md:text-sm mt-1">{description}</p>}
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
