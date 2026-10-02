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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          <Building2 size={14} />
          SSO Administration
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {companyName || 'Company Dashboard'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {today}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[96px]"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
