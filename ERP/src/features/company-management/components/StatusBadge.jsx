import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ active, activeText = 'Active', inactiveText = 'Inactive' }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        <CheckCircle2 size={12} />
        {activeText}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
      <XCircle size={12} />
      {inactiveText}
    </span>
  );
}
