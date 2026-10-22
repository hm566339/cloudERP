import React from 'react';

/**
 * Reusable KPI Card displaying total, active, and inactive states.
 */
export default function StatsCard({ 
  title, 
  icon: Icon, 
  total, 
  active, 
  inactive, 
  blocked,
  unverified,
  expired,
  used,
  activeLabel = 'Active', 
  inactiveLabel = 'Inactive',
  colorClass = 'text-indigo-500', 
  bgClass = 'bg-indigo-50' 
}) {
  return (
    <div className="card p-5 group hover:shadow-md transition-shadow relative overflow-hidden bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-3xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{total || 0}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {active !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {active} {activeLabel}
            </div>
          )}
          {inactive !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
              {inactive} {inactiveLabel}
            </div>
          )}
          {blocked !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {blocked} Blocked
            </div>
          )}
          {unverified !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              {unverified} Unverified
            </div>
          )}
          {expired !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {expired} Expired
            </div>
          )}
          {used !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              {used} Used
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative Background Icon */}
      <div className={`absolute -bottom-6 -right-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
        <Icon size={120} />
      </div>
    </div>
  );
}
