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
    <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">
          <span className="hover:text-zinc-700 dark:hover:text-[#A0A6B5] cursor-pointer" onClick={onBack}>Accounts</span>
          <span>/</span>
          <span className="hover:text-zinc-700 dark:hover:text-[#A0A6B5] cursor-pointer" onClick={onBack}>Transactions</span>
          <span>/</span>
          <span className="hover:text-zinc-700 dark:hover:text-[#A0A6B5] cursor-pointer" onClick={onBack}>Proforma Invoices</span>
          <span>/</span>
          <span className="text-zinc-900 dark:text-[#E6E8EE]">{pi.piNumber}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-900 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight font-mono">
                {pi.piNumber}
              </h1>
              <StatusBadge status={pi.status} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 relative">
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
          <Printer size={16} /> <span className="hidden sm:inline">Print</span>
        </button>
        
        {pi.status === 'DRAFT' && canEdit() && (
          <>
            <button onClick={onEdit} disabled={isUpdating} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
              <Edit size={16} /> Edit
            </button>
            <button onClick={onSend} disabled={isUpdating} className="btn-secondary flex items-center gap-2 h-9 px-3 text-[10.4px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-[#4C8DFF] border border-blue-200 dark:border-blue-500/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:border-blue-300 transition-colors">
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
          <button onClick={onCreateSO} disabled={isUpdating} className="btn-primary flex items-center gap-2 h-9 px-4 text-[10.4px] bg-zinc-900 dark:bg-[#4C8DFF] hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] text-white rounded-lg transition-colors border border-transparent shadow-sm">
            <ShoppingCart size={16} /> Create Sales Order
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMoreActions(prev => !prev)}
            className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-[10.4px] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            <span>More Actions</span>
            <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
          </button>
          {showMoreActions && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-lg z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-2"
              onClick={() => setShowMoreActions(false)}
            >
              {['DRAFT', 'SENT', 'CONFIRMED'].includes(pi.status) && canEdit() && (
                <button onClick={onCancel} disabled={isUpdating} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 text-red-500 dark:text-red-400 font-medium border-t border-zinc-100 dark:border-[#2A2F3D]">
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
