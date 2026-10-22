import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

/**
 * Reusable Financial Metric Cards matching General Ledger aesthetics
 *
 * @param {Array} cards - [{ label, value, color, icon, badge, isCurrency = true, change }]
 */
export default function FinancialSummaryCards({ cards = [] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-none">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const formattedValue = card.isCurrency !== false
          ? formatINR(card.value)
          : (card.value != null ? String(card.value) : '0');

        return (
          <div
            key={card.id || card.label || idx}
            className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between transition-all duration-200 hover:shadow-xs hover:border-zinc-300 dark:hover:border-[#3A4154]"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider truncate" title={card.label}>
                {card.label}
              </span>
              {IconComponent && (
                <div className="p-1.5 rounded-lg bg-zinc-100/80 dark:bg-[#1D212C] text-zinc-600 dark:text-[#E6E8EE] shrink-0 border border-transparent dark:border-[#2A2F3D]">
                  <IconComponent size={14} />
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`text-lg sm:text-xl font-bold tracking-tight truncate tabular-nums ${
                  card.color || 'text-zinc-900 dark:text-[#E6E8EE]'
                }`}
                title={formattedValue}
              >
                {formattedValue}
              </span>

              {card.badge && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    card.badgeType === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : card.badgeType === 'danger' || card.badgeType === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                      : card.badgeType === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D]'
                  }`}
                >
                  {card.badgeType === 'success' && <CheckCircle2 size={10} />}
                  {(card.badgeType === 'danger' || card.badgeType === 'warning') && <AlertCircle size={10} />}
                  {card.badge}
                </span>
              )}
            </div>

            {card.subtext && (
              <p className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-1.5 truncate">
                {card.subtext}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
