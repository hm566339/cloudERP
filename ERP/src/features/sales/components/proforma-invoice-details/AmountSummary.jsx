import React from 'react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function AmountSummary({ pi }) {
  const curr = pi.currency || 'INR';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Amount Summary</h3>
      </div>
      <div className="p-5">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium text-zinc-900">{curr} {fmt(pi.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Discount</span>
            <span className="font-medium text-red-600">{pi.discountAmount ? `-${curr} ${fmt(pi.discountAmount)}` : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Tax Amount</span>
            <span className="font-medium text-zinc-900">{curr} {fmt(pi.taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Freight Charges</span>
            <span className="font-medium text-zinc-900">{curr} {fmt(pi.freightCharges)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Other Charges</span>
            <span className="font-medium text-zinc-900">{curr} {fmt(pi.otherCharges)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Round Off</span>
            <span className="font-medium text-zinc-900">{curr} {fmt(pi.roundOff)}</span>
          </div>
          
          <div className="pt-4 mt-2 border-t border-zinc-100">
            <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <span className="font-bold text-zinc-900 text-base">Grand Total</span>
              <span className="font-bold text-xl text-indigo-700">{curr} {fmt(pi.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
