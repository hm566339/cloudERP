import React from 'react';

export default function SummaryCard({ label, icon: Icon, variant = 'primary', value }) {
  const variantStyles = {
    primary: 'bg-blue-50 dark:bg-[#4C8DFF]/15 text-blue-600 dark:text-[#4C8DFF]',
    success: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-600 dark:text-[#34C38F]',
    warning: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-rose-500/15 text-red-600 dark:text-rose-400',
    info: 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    default: 'bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5]',
  };

  const iconBg = variantStyles[variant] || variantStyles.default;

  return (
    <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-5 flex items-start gap-4 animate-slide-up">
      {Icon && (
        <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-[9.6px] font-semibold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">{value}</div>
      </div>
    </div>
  );
}
