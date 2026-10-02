import React from 'react';
import { Calendar, FileCheck, CircleDollarSign, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SalesOrderSummary({ salesOrder }) {
  const navigate = useNavigate();

  const handleSourceNavigation = () => {
    if (!salesOrder?.source) return;
    
    if (salesOrder.source.type === 'PROFORMA_INVOICE' && salesOrder.source.proformaInvoice?.id) {
      navigate(`/accounts/transactions/proforma-invoices/${salesOrder.source.proformaInvoice.id}`);
    } else if (salesOrder.source.type === 'QUOTATION' && salesOrder.source.quotation?.id) {
      navigate(`/accounts/transactions/quotations/${salesOrder.source.quotation.id}`);
    }
  };

  const getSourceDisplay = () => {
    if (!salesOrder?.source) return { text: 'Direct Order', number: '—' };
    
    if (salesOrder.source.type === 'PROFORMA_INVOICE') {
      return { 
        text: 'Proforma Invoice', 
        number: salesOrder.source.proformaInvoice?.number || '—',
        clickable: !!salesOrder.source.proformaInvoice?.id
      };
    }
    
    if (salesOrder.source.type === 'QUOTATION') {
      return { 
        text: 'Quotation', 
        number: salesOrder.source.quotation?.number || '—',
        clickable: !!salesOrder.source.quotation?.id
      };
    }

    return { text: 'Direct Order', number: '—' };
  };

  const sourceInfo = getSourceDisplay();

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
          <Calendar size={14} />
          <span className="text-[8px] font-bold uppercase tracking-wider">Order Date</span>
        </div>
        <span className="text-sm font-semibold text-zinc-900">
          {salesOrder.soDate ? new Date(salesOrder.soDate).toLocaleDateString('en-GB') : '—'}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
          <CircleDollarSign size={14} />
          <span className="text-[8px] font-bold uppercase tracking-wider">Currency</span>
        </div>
        <span className="text-sm font-semibold text-zinc-900">{salesOrder.currency || 'INR'}</span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
          <FileCheck size={14} />
          <span className="text-[8px] font-bold uppercase tracking-wider">Source Origin</span>
        </div>
        <span className="text-sm font-semibold text-zinc-900">{sourceInfo.text}</span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
          <Hash size={14} />
          <span className="text-[8px] font-bold uppercase tracking-wider">Source Number</span>
        </div>
        {sourceInfo.clickable ? (
          <span 
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-all"
            onClick={handleSourceNavigation}
          >
            {sourceInfo.number}
          </span>
        ) : (
          <span className="text-sm font-semibold text-zinc-900">{sourceInfo.number}</span>
        )}
      </div>
    </div>
  );
}
