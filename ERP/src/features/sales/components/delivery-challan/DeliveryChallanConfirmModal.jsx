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
      <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-[#2A2F3D]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 dark:border-[#2A2F3D] bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/40 dark:to-[#161922]">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">Delivery Confirmation</h3>
            {dcNumber && (
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5 font-mono">{dcNumber}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-700 dark:text-[#E6E8EE] leading-relaxed">
            Delivery Challan created successfully. Do you want to{' '}
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">confirm</span> this Delivery Challan?
          </p>
          <p className="text-xs text-zinc-400 dark:text-[#A0A6B5] mt-2">
            Confirming will change the status from{' '}
            <span className="font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">DRAFT</span> to{' '}
            <span className="font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">CONFIRMED</span>{' '}
            and dispatch the inventory.
          </p>

          {/* Error message */}
          {confirmError && (
            <div className="mt-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-lg">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{confirmError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 dark:bg-[#1D212C] border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onCancelDraft}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors disabled:opacity-50"
          >
            No, Keep as Draft
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-[#4C8DFF] rounded-lg hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
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
