import React from 'react';
import { Package, HelpCircle } from 'lucide-react';

export default function SalesOrderItems({ items, currency }) {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const curr = currency || 'INR';

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/80">
        <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} className="text-indigo-500" />
          Order Items
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs">Product Details</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Quantity</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Unit Price</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Discount</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Taxes</th>
              <th className="px-5 py-3 font-semibold text-zinc-600 text-xs text-right">Total ({curr})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item, idx) => {
              const pricing = item.pricing || {};
              const taxes = item.taxes || {};
              const totalDiscount = pricing.discountAmount > 0 
                ? pricing.discountAmount 
                : (pricing.discountPercent > 0 ? (pricing.unitPrice * item.quantity * pricing.discountPercent) / 100 : 0);
              
              return (
                <tr key={item.id || idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                          <span className="font-bold text-xs">{idx + 1}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-[12px]">{item.item?.name || '—'}</p>
                        {item.description && (
                          <p className="text-xs text-zinc-500 mt-1 max-w-[200px] whitespace-normal">
                            {item.description}
                          </p>
                        )}
                        {item.fulfillment?.warehouseId && (
                          <div className="mt-1.5 flex items-center gap-1 text-[8px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 inline-block w-fit">
                            Warehouse Fulfillment
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="font-bold text-zinc-900">{fmt(item.quantity)}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.unit || 'Nos'}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-zinc-700">
                    {fmt(pricing.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {totalDiscount > 0 ? (
                      <div>
                        <span className="font-medium text-red-600">-{fmt(totalDiscount)}</span>
                        {pricing.discountPercent > 0 && (
                          <span className="text-[8px] text-zinc-500 block">({pricing.discountPercent}%)</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {taxes.taxAmount > 0 ? (
                      <div className="group relative inline-block">
                        <div className="font-medium text-zinc-700 flex items-center justify-end gap-1 cursor-help">
                          {fmt(taxes.taxAmount)}
                          <HelpCircle size={14} className="text-zinc-400" />
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-zinc-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          {taxes.cgstAmount > 0 && <div className="flex justify-between py-1"><span>CGST:</span> <span>{fmt(taxes.cgstAmount)}</span></div>}
                          {taxes.sgstAmount > 0 && <div className="flex justify-between py-1"><span>SGST:</span> <span>{fmt(taxes.sgstAmount)}</span></div>}
                          {taxes.igstAmount > 0 && <div className="flex justify-between py-1"><span>IGST:</span> <span>{fmt(taxes.igstAmount)}</span></div>}
                          {taxes.cessAmount > 0 && <div className="flex justify-between py-1 border-t border-zinc-700 mt-1 pt-1"><span>CESS:</span> <span>{fmt(taxes.cessAmount)}</span></div>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-400">Exempt</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-zinc-900 text-[12px]">
                    {fmt(item.totalAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
