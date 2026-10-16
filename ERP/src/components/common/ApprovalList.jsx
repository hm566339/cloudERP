import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

function ApprovalList({ approvals = [], loading = false, emptyMessage = 'No pending approvals.' }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200 shadow-sm animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 shrink-0" />
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
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <CheckCircle2 className="mx-auto text-zinc-300 mb-3" size={32} />
        <p className="text-sm text-zinc-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {approvals.map((item, idx) => (
        <li key={item.id || idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{item.title || item.reference || 'Pending Approval'}</p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">{item.module || 'DASHBOARD'} • {item.status || 'PENDING'}</p>
            </div>
          </div>
          {item.amount && (
            <span className="text-sm font-bold text-zinc-900">
              {typeof item.amount === 'number' ? item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : item.amount}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default React.memo(ApprovalList);
