import React from 'react';
import { ChevronDown } from 'lucide-react';

export function SettingsSelect({ label, id, description, options = [], ...props }) {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className="w-full px-4 py-2 border border-zinc-300 rounded-xl appearance-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none bg-white transition-colors cursor-pointer pr-10 text-zinc-900"
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
          <ChevronDown size={16} />
        </div>
      </div>
      {description && <p className="text-xs text-zinc-500 mt-1.5">{description}</p>}
    </div>
  );
}
