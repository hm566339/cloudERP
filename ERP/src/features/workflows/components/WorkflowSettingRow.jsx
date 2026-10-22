import React from 'react';

export default function WorkflowSettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] leading-tight">{label}</p>
        <p className="text-[11px] text-zinc-400 dark:text-[#A0A6B5] leading-tight mt-0.5 truncate">{description}</p>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}
