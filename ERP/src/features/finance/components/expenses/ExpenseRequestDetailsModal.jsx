import React, { useState, useEffect } from 'react';
import {
  X, ClipboardList, Calendar, User, Tag, IndianRupee, Clock, CheckCircle2,
  XCircle, Ban, Edit3, Send, ArrowRight, Truck, ShoppingCart, Info, Loader2, AlertCircle
} from 'lucide-react';
import { expenseRequestsApi } from '../../../../api/account';
import { employeeDriverService } from '../../services/employeeDriverService';

const STATUS_BADGE = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
  DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-[#222736] dark:text-[#A0A6B5] dark:border-[#2A2F3D]',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
  CANCELLED: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-[#222736] dark:text-[#6B7184] dark:border-[#2A2F3D]',
  CONVERTED_TO_EXPENSE: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
};

export default function ExpenseRequestDetailsModal({
  isOpen,
  onClose,
  requestId,
  initialRequest = null,
  onEdit,
  onSubmitForApproval,
  onApprove,
  onReject,
  onCancel,
  onConvertToExpense,
  actionLoading = false,
}) {
  const [request, setRequest] = useState(initialRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedPersonName, setResolvedPersonName] = useState('');

  useEffect(() => {
    const personId = request?.employeeDriverId || request?.requesterId;
    if (personId) {
      const cached = employeeDriverService.getCachedPersonName(personId);
      if (cached) {
        setResolvedPersonName(cached);
      } else {
        employeeDriverService.resolvePersonName(personId).then((name) => {
          if (name) setResolvedPersonName(name);
        });
      }
    } else {
      setResolvedPersonName('');
    }
  }, [request?.employeeDriverId, request?.requesterId]);

  useEffect(() => {
    if (isOpen && requestId) {
      // If we have initial data, show it immediately while loading fresh details
      if (initialRequest && (initialRequest.id === requestId || initialRequest.requestNumber === requestId)) {
        setRequest(initialRequest);
      }
      setLoading(true);
      setError(null);
      expenseRequestsApi.getById(requestId)
        .then((res) => {
          const detail = res?.data || res;
          setRequest(detail);
        })
        .catch((err) => {
          console.error('Failed to load expense request details:', err);
          setError(err?.response?.data?.message || err.message || 'Failed to load request details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isOpen) {
      setRequest(null);
      setError(null);
    }
  }, [isOpen, requestId, initialRequest]);

  if (!isOpen) return null;

  const currentStatus = (request?.status || '').toUpperCase();
  const isDraft = currentStatus === 'DRAFT';
  const isPending = currentStatus === 'PENDING_APPROVAL';
  const isApproved = currentStatus === 'APPROVED';
  const isRejected = currentStatus === 'REJECTED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-blue-600 text-white flex items-center justify-center">
              <ClipboardList size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] font-mono">
                  {request?.requestNumber || 'Loading...'}
                </h2>
                {request?.status && (
                  <span className={`px-2 py-0.5 rounded text-[8.8px] font-bold border ${STATUS_BADGE[currentStatus] || 'bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]'}`}>
                    {request.status.replace(/_/g, ' ')}
                  </span>
                )}
                {request?.requestType && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-semibold bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                    {request.requestType === 'ADVANCE_REQUEST' ? 'Advance Request' : 'Expense Request'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#6B7184]">Expense authorization and reimbursement tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0 text-xs">
          {loading && !request ? (
            <div className="p-12 flex flex-col items-center justify-center text-zinc-400 dark:text-[#6B7184]">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-xs font-medium">Fetching expense request details...</p>
            </div>
          ) : error && !request ? (
            <div className="p-8 text-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="mx-auto mb-2" size={24} />
              <p className="font-semibold text-xs">{error}</p>
            </div>
          ) : request ? (
            <>
              {/* Amounts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D]">
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                    Requested Amount
                  </span>
                  <span className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] mt-0.5 block">
                    ₹{Number(request.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                    Approved Amount
                  </span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {request.approvedAmount != null
                      ? `₹${Number(request.approvedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </div>
                {request.requiresAdvance && (
                  <div>
                    <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                      Advance Disbursed
                    </span>
                    <span className="text-base font-bold text-purple-700 dark:text-purple-400 mt-0.5 block">
                      ₹{Number(request.advanceAmount || request.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]">
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} /> Request Date
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{request.date || '—'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                    <User size={11} /> Employee / Driver
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">
                    {request.employeeDriverName || request.requesterName || resolvedPersonName || (request.roleType === 'DRIVER' ? 'Driver' : 'Employee')}
                  </span>
                  {request.roleType && (
                    <span className="text-[8px] text-zinc-400 dark:text-[#6B7184] block capitalize">
                      {request.roleType.toLowerCase()}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                    <Tag size={11} /> Category
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{request.categoryName || 'General'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} /> Approval Status
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                    {request.approvalStatus || request.status || 'DRAFT'}
                  </span>
                </div>
              </div>

              {/* Purpose & Notes */}
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block mb-1">
                    Purpose / Description
                  </span>
                  <p className="text-zinc-800 dark:text-[#E6E8EE] whitespace-pre-wrap leading-relaxed">
                    {request.purposeDescription || 'No description provided'}
                  </p>
                </div>

                {request.additionalNotes && (
                  <div className="p-3 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
                    <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block mb-1">
                      Additional Notes
                    </span>
                    <p className="text-zinc-600 dark:text-[#A0A6B5] whitespace-pre-wrap leading-relaxed">
                      {request.additionalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Operational References */}
              {(request.salesOrderId || request.deliveryChallanId || request.vehicleNumber || request.claimId) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-zinc-50/50 dark:bg-[#1D212C] rounded-xl border border-zinc-100 dark:border-[#2A2F3D]">
                  {request.salesOrderId && (
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                        <ShoppingCart size={11} /> Sales Order
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-[#A0A6B5] text-[8.8px] truncate block" title={request.salesOrderId}>
                        {request.salesOrderId}
                      </span>
                    </div>
                  )}
                  {request.deliveryChallanId && (
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider flex items-center gap-1">
                        <Truck size={11} /> Delivery Challan
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-[#A0A6B5] text-[8.8px] truncate block" title={request.deliveryChallanId}>
                        {request.deliveryChallanId}
                      </span>
                    </div>
                  )}
                  {request.vehicleNumber && (
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                        Vehicle Number
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{request.vehicleNumber}</span>
                    </div>
                  )}
                  {request.claimId && (
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                        Claim Ref
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-[#A0A6B5] text-[8.8px] truncate block" title={request.claimId}>
                        {request.claimId}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Approval / Rejection Audit Info */}
              {isApproved && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-emerald-900 dark:text-emerald-200 space-y-0.5">
                    <p className="font-semibold text-xs">Approved</p>
                    <p className="text-[8.8px] text-emerald-700 dark:text-emerald-400">
                      Approved At: {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : '—'}
                      {request.approvedBy && ` by ${request.approvedBy}`}
                    </p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5">
                  <XCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-rose-900 dark:text-rose-200 space-y-0.5">
                    <p className="font-semibold text-xs">Rejected</p>
                    <p className="text-[8.8px] text-rose-800 dark:text-rose-300 font-medium">
                      Reason: {request.rejectionReason || 'No reason provided'}
                    </p>
                    <p className="text-[8px] text-rose-600 dark:text-rose-400">
                      Rejected At: {request.rejectedAt ? new Date(request.rejectedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="p-3 bg-zinc-100 dark:bg-[#1D212C] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] flex items-start gap-2.5">
                  <Ban size={16} className="text-zinc-500 dark:text-[#A0A6B5] shrink-0 mt-0.5" />
                  <div className="text-zinc-700 dark:text-[#E6E8EE] space-y-0.5">
                    <p className="font-semibold text-xs">Cancelled</p>
                    <p className="text-[8.8px] text-zinc-500 dark:text-[#A0A6B5]">This expense request was cancelled and cannot be processed further.</p>
                  </div>
                </div>
              )}

              {/* Meta Timestamps */}
              <div className="flex flex-wrap items-center justify-between text-[8.8px] text-zinc-400 dark:text-[#6B7184] pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
                <span>Created: {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}</span>
                <span>Updated: {request.updatedAt ? new Date(request.updatedAt).toLocaleString() : '—'}</span>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions Based on Status */}
        {request && (
          <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {/* DRAFT Actions */}
              {isDraft && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(request);
                    }}
                    disabled={actionLoading}
                    className="h-8 px-3 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#161922] hover:bg-zinc-100 dark:hover:bg-[#222736] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 size={13} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onCancel && onCancel(request)}
                    disabled={actionLoading}
                    className="h-8 px-3 text-xs font-semibold text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Ban size={13} /> Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onSubmitForApproval && onSubmitForApproval(request)}
                    disabled={actionLoading}
                    className="h-8 px-3.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Submit for Approval
                  </button>
                </>
              )}

              {/* PENDING_APPROVAL Actions */}
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={() => onReject && onReject(request)}
                    disabled={actionLoading}
                    className="h-8 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <XCircle size={13} /> Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => onCancel && onCancel(request)}
                    disabled={actionLoading}
                    className="h-8 px-3 text-xs font-semibold text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Ban size={13} /> Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onApprove && onApprove(request)}
                    disabled={actionLoading}
                    className="h-8 px-3.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Approve
                  </button>
                </>
              )}

              {/* APPROVED Actions */}
              {isApproved && onConvertToExpense && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConvertToExpense(request);
                  }}
                  className="h-8 px-3.5 text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#222736] hover:bg-zinc-200 dark:hover:bg-[#2A2F3D] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  Record Expense <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
