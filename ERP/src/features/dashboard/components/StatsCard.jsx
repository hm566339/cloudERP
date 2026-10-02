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
    <div className="card p-5 group hover:shadow-md transition-shadow relative overflow-hidden bg-white border border-zinc-200 rounded-xl">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-3xl font-bold text-zinc-900 tracking-tight">{total || 0}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {active !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {active} {activeLabel}
            </div>
          )}
          {inactive !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              {inactive} {inactiveLabel}
            </div>
          )}
          {blocked !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {blocked} Blocked
            </div>
          )}
          {unverified !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              {unverified} Unverified
            </div>
          )}
          {expired !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {expired} Expired
            </div>
          )}
          {used !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-200">
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
