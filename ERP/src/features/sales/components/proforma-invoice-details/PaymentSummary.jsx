import React from 'react';
import { DollarSign, Receipt } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const PaymentStatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    PARTIALLY_PAID: { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-[#4C8DFF] dark:border-blue-500/20', dot: 'bg-blue-500' },
    PARTIALLY_RECEIVED: { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-[#4C8DFF] dark:border-blue-500/20', dot: 'bg-blue-500' },
    PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-[#F5B544] dark:border-amber-500/20', dot: 'bg-amber-500' },
  }[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]', dot: 'bg-zinc-400' };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s.replace(/_/g, ' ')}
    </span>
  );
};

export default function PaymentSummary({ paymentSummary, currency = 'INR' }) {
  if (!paymentSummary) return null;
  
  const receipts = paymentSummary.receipts || [];

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center gap-2">
        <DollarSign size={16} className="text-zinc-400 dark:text-[#6B7184]" />
        <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Payment & Advance</h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Advance Required</p>
            <p className={`text-sm font-semibold ${paymentSummary.advanceRequired ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-[#6B7184]'}`}>
              {paymentSummary.advanceRequired ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Advance Amount</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{currency} {fmt(paymentSummary.advanceAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Received Amount</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{currency} {fmt(paymentSummary.receivedAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Payment Status</p>
            <div>
              <PaymentStatusBadge status={paymentSummary.paymentStatus || 'PENDING'} />
            </div>
          </div>
        </div>

        {receipts.length > 0 && (
          <div className="mt-4 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
            <div className="bg-zinc-50 dark:bg-[#1D212C] px-4 py-2 border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center gap-2">
              <Receipt size={14} className="text-zinc-500 dark:text-[#6B7184]" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider">Receipts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-xs">Receipt No</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-xs">Date</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-xs text-right">Amount</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-xs">Payment Mode</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-xs">Reference No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                  {receipts.map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                      <td className="px-4 py-2 font-medium text-zinc-900 dark:text-[#E6E8EE]">{r.receiptNumber || '—'}</td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-[#A0A6B5]">{r.receiptDate ? new Date(r.receiptDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold text-zinc-900 dark:text-[#E6E8EE]">{fmt(r.amount)}</td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-[#A0A6B5]">{r.paymentMode?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 dark:text-[#6B7184] font-mono text-xs">{r.referenceNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
