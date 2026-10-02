import React from 'react';

const BudgetStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'DRAFT';
  switch (s) {
    case 'ACTIVE': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">Active</span>;
    case 'COMPLETED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">Completed</span>;
    case 'EXCEEDED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 text-rose-700 border-rose-200">Exceeded</span>;
    case 'EXPIRED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 text-rose-700 border-rose-200">Expired</span>;
    case 'DRAFT': 
    default: 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">Draft</span>;
    case 'CLOSED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">Closed</span>;
  }
};

export default BudgetStatusBadge;
