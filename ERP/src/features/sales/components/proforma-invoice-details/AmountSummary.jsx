import React from 'react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function AmountSummary({ pi }) {
  const curr = pi.currency || 'INR';

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
        <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Amount Summary</h3>
      </div>
      <div className="p-5">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Subtotal</span>
            <span className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Discount</span>
            <span className="font-medium text-red-600 dark:text-red-400">{pi.discountAmount ? `-${curr} ${fmt(pi.discountAmount)}` : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Tax Amount</span>
            <span className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Freight Charges</span>
            <span className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.freightCharges)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Other Charges</span>
            <span className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.otherCharges)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-[#6B7184]">Round Off</span>
            <span className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.roundOff)}</span>
          </div>
          
          <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-base">Grand Total</span>
              <span className="font-bold text-xl text-indigo-700 dark:text-indigo-400">{curr} {fmt(pi.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
