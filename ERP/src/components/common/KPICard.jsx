import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, valueClass = "text-zinc-900" }) => (
  <div className="bg-white p-2.5 xl:p-4 rounded-xl border border-zinc-200/60 shadow-sm flex flex-col justify-between h-full group relative overflow-hidden">
    <div className="absolute -right-4 -top-4 w-16 h-16 bg-zinc-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="min-w-0 flex flex-col h-full relative z-10">
      <div className="flex items-start gap-1.5 mb-1.5">
        {Icon && (
          <div className="p-1 xl:p-1.5 bg-zinc-100 rounded-lg text-zinc-600 shrink-0">
            <Icon size={12} className="xl:w-4 xl:h-4" />
          </div>
        )}
        <p className="text-[7.2px] xl:text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 leading-tight break-words">{title}</p>
      </div>
      <div className="mt-auto pt-1">
        <h4 className={`text-sm md:text-base xl:text-xl font-black tracking-tight whitespace-nowrap ${valueClass}`}>{value}</h4>
        {subtitle && (
          <p className="text-[6.4px] xl:text-[8px] font-semibold text-zinc-400 mt-0.5 whitespace-nowrap truncate">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

export default KPICard;
