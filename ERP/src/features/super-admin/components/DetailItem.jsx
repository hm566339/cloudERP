import React from 'react';

export default function DetailItem({ label, value, isMono = false }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] ${isMono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}
