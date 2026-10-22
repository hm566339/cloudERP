import React from 'react';

export function SettingsCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6 ${className}`}>
      {(title || description) && (
        <div className="p-6 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/50">
          {title && <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#E6E8EE]">{title}</h2>}
          {description && <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
