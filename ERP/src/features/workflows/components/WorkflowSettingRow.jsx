import React from 'react';

export default function WorkflowSettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-zinc-50/50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-800 leading-tight">{label}</p>
        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5 truncate">{description}</p>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}
