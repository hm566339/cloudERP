import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function DeliveryChallanConfirmModal({
  isOpen,
  dcNumber,
  isConfirming,
  confirmError,
  onCancelDraft,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">Delivery Confirmation</h3>
            {dcNumber && (
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">{dcNumber}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-700 leading-relaxed">
            Delivery Challan created successfully. Do you want to{' '}
            <span className="font-semibold text-indigo-700">confirm</span> this Delivery Challan?
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Confirming will change the status from{' '}
            <span className="font-semibold uppercase tracking-wide text-amber-600">DRAFT</span> to{' '}
            <span className="font-semibold uppercase tracking-wide text-emerald-600">CONFIRMED</span>{' '}
            and dispatch the inventory.
          </p>

          {/* Error message */}
          {confirmError && (
            <div className="mt-4 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs text-red-700 font-medium">{confirmError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onCancelDraft}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            No, Keep as Draft
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Yes, Confirm Delivery</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
