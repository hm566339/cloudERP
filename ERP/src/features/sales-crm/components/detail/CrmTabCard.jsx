import React from 'react';

/**
 * Reusable card wrapper for detail tab content panels.
 * Mirrors the exact styling, border, background, and header structure
 * of TabCard in CustomerDetails.jsx / VendorDetails.jsx.
 *
 * Props:
 *   title        string
 *   count        number | string (optional badge)
 *   action       ReactNode (optional right-side header action)
 *   children     ReactNode
 *   className    string
 *   bodyClass    string
 *   noPadding    boolean
 */
export default function CrmTabCard({
  title,
  count,
  action,
  children,
  className = '',
  bodyClass = '',
  noPadding = false,
}) {
  return (
    <div
      className={`animate-fade-in bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden ${className}`}
    >
      {(title || count != null || action) && (
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
          <div className="flex items-center gap-2.5">
            {title && (
              <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE]">
                {title}
              </h3>
            )}
            {count != null && (
              <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-[#A0A6B5] px-2.5 py-1 rounded-lg">
                {count} {typeof count === 'number' ? 'Total' : ''}
              </span>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : `p-6 ${bodyClass}`}>{children}</div>
    </div>
  );
}
