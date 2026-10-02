import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Loader2, Trash2 } from 'lucide-react';

/**
 * Modal to confirm and submit a Reimbursement Approval
 */
export function ReimbursementApproveModal({ isOpen, onClose, reimbursement, onConfirm, isLoading = false }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !reimbursement) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Approve Reimbursement</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{reimbursement.reimbursementNo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Reimbursement Amount:</span>
              <span className="font-bold text-zinc-900">₹{Number(reimbursement.reimbursementAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Approval Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:border-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-8 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Confirm Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to collect a mandatory reason when Rejecting a Reimbursement
 */
export function ReimbursementRejectModal({ isOpen, onClose, reimbursement, onConfirm, isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !reimbursement) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    onConfirm({ rejectionReason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Reject Reimbursement</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{reimbursement.reimbursementNo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-zinc-600">
            Please provide the reason for rejecting reimbursement <span className="font-mono font-bold text-zinc-800">{reimbursement.reimbursementNo}</span>.
          </p>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Non-compliant bill or missing details"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:border-zinc-400 outline-none"
            />
            {error && <p className="text-[8.8px] text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-8 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to confirm cancelling a Reimbursement
 */
export function ReimbursementCancelModal({ isOpen, onClose, reimbursement, onConfirm, isLoading = false }) {
  if (!isOpen || !reimbursement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Cancel Reimbursement?</h2>
          <p className="text-xs text-zinc-500">
            Are you sure you want to cancel <span className="font-mono font-semibold">{reimbursement.reimbursementNo}</span>? This action will set its status to CANCELLED.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            No, keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal to confirm deleting a Reimbursement
 */
export function ReimbursementDeleteModal({ isOpen, onClose, reimbursement, onConfirm, isLoading = false }) {
  if (!isOpen || !reimbursement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 size={20} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Delete Reimbursement?</h2>
          <p className="text-xs text-zinc-500">
            Are you sure you want to permanently delete <span className="font-mono font-semibold">{reimbursement.reimbursementNo}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
