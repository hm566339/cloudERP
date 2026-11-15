import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSubmitQuotationApprovalMutation } from '../../../api/sales-crm/crm.api';

export default function QuotationApprovalModal({
  isOpen,
  onClose,
  quotation,
  companyId,
  onSuccess,
}) {
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitApproval, { isLoading }] = useSubmitQuotationApprovalMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quotation?.id) return;

    try {
      setErrorMsg(null);
      await submitApproval({
        id: quotation.id,
        companyId,
        remarks: remarks.trim() || 'Submitted for commercial and discount approval.',
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to submit quotation for approval');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Quotation for Approval"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Quotation #:</span>
            <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{quotation?.quotationNumber || quotation?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Total Amount:</span>
            <span className="font-mono font-bold text-primary">₹{(quotation?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Target Workflow:</span>
            <span className="font-medium text-zinc-700 dark:text-[#A0A6B5]">Finance & Sales Head Approval</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Submission Remarks / Justification
          </label>
          <textarea
            rows={3}
            placeholder="Add justification (e.g. strategic customer, high volume, pre-negotiated discount rate)..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Send size={13} />
            {isLoading ? 'Submitting...' : 'Submit to Workflow'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

