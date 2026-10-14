import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function ActionReasonModal({ isOpen, onClose, onSubmit, actionType, loading }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 bg-zinc-50/50">
          <h2 className="text-lg font-bold text-zinc-900 leading-tight">{actionType} Purchase Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
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
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">{actionType} Reason *</label>
            <textarea
              required
              disabled={loading}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Enter ${actionType?.toLowerCase()} reason`}
              rows={4}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none disabled:opacity-60 disabled:bg-zinc-50"
            />
          </form>
        </div>
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-60 disabled:hover:bg-white"
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
