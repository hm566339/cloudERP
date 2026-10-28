import React from 'react';
import { Landmark, Briefcase, Layers, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

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
 * Compact Statement Summary for Balance Sheet
 * Combines compact KPI metric cards and classification totals matching General Ledger.
 */
export default function BalanceSheetSummary({
  totalAssets = 0,
  totalLiabilities = 0,
  totalEquity = 0,
  isEquationBalanced = true,
  difference = 0,
  assetAccountCount = 0,
  liabilityAccountCount = 0,
  equityAccountCount = 0
}) {
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const kpis = [
    {
      label: 'Total Assets',
      value: formatINR(totalAssets),
      subtext: `${assetAccountCount} active accounts`,
      color: 'text-emerald-600 dark:text-emerald-400',
      icon: Landmark,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Total Liabilities',
      value: formatINR(totalLiabilities),
      subtext: `${liabilityAccountCount} obligations`,
      color: 'text-amber-600 dark:text-amber-400',
      icon: Briefcase,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Total Equity',
      value: formatINR(totalEquity),
      subtext: `${equityAccountCount} capital accounts`,
      color: 'text-blue-600 dark:text-blue-400',
      icon: Layers,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Accounting Equation',
      value: formatINR(totalLiabilitiesAndEquity),
      subtext: isEquationBalanced ? 'Assets = L + E Balanced' : `Diff: ${formatINR(difference)}`,
      color: isEquationBalanced ? 'text-zinc-900 dark:text-[#E6E8EE]' : 'text-rose-600 dark:text-rose-400',
      icon: Scale,
      bg: isEquationBalanced ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
      badge: isEquationBalanced ? 'Balanced' : 'Discrepancy',
      isSuccess: isEquationBalanced
    }
  ];

  return (
    <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs overflow-hidden flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header matching AccountSummary & TrialBalanceSummary */}
      <div className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-zinc-500 dark:text-[#A0A6B5]" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
            Statement Summary &amp; Accounting Equation
          </h3>
        </div>
        <div>
          {isEquationBalanced ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
              <CheckCircle2 size={12} />
              Balanced (Assets = L + E)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">
              <AlertCircle size={12} />
              Out of Balance: Diff {formatINR(difference)}
            </span>
          )}
        </div>
      </div>

      {/* 4 Compact Integrated KPI Metric Cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50/30 dark:bg-[#141720]/50 border-b border-zinc-100 dark:border-[#2A2F3D]">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#1D212C] p-3.5 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-1 rounded-md ${kpi.bg}`}>
                  <Icon size={13} />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-base sm:text-lg font-bold tracking-tight tabular-nums font-mono ${kpi.color}`}>
                  {kpi.value}
                </span>
                {kpi.badge && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                      kpi.isSuccess
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}
                  >
                    {kpi.isSuccess ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {kpi.badge}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-1 truncate">
                {kpi.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detailed Classification Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/40 dark:bg-[#1D212C]/40 border-b border-zinc-100 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3 text-right text-emerald-700 dark:text-emerald-400">Total Assets</th>
              <th className="px-5 py-3 text-right text-amber-700 dark:text-amber-400">Total Liabilities</th>
              <th className="px-5 py-3 text-right text-blue-700 dark:text-blue-400">Total Equity</th>
              <th className="px-5 py-3 text-right text-zinc-900 dark:text-[#E6E8EE]">Liabilities + Equity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                As Of Date Totals
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                {formatINR(totalAssets)}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums font-mono">
                {formatINR(totalLiabilities)}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums font-mono">
                {formatINR(totalEquity)}
              </td>
              <td
                className={`px-5 py-3.5 text-right font-bold tabular-nums font-mono ${
                  isEquationBalanced
                    ? 'text-zinc-900 dark:text-[#E6E8EE]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatINR(totalLiabilitiesAndEquity)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
