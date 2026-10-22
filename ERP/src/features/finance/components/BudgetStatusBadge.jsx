import React from 'react';

const BudgetStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'DRAFT';
  switch (s) {
    case 'ACTIVE': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50">Active</span>;
    case 'COMPLETED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-[#4C8DFF] border-blue-200 dark:border-blue-900/50">Completed</span>;
    case 'EXCEEDED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50">Exceeded</span>;
    case 'EXPIRED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50">Expired</span>;
    case 'DRAFT': 
    default: 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#2A2F3D]">Draft</span>;
    case 'CLOSED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-[#4C8DFF] border-blue-200 dark:border-blue-900/50">Closed</span>;
  }
};

export default BudgetStatusBadge;
