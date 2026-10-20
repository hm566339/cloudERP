import React from 'react';
import { User, Briefcase, Info } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function CustomerInformation({ pi }) {
  const curr = pi.currency || 'INR';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <User size={16} className="text-zinc-400" />
          <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Customer Information</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Customer Name</p>
              <p className="text-sm font-semibold text-zinc-900">{pi.customerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Customer Code</p>
              <p className="text-sm font-medium text-zinc-900">{pi.customerCode || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
          <Briefcase size={16} className="text-zinc-400" />
          <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Commercial Information</h3>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Currency</p>
            <p className="text-sm font-semibold text-zinc-900">{pi.currency || 'INR'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Payment Condition</p>
            <p className="text-sm font-medium text-zinc-900">{pi.paymentCondition || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-zinc-500 mb-1">Payment Terms</p>
            <p className="text-sm text-zinc-800">{pi.paymentTerms || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-zinc-500 mb-1">Delivery Terms</p>
            <p className="text-sm text-zinc-800">{pi.deliveryTerms || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Advance Required</p>
            <p className={`text-sm font-semibold ${pi.advanceRequired ? 'text-emerald-600' : 'text-zinc-500'}`}>
              {pi.advanceRequired ? 'Yes' : 'No'}
            </p>
          </div>
          {pi.advanceRequired && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Advance Amount</p>
              <p className="text-sm font-bold text-zinc-900">{curr} {fmt(pi.advanceAmount)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
