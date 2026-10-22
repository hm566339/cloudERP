import React from 'react';

export default function StatisticCard({ label, icon: Icon, variant = 'default', value }) {
  return (
    <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4 flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div>
        <p className="text-[9.6px] font-semibold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase tracking-wide">{label}</p>
        <div className="text-xl font-bold text-zinc-800 dark:text-[#E6E8EE]">{value}</div>
      </div>
      {Icon && (
        <div className="text-zinc-400 dark:text-[#6B7184] p-2 bg-zinc-50 dark:bg-[#1D212C] rounded-lg">
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
