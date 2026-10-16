import React from 'react';
import { ArrowLeft, Edit, Printer, Send, ShoppingCart, XCircle, ChevronDown, Check } from 'lucide-react';
import StatusBadge from '../../../../components/common/StatusBadge';

export default function ProformaInvoiceHeader({
  pi,
  canEdit,
  canApprove,
  isUpdating,
  onBack,
  onEdit,
  onSend,
  onConfirm,
  onCreateSO,
  onCancel
}) {
  const [showMoreActions, setShowMoreActions] = React.useState(false);

  return (
    <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
          <span className="hover:text-zinc-700 cursor-pointer" onClick={onBack}>Accounts</span>
          <span>/</span>
          <span className="hover:text-zinc-700 cursor-pointer" onClick={onBack}>Transactions</span>
          <span>/</span>
          <span className="hover:text-zinc-700 cursor-pointer" onClick={onBack}>Proforma Invoices</span>
          <span>/</span>
          <span className="text-zinc-900">{pi.piNumber}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {pi.piNumber}
              </h1>
              <StatusBadge status={pi.status} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 relative">
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
          <Printer size={16} /> <span className="hidden sm:inline">Print</span>
        </button>
        
        {pi.status === 'DRAFT' && canEdit() && (
          <>
            <button onClick={onEdit} disabled={isUpdating} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <Edit size={16} /> Edit
            </button>
            <button onClick={onSend} disabled={isUpdating} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors">
              <Send size={16} /> Mark as Sent
            </button>
          </>
        )}
        {pi.status === 'SENT' && canApprove() && (
          <button onClick={onConfirm} disabled={isUpdating} className="btn-primary flex items-center gap-2 h-9 px-4 text-[10.4px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors border border-transparent shadow-sm">
            <Check size={16} /> Mark Confirmed
          </button>
        )}
        {pi.status === 'CONFIRMED' && (
          <button onClick={onCreateSO} disabled={isUpdating} className="btn-primary flex items-center gap-2 h-9 px-4 text-[10.4px] bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors border border-transparent shadow-sm">
            <ShoppingCart size={16} /> Create Sales Order
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMoreActions(prev => !prev)}
            className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <span>More Actions</span>
            <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
          </button>
          {showMoreActions && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-2"
              onClick={() => setShowMoreActions(false)}
            >
              {['DRAFT', 'SENT', 'CONFIRMED'].includes(pi.status) && canEdit() && (
                <button onClick={onCancel} disabled={isUpdating} className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-red-500 font-medium border-t border-zinc-100">
                  <XCircle size={14} /> Cancel PI
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
