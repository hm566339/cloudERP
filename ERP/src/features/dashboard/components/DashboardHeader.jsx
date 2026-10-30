import React from 'react';
import { Building2, RefreshCw } from 'lucide-react';

export default function DashboardHeader({ companyName, onRefresh, loading }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F7F7F0] dark:bg-[#161922] p-6 rounded-2xl shadow-sm border border-[#D5D8CA] dark:border-[#2A2F3D]">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#2E3D28] dark:text-[#A9B887] uppercase tracking-wider mb-1">
          <Building2 size={14} />
          SSO Administration
        </div>
        <h1 className="text-2xl font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
          {companyName || 'Company Dashboard'}
        </h1>
        <p className="text-sm text-[#485942] dark:text-[#A0A6B5] mt-1">
          {today}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#EDEEE4] dark:bg-[#1D212C] dark:hover:bg-[#222736] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[96px]"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
