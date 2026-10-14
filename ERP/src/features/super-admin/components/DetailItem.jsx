import React from 'react';

export default function DetailItem({ label, value, isMono = false }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xs font-semibold text-zinc-800 ${isMono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}
