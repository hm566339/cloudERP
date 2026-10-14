import React from 'react';
import { ArrowLeft, Edit, FileText, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SalesOrderHeader({
  salesOrder,
  onGenerateInvoice,
  onGenerateDeliveryChallan
}) {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'CONFIRMED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          Back to Sales Orders
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
            {salesOrder.soNumber || salesOrder.orderNumber || salesOrder.id}
          </h1>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusColor(salesOrder.status)}`}>
            {salesOrder.status || 'DRAFT'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {salesOrder.status === 'CONFIRMED' && (
          <>
            <button
              onClick={onGenerateDeliveryChallan}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
            >
              <Truck size={16} />
              Generate Delivery Challan
            </button>
            <button
              onClick={onGenerateInvoice}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2"
            >
              <FileText size={16} />
              Generate Invoice
            </button>
          </>
        )}
        <button className="p-2 text-zinc-400 hover:text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all shadow-sm">
          <Edit size={18} />
        </button>
      </div>
    </div>
  );
}
