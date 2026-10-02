import React from 'react';

export default function StatisticCard({ label, icon: Icon, variant = 'default', value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 flex items-center justify-between hover:border-zinc-300 transition-colors">
      <div>
        <p className="text-[9.6px] font-semibold text-zinc-500 mb-1 uppercase tracking-wide">{label}</p>
        <div className="text-xl font-bold text-zinc-800">{value}</div>
      </div>
      {Icon && (
        <div className="text-zinc-400 p-2 bg-zinc-50 rounded-lg">
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
