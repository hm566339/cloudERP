import React from 'react';

export function SettingsToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        {label && <h4 className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{label}</h4>}
        {description && <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4C8DFF] focus:ring-offset-2 ${
          checked ? 'bg-zinc-900 dark:bg-[#4C8DFF]' : 'bg-zinc-200 dark:bg-[#2A2F3D]'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#E6E8EE] shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
