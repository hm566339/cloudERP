import React from 'react';

/**
 * Reusable detail tabs navigation for Sales & CRM entity detail views.
 * Mirrors the exact styling, grid rhythm, active state tokens, and sticky positioning
 * of CustomerDetails.jsx / VendorDetails.jsx in the Accounts module.
 *
 * Props:
 *   tabs        Array<{ id: string, label: string, icon: LucideIcon, count?: number }>
 *   activeTab   string
 *   onChange    (tabId: string) => void
 *   topOffset   string (default 'top-[192px]')
 *   className   string
 */
export default function CrmDetailTabs({
  tabs = [],
  activeTab,
  onChange,
  topOffset = 'top-[192px]',
  className = '',
}) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div
      className={`bg-zinc-50/80 dark:bg-[#161922] rounded-lg shadow-sm border border-zinc-200/80 dark:border-[#2A2F3D] p-1.5 sticky ${topOffset} z-30 ${className}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-lg transition-all outline-none ${
                isActive
                  ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-sm border border-zinc-200/60 dark:border-[#2A2F3D]'
                  : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100/80 dark:hover:bg-[#222736] border border-transparent'
              }`}
            >
              {Icon && (
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-zinc-900 dark:text-[#E6E8EE]' : 'text-zinc-400 dark:text-[#6B7184]'}
                />
              )}
              <span className="truncate">{tab.label}</span>
              {tab.count != null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
