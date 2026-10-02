import React from 'react';

export default function SummaryCard({ label, icon: Icon, variant = 'primary', value }) {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-sky-50 text-sky-600',
    default: 'bg-zinc-50 text-zinc-600',
  };

  const iconBg = variantStyles[variant] || variantStyles.default;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 flex items-start gap-4 animate-slide-up">
      {Icon && (
        <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-[9.6px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold text-zinc-900">{value}</div>
      </div>
    </div>
  );
}
