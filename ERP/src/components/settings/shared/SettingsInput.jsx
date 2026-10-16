import React from 'react';

export function SettingsInput({ label, id, description, ...props }) {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-colors text-zinc-900"
        {...props}
      />
      {description && <p className="text-xs text-zinc-500 mt-1.5">{description}</p>}
    </div>
  );
}
