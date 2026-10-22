import React from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../../../components/common/StatusBadge';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function SourceQuotationCard({ quotation, sourceQuotationId, sourceQuotationNumber }) {
  const navigate = useNavigate();

  if (!quotation && !sourceQuotationNumber) return null;

  const quoteNumber = quotation?.quotationNumber || sourceQuotationNumber;
  const quoteId = quotation?.id || sourceQuotationId;
  const curr = quotation?.currency || 'INR';

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-between">
        <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-2">
          <FileText size={16} className="text-zinc-600 dark:text-[#6B7184]" />
          Source Quotation
        </h3>
        {quoteId && (
          <button 
            onClick={() => navigate(`/accounts/transactions/quotations/${quoteId}`)}
            className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] hover:text-zinc-700 dark:hover:text-[#A0A6B5] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-sm px-3 py-1.5 rounded-md transition-colors"
          >
            View Quotation
          </button>
        )}
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Quotation No.</p>
            {quoteId ? (
              <span 
                className="font-mono text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] cursor-pointer hover:underline"
                onClick={() => navigate(`/accounts/transactions/quotations/${quoteId}`)}
              >
                {quoteNumber}
              </span>
            ) : (
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{quoteNumber}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Date</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
              {quotation?.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Status</p>
            <div>
               <StatusBadge status={quotation?.status || 'N/A'} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Valid Till</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
              {quotation?.validTill ? new Date(quotation.validTill).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Total Amount</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(quotation?.totalAmount)}</p>
          </div>
        </div>

        {quotation && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] grid grid-cols-3 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[8px] font-medium text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-0.5">Subtotal</p>
              <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{fmt(quotation.subtotal)}</p>
            </div>
            <div>
              <p className="text-[8px] font-medium text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-0.5">Discount</p>
              <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{fmt(quotation.discountAmount)}</p>
            </div>
            <div>
              <p className="text-[8px] font-medium text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-0.5">Tax</p>
              <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{fmt(quotation.taxAmount)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
