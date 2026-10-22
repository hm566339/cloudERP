import React from 'react';

export default function StatusToggle({ active, onChange }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        active ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          active ? 'translate-x-4.5' : 'translate-x-1'
        }`}
        style={{ transform: `translateX(${active ? '1.125rem' : '0.25rem'})` }}
      />
    </button>
  );
}
