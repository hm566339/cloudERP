import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export default function GstKpiCards({
  cards = [],
  currency = 'INR',
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-card-dark p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark shadow-2xs animate-pulse">
            <div className="h-2.5 bg-zinc-200 dark:bg-[#222736] rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-zinc-200 dark:bg-[#222736] rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  const getColSpanClass = (count) => {
    switch (count) {
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-3';
      case 4: return 'grid-cols-2 sm:grid-cols-4';
      case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
      case 7: return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    }
  };

  return (
    <div className={`grid ${getColSpanClass(cards.length)} gap-3 ${className}`}>
      {cards.map((card, idx) => {
        const val = card.value ?? 0;
        const displayVal = card.isCurrency
          ? `${currency} ${formatCurrency(val)}`
          : typeof val === 'number'
            ? val.toLocaleString()
            : String(val);

        return (
          <div
            key={idx}
            className="bg-white dark:bg-card-dark p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider truncate">
                {card.label}
              </span>
              {card.icon && (
                <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  {card.icon}
                </span>
              )}
            </div>

            <div className={`text-base font-bold font-mono tracking-tight truncate ${card.color || 'text-zinc-900 dark:text-[#E6E8EE]'}`}>
              {displayVal}
            </div>

            {card.subtitle && (
              <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                {card.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

