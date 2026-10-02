import React from 'react';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

export default function TrialBalanceSummary({
  totalOpening = 0,
  totalDebit = 0,
  totalCredit = 0,
  totalClosing = 0,
  accountCount = 0
}) {
  const debitNum = Number(totalDebit || 0);
  const creditNum = Number(totalCredit || 0);
  const difference = Math.abs(debitNum - creditNum);
  const isBalanced = difference < 0.01;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-zinc-500" />
          <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Trial Balance Summary</h3>
        </div>
        <div>
          {isBalanced ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} />
              Balanced (DR = CR)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle size={12} />
              Out of Balance: Diff {formatINR(difference)}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/40 border-b border-zinc-100 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3 text-right text-zinc-600">Accounts</th>
              <th className="px-5 py-3 text-right text-zinc-700">Opening Balance</th>
              <th className="px-5 py-3 text-right text-emerald-700">Total Debit (DR)</th>
              <th className="px-5 py-3 text-right text-rose-700">Total Credit (CR)</th>
              <th className="px-5 py-3 text-right text-zinc-900">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <tr className="hover:bg-zinc-50/50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-zinc-800">
                Period Totals
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-zinc-600">
                {accountCount > 0 ? accountCount : '—'}
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-zinc-600">
                {totalOpening ? formatINR(totalOpening) : '₹0.00'}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                {debitNum > 0 ? formatINR(debitNum) : '—'}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                {creditNum > 0 ? formatINR(creditNum) : '—'}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-zinc-800">
                {totalClosing ? formatINR(totalClosing) : '₹0.00'}
              </td>
            </tr>

            {/* Grand Total Comparison */}
            <tr className="hover:bg-zinc-50/50 transition-colors bg-zinc-50 border-t-2 border-zinc-200">
              <td className="px-5 py-4 font-bold text-zinc-900" colSpan={3}>
                Net Difference (DR - CR)
              </td>
              <td
                className={`px-5 py-4 text-right font-bold ${
                  isBalanced ? 'text-emerald-700' : 'text-rose-700'
                }`}
                colSpan={3}
              >
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    ₹0.00 (Balanced)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-600" />
                    {formatINR(difference)} (Mismatch)
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
