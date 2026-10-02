import React from 'react';
import { FileText } from 'lucide-react';

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

export default function AccountSummary({ openingBalance, totalDebit, totalCredit, closingBalance }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3.5 flex items-center gap-2">
        <FileText size={16} className="text-zinc-500" />
        <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Account Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/30 border-b border-zinc-100 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right text-emerald-700 w-1/3">Debit (DR)</th>
              <th className="px-5 py-3 text-right text-rose-700 w-1/3">Credit (CR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {/* Opening Balance */}
            <tr className="hover:bg-zinc-50/50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-zinc-600">Opening Balance</td>
              <td className="px-5 py-3.5 text-right font-medium text-emerald-600">
                {(() => {
                  if (!openingBalance) return '—';
                  const amt = openingBalance.amount ?? 0;
                  const type = openingBalance.balanceType ?? 'DR';
                  if (amt === 0) return formatINR(0);
                  if (amt > 0 && type !== 'CR') {
                     return <>{formatINR(amt)} <span className="text-[10px] ml-1 font-bold opacity-80">DR</span></>;
                  }
                  return '—';
                })()}
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-rose-600">
                {(() => {
                  if (!openingBalance) return '—';
                  const amt = openingBalance.amount ?? 0;
                  const type = openingBalance.balanceType ?? 'DR';
                  if (amt > 0 && type === 'CR') {
                     return <>{formatINR(amt)} <span className="text-[10px] ml-1 font-bold opacity-80">CR</span></>;
                  }
                  return '—';
                })()}
              </td>
            </tr>
            
            {/* Total Transactions */}
            <tr className="hover:bg-zinc-50/50 transition-colors bg-zinc-50/40">
              <td className="px-5 py-3.5 font-medium text-zinc-600">Total Transactions</td>
              <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                {totalDebit > 0 ? formatINR(totalDebit) : '—'}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                {totalCredit > 0 ? formatINR(totalCredit) : '—'}
              </td>
            </tr>

            {/* Closing Balance */}
            <tr className="hover:bg-zinc-50/50 transition-colors bg-zinc-50 border-t-2 border-zinc-200">
              <td className="px-5 py-4 font-bold text-zinc-900">Closing Balance</td>
              <td className="px-5 py-4 text-right font-bold text-emerald-700">
                {(() => {
                  if (!closingBalance) return '—';
                  const amt = typeof closingBalance === 'object' ? (closingBalance.amount ?? 0) : closingBalance;
                  const type = typeof closingBalance === 'object' ? closingBalance.balanceType : 'DR';
                  if (amt === 0) return formatINR(0);
                  if (amt > 0 && type !== 'CR') {
                     return <>{formatINR(amt)} <span className="text-[11px] ml-1 font-extrabold text-emerald-600/80">DR</span></>;
                  }
                  return '—';
                })()}
              </td>
              <td className="px-5 py-4 text-right font-bold text-rose-700">
                {(() => {
                  if (!closingBalance) return '—';
                  const amt = typeof closingBalance === 'object' ? (closingBalance.amount ?? 0) : closingBalance;
                  const type = typeof closingBalance === 'object' ? closingBalance.balanceType : 'DR';
                  if (amt > 0 && type === 'CR') {
                     return <>{formatINR(amt)} <span className="text-[11px] ml-1 font-extrabold text-rose-600/80">CR</span></>;
                  }
                  return '—';
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
