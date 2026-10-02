import React from 'react';
import { Package } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ProformaInvoiceItems({ items, currency = 'INR' }) {
  const lineItems = items || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} className="text-zinc-400" />
          Items
        </h3>
        <span className="text-xs font-semibold text-zinc-500 bg-white px-2.5 py-1 rounded-md border border-zinc-200 shadow-sm">
          {lineItems.length} items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white border-b border-zinc-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs w-12 text-center">#</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs">Item Details</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Qty</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs">Unit</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Unit Price</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Discount</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Taxable</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Tax</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {lineItems.length > 0 ? (
              lineItems.map((it, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 text-center text-zinc-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-zinc-900">{it.itemName || '—'}</div>
                    <div className="text-[8.8px] text-zinc-500 mt-0.5">{it.description || ''}</div>
                    {it.hsnSacCode && (
                      <div className="text-[8px] text-zinc-400 font-mono mt-1">HSN/SAC: {it.hsnSacCode}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-zinc-900">{it.quantity || 0}</td>
                  <td className="px-5 py-3 text-zinc-600">{it.unit || '—'}</td>
                  <td className="px-5 py-3 text-right text-zinc-700">{fmt(it.unitPrice)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="text-zinc-700">{fmt(it.discountAmount || 0)}</div>
                    {it.discountPercent > 0 && <div className="text-[8px] text-zinc-400">({it.discountPercent}%)</div>}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-700">{fmt(it.taxableAmount || 0)}</td>
                  <td className="px-5 py-3 text-right text-zinc-700">{fmt(it.taxAmount || 0)}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-900">{fmt(it.totalAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-zinc-400">
                  No items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
