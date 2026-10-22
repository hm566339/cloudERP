import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function ActionReasonModal({ isOpen, onClose, onSubmit, actionType, loading }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-[#2A2F3D]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE] leading-tight">{actionType} Purchase Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <form
            id="action-reason-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(reason);
            }}
          >
            <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5">{actionType} Reason *</label>
            <textarea
              required
              disabled={loading}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Enter ${actionType?.toLowerCase()} reason`}
              rows={4}
              className="w-full px-3 py-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-[#161922]"
            />
          </form>
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-[#E6E8EE] transition-colors disabled:opacity-60 disabled:hover:bg-white dark:disabled:hover:bg-[#1D212C]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="action-reason-form"
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm border border-rose-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-60 disabled:hover:bg-rose-600"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : `${actionType} Purchase Order`}
          </button>
        </div>
      </div>
    </div>
  );
}
