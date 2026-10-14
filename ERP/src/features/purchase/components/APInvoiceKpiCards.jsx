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
    <div className="p-6 bg-white border-b border-zinc-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Grand Total</p>
          <p className="text-base font-black text-zinc-900">{curr} {fmt(totalAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Taxable Amount</p>
          <p className="text-base font-black text-zinc-900">{curr} {fmt(inv?.taxableAmount ?? inv?.subtotal)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Tax</p>
          <p className="text-base font-black text-zinc-900">{curr} {fmt(inv?.taxAmount ?? inv?.totalTax)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col">
          <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-base font-black text-emerald-700">{curr} {fmt(totalPaid)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/30 flex flex-col">
          <p className="text-[8px] font-bold text-red-600 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-base font-black text-red-700">{curr} {fmt(outstandingAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col">
          <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Payment %</p>
          <p className="text-base font-black text-emerald-700">{paymentPercentage}%</p>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Count</p>
          <p className="text-base font-black text-zinc-900">{inv?.itemCount || (items?.length || 0)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col">
          <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider mb-1">Days Outstanding</p>
          <p className="text-base font-black text-amber-700">{inv?.daysOutstanding || 0} d</p>
        </div>
        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col">
          <p className="text-[8px] font-bold text-rose-600 uppercase tracking-wider mb-1">Days Overdue</p>
          <p className="text-base font-black text-rose-700">{inv?.daysOverdue || 0} d</p>
        </div>
      </div>
    </div>
  );
}
