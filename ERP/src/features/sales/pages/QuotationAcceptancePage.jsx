import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useGetPublicQuotationByTokenQuery,
  useAcceptQuotationByTokenMutation,
  useRejectQuotationByTokenMutation,
} from '../../../api/sales-crm/sales.api';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  Check,
  X,
  FileQuestion,
  AlertTriangle
} from 'lucide-react';
import ThemeToggle from '../../../components/common/ThemeToggle';

export default function QuotationAcceptancePage() {
  const { token } = useParams();

  const {
    data: apiResponse,
    isLoading: isFetching,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useGetPublicQuotationByTokenQuery(token, {
    skip: !token,
  });

  const [acceptQuotation, { isLoading: isAccepting }] = useAcceptQuotationByTokenMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationByTokenMutation();

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [actionErrorMessage, setActionErrorMessage] = useState(null);

  const quotation = apiResponse?.data;

  const formatCurrency = (val, currency = 'INR') => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleConfirmAccept = async () => {
    if (!token || isAccepting) return;
    setActionErrorMessage(null);
    try {
      const res = await acceptQuotation({ token }).unwrap();
      setShowAcceptModal(false);
      setActionSuccessMessage(res?.message || 'Quotation accepted successfully! Thank you for your business.');
      refetch();
    } catch (err) {
      setActionErrorMessage(err?.data?.message || err?.message || 'Failed to accept quotation. Please try again.');
    }
  };

  const handleConfirmReject = async () => {
    if (!token || isRejecting) return;
    setActionErrorMessage(null);
    try {
      const res = await rejectQuotation({ token, reason: rejectionReason }).unwrap();
      setShowRejectModal(false);
      setActionSuccessMessage(res?.message || 'Quotation has been declined.');
      refetch();
    } catch (err) {
      setActionErrorMessage(err?.data?.message || err?.message || 'Failed to decline quotation. Please try again.');
    }
  };

  // ── LOADING STATE ──
  if (isFetching) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0D13] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161922] p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-[#2A2F3D] max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-[#4C8DFF] animate-spin" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-[#E6E8EE]">Loading Quotation</h3>
          <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Verifying security token and retrieving quotation details...</p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE (Token Invalid, Expired, Revoked) ──
  if (isFetchError || !quotation) {
    const errorMsg = fetchError?.data?.message || 'This quotation link is invalid or has expired.';
    const isExpired = errorMsg.toLowerCase().includes('expired');
    const isRevoked = errorMsg.toLowerCase().includes('revoked');

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0D13] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161922] p-8 sm:p-10 rounded-2xl shadow-xl border border-zinc-200 dark:border-[#2A2F3D] max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500">
            {isExpired ? <Clock className="w-8 h-8" /> : isRevoked ? <AlertTriangle className="w-8 h-8" /> : <FileQuestion className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2">
            {isExpired ? 'Quotation Link Expired' : isRevoked ? 'Quotation Link Revoked' : 'Quotation Not Found'}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-[#A0A6B5] mb-6 leading-relaxed">
            {errorMsg}
          </p>
          <p className="text-xs text-zinc-400 dark:text-[#6B7184]">
            If you believe this is in error, please contact the issuing company for a fresh quotation link.
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = quotation.status === 'ACCEPTED' || quotation.status === 'CUSTOMER_ACCEPTED' || quotation.isAccepted;
  const isRejected = quotation.status === 'REJECTED' || quotation.isRejected;
  const isExpired = quotation.isExpired;
  const canDecide = !isAccepted && !isRejected && !isExpired && quotation.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-[#0B0D13] py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center">
      {/* Top Utility Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-[#8C93A4]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Verified Secure Document</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-[#D1D5DB] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C] transition-colors"
          >
            <Printer size={14} /> Print
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Document Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-[#161922] rounded-2xl shadow-xl border border-zinc-200/80 dark:border-[#2A2F3D] overflow-hidden">
        {/* Status / Alert Banners */}
        {actionSuccessMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {actionErrorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{actionErrorMessage}</span>
          </div>
        )}

        {isAccepted && !actionSuccessMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>This quotation was accepted on {formatDate(quotation.acceptedAt || quotation.quotationDate)}. Thank you for your business!</span>
          </div>
        )}

        {isRejected && !actionSuccessMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm font-medium">
            <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span>This quotation has been declined.</span>
          </div>
        )}

        {isExpired && !isAccepted && !isRejected && (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm font-medium">
            <Clock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>This quotation expired on {formatDate(quotation.validUntil)} and can no longer be accepted.</span>
          </div>
        )}

        {/* Document Header */}
        <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-[#2A2F3D] flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            {quotation.companyLogoUrl ? (
              <img src={quotation.companyLogoUrl} alt={quotation.companyName} className="h-12 w-auto object-contain mb-3" />
            ) : (
              <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-white font-bold text-xl">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-[#4C8DFF]" />
                <span>{quotation.companyName || 'Company'}</span>
              </div>
            )}
            <div className="text-xs text-zinc-600 dark:text-[#A0A6B5] space-y-1">
              {quotation.companyAddress && <p>{quotation.companyAddress}</p>}
              {quotation.companyGstin && <p className="font-mono">GSTIN: <span className="font-semibold text-zinc-800 dark:text-[#D1D5DB]">{quotation.companyGstin}</span></p>}
              <div className="flex flex-wrap gap-x-4">
                {quotation.companyEmail && <p>Email: {quotation.companyEmail}</p>}
                {quotation.companyPhone && <p>Phone: {quotation.companyPhone}</p>}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-[#4C8DFF] mb-1">
              Sales Quotation
            </span>
            <h1 className="text-2xl font-black font-mono text-zinc-900 dark:text-white mb-2">
              {quotation.quotationNumber}
            </h1>
            <div className="text-xs space-y-1 text-zinc-600 dark:text-[#A0A6B5]">
              <p>Date: <span className="font-medium text-zinc-800 dark:text-[#D1D5DB]">{formatDate(quotation.quotationDate)}</span></p>
              {quotation.validUntil && (
                <p>Valid Until: <span className="font-medium text-zinc-800 dark:text-[#D1D5DB]">{formatDate(quotation.validUntil)}</span></p>
              )}
              <div className="pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAccepted
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                    : isExpired
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                }`}>
                  {quotation.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Billing Info */}
        <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-[#141720] border-b border-zinc-100 dark:border-[#2A2F3D] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-2">
              Quotation For
            </span>
            <div className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] mb-1">
              {quotation.customerName || 'Customer'}
            </div>
            <div className="text-xs text-zinc-600 dark:text-[#A0A6B5] space-y-1">
              {quotation.billingAddress && <p>{quotation.billingAddress}</p>}
              {quotation.customerGstin && <p className="font-mono">GSTIN: {quotation.customerGstin}</p>}
              {quotation.customerEmail && <p>Email: {quotation.customerEmail}</p>}
              {quotation.customerPhone && <p>Phone: {quotation.customerPhone}</p>}
            </div>
          </div>

          {quotation.shippingAddress && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-2">
                Delivery Destination
              </span>
              <div className="text-xs text-zinc-600 dark:text-[#A0A6B5] leading-relaxed">
                {quotation.shippingAddress}
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100/70 dark:bg-[#1D212C] text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-[#8C93A4] border-b border-zinc-200 dark:border-[#2A2F3D]">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">Item & Description</th>
                <th className="py-3 px-4 text-center">HSN/SAC</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] text-xs">
              {quotation.items && quotation.items.length > 0 ? (
                quotation.items.map((item, idx) => (
                  <tr key={item.lineNumber || idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors">
                    <td className="py-3 px-4 text-center text-zinc-400">{item.lineNumber || idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{item.itemName}</div>
                      {item.description && (
                        <div className="text-[11px] text-zinc-500 dark:text-[#8C93A4] mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-500 dark:text-[#8C93A4]">
                      {item.hsnCode || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-800 dark:text-[#D1D5DB]">
                      {item.quantity} {item.unitName || ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-800 dark:text-[#D1D5DB]">
                      {formatCurrency(item.unitPrice, quotation.currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500 dark:text-[#8C93A4]">
                      {item.discountAmount && Number(item.discountAmount) > 0
                        ? formatCurrency(item.discountAmount, quotation.currency)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500 dark:text-[#8C93A4]">
                      {item.taxAmount && Number(item.taxAmount) > 0
                        ? `${formatCurrency(item.taxAmount, quotation.currency)} (${item.taxPercentage || 0}%)`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-white">
                      {formatCurrency(item.totalAmount, quotation.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-400 text-xs">
                    No items in this quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Terms Section */}
        <div className="p-6 sm:p-8 bg-zinc-50/40 dark:bg-[#141720] border-t border-zinc-100 dark:border-[#2A2F3D] grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Terms & Notes */}
          <div className="space-y-4">
            {quotation.formattedTerms && quotation.formattedTerms.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-2">
                  Terms & Conditions
                </span>
                <ul className="text-xs text-zinc-600 dark:text-[#A0A6B5] space-y-1 list-disc list-inside">
                  {quotation.formattedTerms.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </div>
            )}

            {quotation.notes && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">
                  Customer Notes
                </span>
                <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] whitespace-pre-line">
                  {quotation.notes}
                </p>
              </div>
            )}
          </div>

          {/* Amount Calculation */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 text-zinc-600 dark:text-[#A0A6B5]">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
            </div>

            {quotation.discountAmount && Number(quotation.discountAmount) > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                <span>Total Discount:</span>
                <span className="font-mono">-{formatCurrency(quotation.discountAmount, quotation.currency)}</span>
              </div>
            )}

            {quotation.cgstAmount && Number(quotation.cgstAmount) > 0 && (
              <div className="flex justify-between py-1 text-zinc-500 dark:text-[#8C93A4]">
                <span>CGST:</span>
                <span className="font-mono">{formatCurrency(quotation.cgstAmount, quotation.currency)}</span>
              </div>
            )}

            {quotation.sgstAmount && Number(quotation.sgstAmount) > 0 && (
              <div className="flex justify-between py-1 text-zinc-500 dark:text-[#8C93A4]">
                <span>SGST:</span>
                <span className="font-mono">{formatCurrency(quotation.sgstAmount, quotation.currency)}</span>
              </div>
            )}

            {quotation.igstAmount && Number(quotation.igstAmount) > 0 && (
              <div className="flex justify-between py-1 text-zinc-500 dark:text-[#8C93A4]">
                <span>IGST:</span>
                <span className="font-mono">{formatCurrency(quotation.igstAmount, quotation.currency)}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-zinc-200 dark:border-[#2A2F3D] text-base font-bold text-zinc-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-600 dark:text-[#4C8DFF]">
                {formatCurrency(quotation.totalAmount, quotation.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Decision Bar */}
        {canDecide && (
          <div className="p-6 bg-white dark:bg-[#161922] border-t border-zinc-200 dark:border-[#2A2F3D] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500 dark:text-[#8C93A4] text-center sm:text-left">
              Please review the quotation details above. You may accept or decline to proceed.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isAccepting || isRejecting}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X size={15} /> Decline
              </button>
              <button
                onClick={() => setShowAcceptModal(true)}
                disabled={isAccepting || isRejecting}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check size={15} /> Accept Quotation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Acceptance Confirmation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#161922] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Confirm Acceptance</h3>
            <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] mb-6 leading-relaxed">
              Are you sure you want to accept Quotation <span className="font-mono font-bold text-zinc-800 dark:text-white">{quotation.quotationNumber}</span> for <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(quotation.totalAmount, quotation.currency)}</span>?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                disabled={isAccepting}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={isAccepting}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isAccepting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Decline Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#161922] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <X size={20} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Decline Quotation</h3>
            <p className="text-xs text-zinc-500 dark:text-[#8C93A4] mb-4">
              Please let us know why you are declining this quotation (optional):
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Budget constraints, specifications changed..."
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isRejecting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-[11px] text-zinc-400 dark:text-[#6B7184]">
        © {new Date().getFullYear()} {quotation.companyName || 'Mark2 ERP'}. All rights reserved.
      </div>
    </div>
  );
}
