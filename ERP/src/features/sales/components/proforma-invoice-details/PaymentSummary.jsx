import React from 'react';
import { DollarSign, Receipt } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const PaymentStatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    PARTIALLY_PAID: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    PARTIALLY_RECEIVED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  }[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

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
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
        <DollarSign size={16} className="text-zinc-400" />
        <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Payment & Advance</h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Advance Required</p>
            <p className={`text-sm font-semibold ${paymentSummary.advanceRequired ? 'text-emerald-600' : 'text-zinc-500'}`}>
              {paymentSummary.advanceRequired ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Advance Amount</p>
            <p className="text-sm font-bold text-zinc-900">{currency} {fmt(paymentSummary.advanceAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Received Amount</p>
            <p className="text-sm font-bold text-emerald-700">{currency} {fmt(paymentSummary.receivedAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Payment Status</p>
            <div>
              <PaymentStatusBadge status={paymentSummary.paymentStatus || 'PENDING'} />
            </div>
          </div>
        </div>

        {receipts.length > 0 && (
          <div className="mt-4 border border-zinc-200 rounded-lg overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
              <Receipt size={14} className="text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Receipts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-zinc-600 text-xs">Receipt No</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 text-xs">Date</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 text-xs text-right">Amount</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 text-xs">Payment Mode</th>
                    <th className="px-4 py-2 font-semibold text-zinc-600 text-xs">Reference No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {receipts.map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-zinc-900">{r.receiptNumber || '—'}</td>
                      <td className="px-4 py-2 text-zinc-600">{r.receiptDate ? new Date(r.receiptDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold text-zinc-900">{fmt(r.amount)}</td>
                      <td className="px-4 py-2 text-zinc-600">{r.paymentMode?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 font-mono text-xs">{r.referenceNumber || '—'}</td>
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
