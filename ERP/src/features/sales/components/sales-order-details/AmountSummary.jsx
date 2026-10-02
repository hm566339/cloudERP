import React from 'react';

export default function AmountSummary({ amounts, currency }) {
  if (!amounts) return null;
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const curr = currency || 'INR';

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm w-full h-full flex flex-col justify-end">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-zinc-600">
          <span className="font-medium">Subtotal</span>
          <span className="font-semibold">{fmt(amounts.subtotal)}</span>
        </div>
        
        {amounts.discount > 0 && (
          <div className="flex justify-between items-center text-red-600">
            <span className="font-medium">Discount</span>
            <span className="font-semibold">-{fmt(amounts.discount)}</span>
          </div>
        )}
        
        {amounts.tax > 0 && (
          <div className="flex justify-between items-center text-zinc-600">
            <span className="font-medium">Total Tax</span>
            <span className="font-semibold">{fmt(amounts.tax)}</span>
          </div>
        )}
        
        {amounts.freight > 0 && (
          <div className="flex justify-between items-center text-zinc-600">
            <span className="font-medium">Freight Charges</span>
            <span className="font-semibold">{fmt(amounts.freight)}</span>
          </div>
        )}
        
        {amounts.otherCharges > 0 && (
          <div className="flex justify-between items-center text-zinc-600">
            <span className="font-medium">Other Charges</span>
            <span className="font-semibold">{fmt(amounts.otherCharges)}</span>
          </div>
        )}
        
        {(amounts.roundOff !== 0 && amounts.roundOff !== null) && (
          <div className="flex justify-between items-center text-zinc-500">
            <span className="font-medium">Round Off</span>
            <span className="font-semibold">{amounts.roundOff > 0 ? '+' : ''}{fmt(amounts.roundOff)}</span>
          </div>
        )}
        
        <div className="pt-4 mt-2 border-t border-zinc-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-zinc-900 uppercase tracking-wide">Grand Total</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-500 mr-2">{curr}</span>
              <span className="text-2xl font-black text-indigo-700 tracking-tight">{fmt(amounts.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
