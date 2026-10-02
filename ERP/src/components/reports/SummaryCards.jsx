import React from 'react';
import { formatCurrency } from "../../utils/formatters";

export default function SummaryCards({ cards, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(cards.length, 4)} gap-4 mb-6`}>
      {cards.map((card, idx) => (
        <div key={idx} className={`bg-white rounded-lg shadow p-5 border-l-4 ${card.color || 'border-blue-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">{card.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {card.isCurrency ? formatCurrency(card.value) : card.value}
              </h3>
            </div>
            {card.icon && (
              <div className="p-2 rounded-md bg-gray-50 text-gray-500">
                {card.icon}
              </div>
            )}
          </div>
          {card.trend && (
            <div className="mt-4 text-sm">
              <span className={`font-medium ${card.trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend.value >= 0 ? '+' : ''}{card.trend.value}%
              </span>
              <span className="text-gray-500 ml-2">{card.trend.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
