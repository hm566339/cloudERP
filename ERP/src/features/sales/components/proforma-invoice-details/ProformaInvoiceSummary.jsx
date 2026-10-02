import React from 'react';
import { User, FileText, Calendar, Clock, DollarSign, Activity } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ProformaInvoiceSummary({ pi }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
        <div className="flex items-center gap-2 text-zinc-500 mb-2">
          <User size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Customer</span>
        </div>
        <p className="font-semibold text-zinc-900 truncate" title={pi.customerName}>{pi.customerName || '—'}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{pi.customerCode || '—'}</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
        <div className="flex items-center gap-2 text-zinc-500 mb-2">
          <FileText size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Quotation</span>
        </div>
        <p className="font-mono font-semibold text-zinc-900 truncate">{pi.sourceQuotationNumber || pi.quotation?.quotationNumber || 'Direct PI'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
        <div className="flex items-center gap-2 text-zinc-500 mb-2">
          <Calendar size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">PI Date</span>
        </div>
        <p className="font-semibold text-zinc-900">{pi.piDate || '—'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
        <div className="flex items-center gap-2 text-zinc-500 mb-2">
          <Clock size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Valid Till</span>
        </div>
        <p className="font-semibold text-zinc-900">{pi.piValidTill || '—'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 bg-indigo-50/30 border-indigo-100">
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <DollarSign size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Total Amount</span>
        </div>
        <p className="font-bold text-lg text-indigo-900">{pi.currency || 'INR'} {fmt(pi.totalAmount)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
        <div className="flex items-center gap-2 text-zinc-500 mb-2">
          <Activity size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Payment</span>
        </div>
        <p className="font-semibold text-zinc-900">{pi.paymentSummary?.paymentStatus?.replace(/_/g, ' ') || 'PENDING'}</p>
      </div>
    </div>
  );
}
