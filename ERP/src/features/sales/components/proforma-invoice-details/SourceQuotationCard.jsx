import React from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    CONFIRMED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    EXPIRED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    CANCELLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  }[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s}
    </span>
  );
};

export default function SourceQuotationCard({ quotation, sourceQuotationId, sourceQuotationNumber }) {
  const navigate = useNavigate();

  if (!quotation && !sourceQuotationNumber) return null;

  const quoteNumber = quotation?.quotationNumber || sourceQuotationNumber;
  const quoteId = quotation?.id || sourceQuotationId;
  const curr = quotation?.currency || 'INR';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          Source Quotation
        </h3>
        {quoteId && (
          <button 
            onClick={() => navigate(`/accounts/transactions/quotations/${quoteId}`)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-zinc-200 shadow-sm px-3 py-1.5 rounded-md transition-colors"
          >
            View Quotation
          </button>
        )}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Quotation No.</p>
            {quoteId ? (
              <span 
                className="font-mono text-sm font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => navigate(`/accounts/transactions/quotations/${quoteId}`)}
              >
                {quoteNumber}
              </span>
            ) : (
              <span className="font-mono text-sm font-semibold text-zinc-900">{quoteNumber}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Date</p>
            <p className="text-sm font-medium text-zinc-900">
              {quotation?.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Status</p>
            <div>
               <StatusBadge status={quotation?.status || 'N/A'} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Valid Till</p>
            <p className="text-sm font-medium text-zinc-900">
              {quotation?.validTill ? new Date(quotation.validTill).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <p className="text-xs font-medium text-zinc-500 mb-1">Total Amount</p>
            <p className="text-sm font-bold text-zinc-900">{curr} {fmt(quotation?.totalAmount)}</p>
          </div>
        </div>

        {quotation && (
          <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-3 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Subtotal</p>
              <p className="text-xs font-medium text-zinc-700">{fmt(quotation.subtotal)}</p>
            </div>
            <div>
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Discount</p>
              <p className="text-xs font-medium text-zinc-700">{fmt(quotation.discountAmount)}</p>
            </div>
            <div>
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Tax</p>
              <p className="text-xs font-medium text-zinc-700">{fmt(quotation.taxAmount)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
