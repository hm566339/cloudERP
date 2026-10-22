import React from 'react';
import { formatCurrency } from "../../utils/formatters";

export default function SummaryCards({ cards, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-[#161922] rounded-lg shadow p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`bg-white dark:bg-[#161922] rounded-lg shadow dark:shadow-none border border-transparent dark:border-[#2A2F3D] p-5 border-l-4 ${card.color || 'border-blue-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-[#A0A6B5] truncate">{card.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">
                {card.isCurrency ? formatCurrency(card.value) : card.value}
              </h3>
            </div>
            {card.icon && (
              <div className="p-2 rounded-md bg-zinc-50 dark:bg-[#1D212C] text-zinc-500 dark:text-[#A0A6B5]">
                {card.icon}
              </div>
            )}
          </div>
          {card.trend && (
            <div className="mt-4 text-sm">
              <span className={`font-medium ${card.trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend.value >= 0 ? '+' : ''}{card.trend.value}%
              </span>
              <span className="text-zinc-500 ml-2">{card.trend.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
