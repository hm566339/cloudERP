import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, isActive, isDeleted, isClosed }) => {
  // If explicitly passed `status` string (like OPEN, CLOSED, LOCKED)
  if (status) {
    const cfg = {
      OPEN: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
      LOCKED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    }[status] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${cfg.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {status}
      </span>
    );
  }

  // Boolean flags
  if (isDeleted) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Deleted
      </span>
    );
  }

  if (isClosed) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Closed
      </span>
    );
  }

  if (isActive === false) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Inactive
      </span>
    );
  }

  // Default to Active / Open if isActive is true or undefined (assuming true if nothing else matches)
  return (
    <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1.5">
      <CheckCircle size={14} /> {isClosed === false ? 'Open' : 'Active'}
    </span>
  );
};

export default StatusBadge;
