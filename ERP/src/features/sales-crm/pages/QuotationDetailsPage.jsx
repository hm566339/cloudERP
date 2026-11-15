import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Printer,
  Send,
  ArrowRightLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { PageHeader, ConfirmModal } from '../../../components/common';
import {
  useGetCrmQuotationByIdQuery,
  useConvertQuotationToOrderMutation,
} from '../../../api/sales-crm/crm.api';
import QuotationApprovalModal from '../components/QuotationApprovalModal';
import QuotationPrintModal from '../components/QuotationPrintModal';

export default function QuotationDetailsPage() {
  const { id, companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const { data: quoteRes, isLoading, refetch } = useGetCrmQuotationByIdQuery({ id, companyId });
  const [convertToOrder, { isLoading: isConverting }] = useConvertQuotationToOrderMutation();

  const quotation = quoteRes?.data || null;

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-zinc-400">Loading quotation details...</div>;
  }

  if (!quotation) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
        <p>Quotation not found.</p>
        <button onClick={() => navigate(`${crmBase}/quotations`)} className="text-primary hover:underline">
          Return to Quotations
        </button>
      </div>
    );
  }

  const handleConvertConfirm = async () => {
    try {
      await convertToOrder({ id: quotation.id, companyId }).unwrap();
      setIsConvertOpen(false);
      refetch();
    } catch (err) {
      console.error('Convert failed', err);
    }
  };

  const isApproved = quotation.status === 'APPROVED';
  const canSubmit = quotation.status === 'DRAFT' || quotation.status === 'REJECTED';

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`${crmBase}/quotations`)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs text-zinc-500">Back to Quotations List</span>
      </div>

      {/* Header Banner */}
      <div className="p-5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
                {quotation.quotationNumber || quotation.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-primary/10 text-primary">
                {quotation.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {quotation.accountName || 'Client Account'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Created: {new Date(quotation.createdAt || Date.now()).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={() => setIsApprovalOpen(true)}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Send size={13} /> Submit Approval
              </button>
            )}

            {isApproved && (
              <button
                onClick={() => setIsConvertOpen(true)}
                className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
              >
                <ArrowRightLeft size={13} /> Convert to Sales Order
              </button>
            )}

            <button
              onClick={() => setIsPrintOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Line Items & Taxes</h2>
        <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-[#1C202B] text-zinc-600 dark:text-[#A0A6B5] uppercase text-[10px]">
              <tr>
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-center w-24">HSN / SAC</th>
                <th className="p-2.5 text-center w-20">Quantity</th>
                <th className="p-2.5 text-right w-28">Unit Price</th>
                <th className="p-2.5 text-center w-20">Discount</th>
                <th className="p-2.5 text-center w-20">GST</th>
                <th className="p-2.5 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
              {(quotation.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 text-center font-mono text-zinc-400">{idx + 1}</td>
                  <td className="p-2.5 font-medium text-zinc-900 dark:text-white">{it.description || it.itemName}</td>
                  <td className="p-2.5 text-center font-mono text-zinc-500">{it.hsnSacCode || '—'}</td>
                  <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                  <td className="p-2.5 text-right font-mono">₹{(it.unitPrice || 0).toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-center">{it.discountPercent || 0}%</td>
                  <td className="p-2.5 text-center">{it.taxRatePercent || 18}%</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-zinc-900 dark:text-white">
                    ₹{(it.lineTotal || (it.quantity * it.unitPrice) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-3">
          <div className="flex-1 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">Commercial Terms:</p>
            <p className="whitespace-pre-line">{quotation.termsAndConditions || 'Standard 30-day validity.'}</p>
          </div>
          <div className="w-full md:w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono">₹{(quotation.subtotalAmount || quotation.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>GST Total:</span>
              <span className="font-mono">₹{(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-[#2A2F3D]">
              <span>Grand Total:</span>
              <span className="font-mono text-primary">₹{(quotation.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuotationApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        quotation={quotation}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <QuotationPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        quotation={quotation}
      />

      <ConfirmModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onConfirm={handleConvertConfirm}
        title="Confirm Conversion to Sales Order"
        message="This will book a confirmed Sales Order in the ERP system and notify the dispatch team."
        confirmText={isConverting ? 'Converting...' : 'Confirm Order'}
        variant="primary"
      />
    </div>
  );
}

