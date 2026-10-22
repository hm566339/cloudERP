import React from 'react';

export default function APInvoiceKpiCards({
  curr,
  fmt,
  totalAmount,
  inv,
  items,
  totalPaid,
  outstandingAmount,
  paymentPercentage,
}) {
  return (
    <div className="p-6 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Grand Total</p>
          <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(totalAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Taxable Amount</p>
          <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(inv?.taxableAmount ?? inv?.subtotal)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Total Tax</p>
          <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(inv?.taxAmount ?? inv?.totalTax)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/10 flex flex-col">
          <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{curr} {fmt(totalPaid)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/10 flex flex-col">
          <p className="text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-base font-black text-red-700 dark:text-red-300">{curr} {fmt(outstandingAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/10 flex flex-col">
          <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Payment %</p>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{paymentPercentage}%</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Item Count</p>
          <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{inv?.itemCount || (items?.length || 0)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/10 flex flex-col">
          <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Days Outstanding</p>
          <p className="text-base font-black text-amber-700 dark:text-amber-300">{inv?.daysOutstanding || 0} d</p>
        </div>
        <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/10 flex flex-col">
          <p className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Days Overdue</p>
          <p className="text-base font-black text-rose-700 dark:text-rose-300">{inv?.daysOverdue || 0} d</p>
        </div>
      </div>
    </div>
  );
}
