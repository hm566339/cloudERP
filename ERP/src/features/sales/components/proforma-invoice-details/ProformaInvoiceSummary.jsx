import React from 'react';
import { User, FileText, Calendar, Clock, DollarSign, Activity } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function ProformaInvoiceSummary({ pi }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-[#6B7184] mb-2">
          <User size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Customer</span>
        </div>
        <p className="font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate" title={pi.customerName}>{pi.customerName || '—'}</p>
        <p className="text-xs text-zinc-500 dark:text-[#6B7184] mt-0.5">{pi.customerCode || '—'}</p>
      </div>
      
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-[#6B7184] mb-2">
          <FileText size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Quotation</span>
        </div>
        <p className="font-mono font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">{pi.sourceQuotationNumber || pi.quotation?.quotationNumber || 'Direct PI'}</p>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-[#6B7184] mb-2">
          <Calendar size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">PI Date</span>
        </div>
        <p className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pi.piDate || '—'}</p>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-[#6B7184] mb-2">
          <Clock size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Valid Till</span>
        </div>
        <p className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pi.piValidTill || '—'}</p>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
          <DollarSign size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Total Amount</span>
        </div>
        <p className="font-bold text-lg text-indigo-900 dark:text-indigo-300">{pi.currency || 'INR'} {fmt(pi.totalAmount)}</p>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-[#6B7184] mb-2">
          <Activity size={14} />
          <span className="text-[8.8px] font-bold uppercase tracking-wider">Payment</span>
        </div>
        <p className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pi.paymentSummary?.paymentStatus?.replace(/_/g, ' ') || 'PENDING'}</p>
      </div>
    </div>
  );
}
