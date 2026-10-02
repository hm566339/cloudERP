import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Loader2, IndianRupee } from 'lucide-react';

/**
 * Modal to confirm and submit an Expense Request Approval
 */
export function ExpenseRequestApproveModal({ isOpen, onClose, request, onConfirm, isLoading = false }) {
  const [approvedAmount, setApprovedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      setApprovedAmount(request.requestedAmount !== undefined ? String(request.requestedAmount) : '');
      setRemarks('');
      setError('');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(approvedAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Approved amount must be greater than zero');
      return;
    }
    if (amt > Number(request.requestedAmount)) {
      setError(`Approved amount cannot exceed requested amount (₹${Number(request.requestedAmount).toLocaleString()})`);
      return;
    }

    onConfirm({
      approvedAmount: amt,
      remarks: remarks.trim() || undefined,
    });
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
              <h2 className="text-sm font-bold text-zinc-900">Approve Request</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{request.requestNumber}</p>
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
              <span className="text-zinc-500">Requester:</span>
              <span className="font-semibold text-zinc-800">{request.requesterName || request.employeeDriverName || 'Staff Member'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Requested Amount:</span>
              <span className="font-bold text-zinc-900">₹{Number(request.requestedAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Approved Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={request.requestedAmount}
                required
                value={approvedAmount}
                onChange={(e) => {
                  setApprovedAmount(e.target.value);
                  setError('');
                }}
                className="w-full h-9 pl-8 pr-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 focus:border-zinc-400 outline-none"
              />
            </div>
            {error && <p className="text-[8.8px] text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Approval Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approved for customer delivery dispatch"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
 * Modal to collect a mandatory reason when Rejecting an Expense Request
 */
export function ExpenseRequestRejectModal({ isOpen, onClose, request, onConfirm, isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    onConfirm({ reason: reason.trim() });
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
              <h2 className="text-sm font-bold text-zinc-900">Reject Request</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{request.requestNumber}</p>
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
            Please provide the reason for rejecting request <span className="font-mono font-bold text-zinc-800">{request.requestNumber}</span>. This reason will be recorded and visible to the requester.
          </p>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Requested amount exceeds approved limit or requires prior management authorization"
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
 * Modal to confirm cancelling an Expense Request
 */
export function ExpenseRequestCancelModal({ isOpen, onClose, request, onConfirm, isLoading = false }) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Cancel Expense Request?</h2>
          <p className="text-xs text-zinc-500">
            Are you sure you want to cancel request <span className="font-mono font-bold text-zinc-800">{request.requestNumber}</span>? This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-lg transition-colors"
          >
            No, Keep Request
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Yes, Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
}
