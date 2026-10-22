import React from 'react';

export function SettingsInput({ label, id, description, ...props }) {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full px-4 py-2 border border-zinc-300 dark:border-[#2A2F3D] rounded-xl focus:ring-2 focus:ring-[#4C8DFF]/20 focus:border-[#4C8DFF] outline-none transition-colors text-zinc-900 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184]"
        {...props}
      />
      {description && <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1.5">{description}</p>}
    </div>
  );
}
