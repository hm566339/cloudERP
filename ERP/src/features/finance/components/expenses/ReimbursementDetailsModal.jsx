import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export default function ReimbursementDetailsModal({ isOpen, onClose, reimbursement }) {
  if (!isOpen || !reimbursement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
              <FileText size={20} className="text-zinc-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Reimbursement Details</h2>
              <p className="text-xs text-zinc-500 font-mono">{reimbursement.reimbursementNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          <div className="grid grid-cols-2 gap-6">
            
            {/* Status & Dates */}
            <div className="space-y-4">
              <div>
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700">
                  {reimbursement.status}
                </span>
              </div>
              
              <div>
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reimbursement Date</span>
                <span className="text-sm font-medium text-zinc-900">{reimbursement.reimbursementDate || '—'}</span>
              </div>

              <div>
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Employee</span>
                <span className="text-sm font-bold text-zinc-900">{reimbursement.employeeName || reimbursement.employeeId || 'Unknown'}</span>
              </div>
            </div>

            {/* Expense Reference & Amounts */}
            <div className="space-y-4">
              <div>
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Expense Claim Ref</span>
                <span className="text-sm font-mono font-semibold text-zinc-700">{reimbursement.expenseClaimNo || '—'}</span>
              </div>
              
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Claim Amount</span>
                  <span className="text-sm font-semibold text-zinc-900">₹{Number(reimbursement.expenseClaimAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Reimbursed</span>
                  <span className="text-sm font-semibold text-emerald-600">₹{Number(reimbursement.reimbursementAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                  <span className="text-xs font-bold text-zinc-700">Balance Due</span>
                  <span className="text-sm font-extrabold text-amber-600">
                    ₹{Math.max(0, Number(reimbursement.expenseClaimAmount || 0) - Number(reimbursement.reimbursementAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-zinc-100 pt-6">
            <h3 className="text-xs font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Method</span>
                <span className="text-xs font-semibold text-zinc-800">{reimbursement.paymentMethod?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Payment Date</span>
                <span className="text-xs font-semibold text-zinc-800">{reimbursement.paymentDate || '—'}</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="block text-[10.4px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reference No.</span>
                <span className="text-xs font-mono text-zinc-800">{reimbursement.paymentReference || '—'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {reimbursement.notes && (
            <div className="border-t border-zinc-100 pt-6">
              <h3 className="text-xs font-bold text-zinc-800 mb-2">Notes & Remarks</h3>
              <p className="text-xs text-zinc-600 whitespace-pre-wrap leading-relaxed p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                {reimbursement.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
