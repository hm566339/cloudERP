import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

function ApprovalList({ approvals = [], loading = false, emptyMessage = 'No pending approvals.' }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1D212C] shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-1/2 rounded" />
              <SkeletonBox className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <CheckCircle2 className="mx-auto text-zinc-300 dark:text-[#2A2F3D] mb-3" size={32} />
        <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {approvals.map((item, idx) => (
        <li key={item.id || idx} className="flex items-center justify-between p-3 bg-[#F7F7F0] dark:bg-[#161922] rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-sm hover:border-[#BAC3A6] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">{item.title || item.reference || 'Pending Approval'}</p>
              <p className="text-[10px] text-[#485942] dark:text-[#A0A6B5] font-medium uppercase tracking-wider mt-0.5">{item.module || 'DASHBOARD'} • {item.status || 'PENDING'}</p>
            </div>
          </div>
          {item.amount && (
            <span className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
              {typeof item.amount === 'number' ? item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : item.amount}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default React.memo(ApprovalList);
