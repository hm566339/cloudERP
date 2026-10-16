import React, { useState, useEffect, useCallback } from 'react';
import { 
  Check, X, RotateCcw, Send, Ban, ArrowRight, UserCheck, CheckCircle2, Loader2, FileText 
} from 'lucide-react';
import { documentFlowApi } from '../../../api/common/documentFlow.api';
import apiClient from '../../../api/common/client';

/**
 * Universal Workflow-Driven Action Buttons and Document Transitions Component.
 */
export default function WorkflowActionButtons({
  module = 'SALES',
  documentType,
  documentId,
  documentStatus,
  onActionComplete,
  onConvert,
  className = ''
}) {
  const [uiState, setUiState] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const loadData = useCallback(async () => {
    if (!documentType || !documentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const [uiRes, transRes] = await Promise.allSettled([
        documentFlowApi.getDocumentWorkflowUi(documentType, documentId),
        documentFlowApi.getTransitions(module, documentType)
      ]);

      if (uiRes.status === 'fulfilled' && uiRes.value) {
        setUiState(uiRes.value);
      }
      if (transRes.status === 'fulfilled' && Array.isArray(transRes.value)) {
        setTransitions(transRes.value);
      }
    } catch (err) {
      console.warn('Failed to load workflow action state:', err);
    } finally {
      setLoading(false);
    }
  }, [module, documentType, documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const permittedActions = uiState?.permittedActions?.availableActions || [];
  const taskId = uiState?.tasks?.[0]?.id;
  const isDocApproved = documentStatus === 'APPROVED' || uiState?.transaction?.status === 'APPROVED';

  // Handle Workflow Actions (Submit, Approve, Reject, Return, Cancel)
  const handleConfirmAction = async () => {
    if (!activeModal) return;
    setSubmittingAction(true);
    setErrorMsg(null);

    try {
      if (activeModal === 'SUBMIT') {
        // Submit document to workflow
        await apiClient.post('/api/v1/workflow/transactions/submit', {
          data: {
            documentType,
            documentId,
            moduleName: module,
            comments: commentText || 'Submitted for workflow approval'
          }
        });
      } else if (activeModal === 'APPROVE' && taskId) {
        await apiClient.post(`/api/v1/workflow/tasks/${taskId}/approve`, {
          data: { comment: commentText }
        });
      } else if (activeModal === 'REJECT' && taskId) {
        await apiClient.post(`/api/v1/workflow/tasks/${taskId}/reject`, {
          data: { reason: commentText || 'Rejected in workflow' }
        });
      } else if (activeModal === 'RETURN' && taskId) {
        await apiClient.post(`/api/v1/workflow/tasks/${taskId}/return`, {
          data: { reason: commentText || 'Returned for revision' }
        });
      } else if (activeModal === 'CANCEL' && uiState?.transaction?.id) {
        await apiClient.post(`/api/v1/workflow/transactions/${uiState.transaction.id}/cancel`, {
          data: { reason: commentText || 'Cancelled' }
        });
      } else if (activeModal === 'ACCEPT_BY_CUSTOMER') {
        // Customer Acceptance simulation/call
        if (documentType === 'QUOTATION') {
          await apiClient.post(`/api/account/sales/quotations/${documentId}/customer-accept`, {
            remarks: commentText || 'Accepted by customer'
          }).catch(() => {
            // Fallback to quotation status update if endpoint alias differs
            return apiClient.patch(`/api/account/sales/quotations/${documentId}/status`, {
              status: 'ACCEPTED'
            });
          });
        }
      }

      setActiveModal(null);
      setCommentText('');
      await loadData();
      onActionComplete?.();
    } catch (err) {
      console.error('Workflow action failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Document Conversion
  const handleTransitionClick = async (transition) => {
    if (onConvert) {
      onConvert(transition);
      return;
    }

    setSubmittingAction(true);
    setErrorMsg(null);
    try {
      const targetType = transition.targetDocumentType;
      if (transition.conversionEndpoint) {
        const endpoint = transition.conversionEndpoint.replace('{id}', documentId);
        await apiClient.post(endpoint);
      } else if (documentType === 'QUOTATION' && targetType === 'SALES_ORDER') {
        await apiClient.post(`/api/account/sales/orders/from-quotation/${documentId}`);
      } else if (documentType === 'QUOTATION' && targetType === 'PROFORMA_INVOICE') {
        await apiClient.post(`/api/account/v1/proforma-invoices/from-quotation/${documentId}`);
      } else if (documentType === 'PROFORMA_INVOICE' && targetType === 'SALES_ORDER') {
        await apiClient.post(`/api/account/sales/orders/from-proforma-invoice/${documentId}`);
      } else if (documentType === 'SALES_ORDER' && targetType === 'DELIVERY_CHALLAN') {
        await apiClient.post('/api/account/delivery-challans/from-sales-order', { salesOrderId: documentId });
      } else if (documentType === 'SALES_ORDER' && targetType === 'SALES_INVOICE') {
        await apiClient.post(`/api/account/sales/orders/${documentId}/generate-invoice`);
      } else if (documentType === 'PURCHASE_ORDER' && targetType === 'GOODS_RECEIPT') {
        await apiClient.post(`/api/account/goods-receipts/from-po/${documentId}`);
      } else if (documentType === 'SUPPLIER_QUOTATION' && targetType === 'PURCHASE_ORDER') {
        await apiClient.post(`/api/account/purchase/orders/from-quotation/${documentId}`);
      } else if (documentType === 'GOODS_RECEIPT' && targetType === 'AP_INVOICE') {
        await apiClient.post(`/api/account/v1/ap-invoices/from-grn/${documentId}`);
      } else {
        throw new Error(`Direct automated conversion from ${documentType} to ${targetType} is not configured.`);
      }

      await loadData();
      onActionComplete?.();
    } catch (err) {
      console.error('Document conversion failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Conversion failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
        <Loader2 size={14} className="animate-spin" />
        Checking workflow and transition permissions...
      </div>
    );
  }

  const hasPermittedActions = permittedActions.length > 0;
  const hasTransitions = transitions.length > 0 && isDocApproved;

  if (!hasPermittedActions && !hasTransitions && !errorMsg) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-xs ${className}`}>
      {/* Status & Alerts */}
      <div className="flex items-center gap-2">
        {uiState?.currentStage && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Stage: {uiState.currentStage.stageName || uiState.currentStage.name}
          </div>
        )}
        {errorMsg && (
          <span className="text-xs text-red-600 font-medium">{errorMsg}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Submit */}
        {permittedActions.includes('SUBMIT') && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('SUBMIT')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Send size={13} />
            Submit for Approval
          </button>
        )}

        {/* Approve */}
        {permittedActions.includes('APPROVE') && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('APPROVE')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Check size={13} strokeWidth={2.5} />
            Approve
          </button>
        )}

        {/* Reject */}
        {permittedActions.includes('REJECT') && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('REJECT')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <X size={13} strokeWidth={2.5} />
            Reject
          </button>
        )}

        {/* Return */}
        {permittedActions.includes('RETURN') && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('RETURN')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Return for Revision
          </button>
        )}

        {/* Cancel */}
        {permittedActions.includes('CANCEL') && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('CANCEL')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Ban size={13} />
            Cancel
          </button>
        )}

        {/* Customer Acceptance (for quotations when configured) */}
        {isDocApproved && documentType === 'QUOTATION' && (
          <button
            type="button"
            disabled={submittingAction}
            onClick={() => setActiveModal('ACCEPT_BY_CUSTOMER')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <CheckCircle2 size={13} />
            Accept by Customer
          </button>
        )}

        {/* Dynamic Configured Next-Document Transitions */}
        {isDocApproved && transitions.map((t) => (
          <button
            key={`${t.sourceDocumentType}-${t.targetDocumentType}`}
            type="button"
            disabled={submittingAction}
            onClick={() => handleTransitionClick(t)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-xs disabled:opacity-50"
          >
            <FileText size={13} />
            {t.label || `Convert to ${t.targetDocumentType.replace('_', ' ')}`}
            <ArrowRight size={13} className="text-zinc-400" />
          </button>
        ))}
      </div>

      {/* Confirmation Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h4 className="text-sm font-bold text-zinc-900">
                Confirm {activeModal.replace(/_/g, ' ')}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Comments / Reason {activeModal === 'REJECT' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder="Enter remarks..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || (activeModal === 'REJECT' && !commentText.trim())}
                onClick={handleConfirmAction}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingAction && <Loader2 size={12} className="animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
