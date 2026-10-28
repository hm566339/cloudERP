import React from 'react';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

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
 * Compact Statement Summary for Profit & Loss
 * Follows the exact design pattern of AccountSummary and TrialBalanceSummary.
 */
export default function ProfitLossSummary({
  totalRevenue = 0,
  totalExpenses = 0,
  grossProfit = 0,
  netProfit = 0,
  isNetProfitPositive = true,
  revenueAccountCount = 0,
  expenseAccountCount = 0
}) {
  const marginPercent = totalRevenue > 0
    ? ((netProfit / totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs overflow-hidden flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header matching AccountSummary & TrialBalanceSummary */}
      <div className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-zinc-500 dark:text-[#A0A6B5]" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
            Statement Summary &amp; Net Result
          </h3>
        </div>
        <div>
          {isNetProfitPositive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
              <CheckCircle2 size={12} />
              Net Profit: {formatINR(netProfit)} ({marginPercent}% Margin)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">
              <AlertCircle size={12} />
              Net Loss: {formatINR(Math.abs(netProfit))} ({marginPercent}% Margin)
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/40 dark:bg-[#1D212C]/40 border-b border-zinc-100 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3 text-right text-emerald-700 dark:text-emerald-400">Total Revenue ({revenueAccountCount})</th>
              <th className="px-5 py-3 text-right text-rose-700 dark:text-rose-400">Total Expenses ({expenseAccountCount})</th>
              <th className="px-5 py-3 text-right text-blue-700 dark:text-blue-400">Gross Profit</th>
              <th className="px-5 py-3 text-right text-zinc-900 dark:text-[#E6E8EE]">Net Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                Period Performance Totals
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                {formatINR(totalRevenue)}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                {formatINR(totalExpenses)}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums font-mono">
                {formatINR(grossProfit)}
              </td>
              <td
                className={`px-5 py-3.5 text-right font-bold tabular-nums font-mono ${
                  isNetProfitPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isNetProfitPositive ? formatINR(netProfit) : `(${formatINR(Math.abs(netProfit))})`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
