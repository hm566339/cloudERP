import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Printer, Send, Download, X, Loader2, FileText, ArrowRight } from 'lucide-react';
import { salesInvoicesApi } from '../../../api/account/salesInvoices';
import { useGenerateInvoiceFromDeliveryChallanMutation } from '../../../api/sales-crm/sales.api';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

import apiClient from '../../../api/common/client';

const printPdfBlob = (blob) => {
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.warn('Auto print failed:', e);
      }
    };
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(url);
      } catch {}
    }, 60000);
  } else {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed:', err);
      }
      setTimeout(() => {
        try {
          iframe.remove();
          window.URL.revokeObjectURL(url);
        } catch {}
      }, 60000);
    };
  }
};

const downloadPdfBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export default function DeliveryInvoiceActionsModal({
  isOpen,
  onClose,
  companyId,
  dcId,
  deliveryChallanId,
  dcNumber,
  deliveryChallanNumber,
  invoiceId: initialInvoiceId,
  confirmedInvoiceId,
  invoiceNumber: initialInvoiceNumber,
  customerName,
  onComplete,
}) {
  const effectiveDcId = dcId || deliveryChallanId;
  const effectiveDcNumber = dcNumber || deliveryChallanNumber;
  const effectiveInvoiceId = initialInvoiceId || confirmedInvoiceId;
  const effectiveInvoiceNumber = initialInvoiceNumber;

  const dispatch = useAppDispatch();
  const [generateInvoiceFromDc] = useGenerateInvoiceFromDeliveryChallanMutation();

  const [printInvoice, setPrintInvoice] = useState(false);
  const [sendInvoice, setSendInvoice] = useState(false);
  const [downloadInvoice, setDownloadInvoice] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');

  if (!isOpen) return null;

  const hasAnySelection = printInvoice || sendInvoice || downloadInvoice;

  const handleTogglePrint = () => {
    if (isExecuting) return;
    setPrintInvoice(prev => !prev);
  };

  const handleToggleSend = () => {
    if (isExecuting) return;
    setSendInvoice(prev => !prev);
  };

  const handleToggleDownload = () => {
    if (isExecuting) return;
    setDownloadInvoice(prev => !prev);
  };

  const handleContinue = async () => {
    if (!hasAnySelection || isExecuting) return;

    setIsExecuting(true);
    setCurrentStepText('Resolving invoice...');

    try {
      let targetInvoiceId = effectiveInvoiceId;
      let targetInvoiceNumber = effectiveInvoiceNumber;

      // If no invoice ID provided, resolve or generate from Delivery Challan
      if (!targetInvoiceId && effectiveDcId) {
        try {
          const genRes = await generateInvoiceFromDc({ deliveryChallanId: effectiveDcId, companyId }).unwrap();
          targetInvoiceId = genRes?.data?.id || genRes?.id;
          targetInvoiceNumber = genRes?.data?.invoiceNumber || genRes?.invoiceNumber || targetInvoiceNumber;
        } catch (err) {
          if (err?.status === 409 || (err?.status === 400 && String(err?.data?.message || '').toLowerCase().includes('already exists'))) {
            targetInvoiceId = err?.data?.data?.id || err?.data?.id;
            targetInvoiceNumber = err?.data?.data?.invoiceNumber || err?.data?.invoiceNumber || targetInvoiceNumber;
          }
        }

        // If still not resolved, query delivery challan detail directly
        if (!targetInvoiceId) {
          try {
            const dcRes = await apiClient.get(`/api/account/v1/delivery-challans/${effectiveDcId}`, { params: { companyId } });
            const dcData = dcRes?.data?.data || dcRes?.data || dcRes;
            targetInvoiceId = dcData?.salesInvoiceId || dcData?.invoiceId || dcData?.salesInvoice?.id;
            targetInvoiceNumber = dcData?.salesInvoiceNumber || dcData?.invoiceNumber || dcData?.salesInvoice?.invoiceNumber || targetInvoiceNumber;
          } catch (e) {
            console.warn('Could not query DC details for invoice resolution:', e);
          }
        }
      }

      if (!targetInvoiceId) {
        throw new Error('Could not identify or generate the Sales Invoice for this delivery.');
      }

      let pdfBlob = null;
      const ensurePdfBlob = async () => {
        if (!pdfBlob) {
          const res = await salesInvoicesApi.downloadPdf(targetInvoiceId, companyId);
          pdfBlob = new Blob([res.data], { type: 'application/pdf' });
        }
        return pdfBlob;
      };

      // 1. Download Invoice
      if (downloadInvoice) {
        setCurrentStepText('Downloading invoice PDF...');
        try {
          const blob = await ensurePdfBlob();
          const fileName = targetInvoiceNumber ? `Invoice_${targetInvoiceNumber}.pdf` : `Invoice_${targetInvoiceId}.pdf`;
          downloadPdfBlob(blob, fileName);
          dispatch(addAlert({ type: 'success', message: 'Invoice PDF downloaded successfully.' }));
        } catch (err) {
          console.error('Failed to download invoice PDF:', err);
          dispatch(addAlert({ type: 'error', message: 'Failed to download invoice PDF.' }));
        }
      }

      // 2. Send Invoice
      if (sendInvoice) {
        setCurrentStepText('Sending invoice email...');
        try {
          await salesInvoicesApi.sendEmail(targetInvoiceId, companyId);
          dispatch(addAlert({ type: 'success', message: 'Invoice sent successfully.' }));
        } catch (err) {
          console.error('Failed to send invoice email:', err);
          const msg = err?.response?.data?.message || err?.data?.message || err?.message || 'Failed to send invoice email.';
          dispatch(addAlert({ type: 'error', message: msg }));
        }
      }

      // 3. Print Invoice
      if (printInvoice) {
        setCurrentStepText('Preparing print dialog...');
        try {
          const blob = await ensurePdfBlob();
          printPdfBlob(blob);
          dispatch(addAlert({ type: 'success', message: 'Print dialog opened.' }));
        } catch (err) {
          console.error('Failed to prepare print dialog:', err);
          dispatch(addAlert({ type: 'error', message: 'Failed to open print dialog.' }));
        }
      }

      if (onComplete) {
        onComplete({ invoiceId: targetInvoiceId, invoiceNumber: targetInvoiceNumber });
      }
      onClose();
    } catch (err) {
      console.error('Invoice action error:', err);
      dispatch(addAlert({ type: 'error', message: err?.message || 'Failed to perform selected invoice actions.' }));
    } finally {
      setIsExecuting(false);
      setCurrentStepText('');
    }
  };

  const handleSkip = () => {
    if (isExecuting) return;
    if (onComplete) onComplete(null);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) handleSkip();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-zinc-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                Delivery Confirmed Successfully
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                What would you like to do with the invoice?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isExecuting}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40"
            title="Skip / Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadata Badges */}
        {(effectiveDcNumber || effectiveInvoiceNumber || customerName) && (
          <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-100 flex flex-wrap gap-2 items-center text-[11px] text-zinc-600">
            {effectiveDcNumber && (
              <span className="inline-flex items-center gap-1 font-mono font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200">
                <span className="text-zinc-400 text-[9px] uppercase font-sans">DC:</span> {effectiveDcNumber}
              </span>
            )}
            {effectiveInvoiceNumber && (
              <span className="inline-flex items-center gap-1 font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                <span className="text-indigo-400 text-[9px] uppercase font-sans">Inv:</span> {effectiveInvoiceNumber}
              </span>
            )}
            {customerName && (
              <span className="truncate max-w-[180px] text-zinc-500 ml-auto" title={customerName}>
                {customerName}
              </span>
            )}
          </div>
        )}

        {/* Checkbox Options */}
        <div className="px-6 py-5 space-y-3">
          {/* Option 1: Print Invoice */}
          <div
            id="card-print-invoice"
            role="checkbox"
            aria-checked={printInvoice}
            tabIndex={0}
            onClick={handleTogglePrint}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleTogglePrint();
              }
            }}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              printInvoice
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
            }`}
          >
            <div className="relative flex items-center justify-center pointer-events-auto">
              <input
                id="checkbox-print-invoice"
                name="printInvoice"
                type="checkbox"
                checked={printInvoice}
                onChange={(e) => {
                  setPrintInvoice(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isExecuting}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer pointer-events-auto"
              />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <Printer size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="checkbox-print-invoice"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-semibold text-zinc-900 cursor-pointer block"
              >
                Print Invoice
              </label>
              <p className="text-[11px] text-zinc-500">Open system print dialog for physical printout</p>
            </div>
          </div>

          {/* Option 2: Send Invoice */}
          <div
            id="card-send-invoice"
            role="checkbox"
            aria-checked={sendInvoice}
            tabIndex={0}
            onClick={handleToggleSend}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggleSend();
              }
            }}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              sendInvoice
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
            }`}
          >
            <div className="relative flex items-center justify-center pointer-events-auto">
              <input
                id="checkbox-send-invoice"
                name="sendInvoice"
                type="checkbox"
                checked={sendInvoice}
                onChange={(e) => {
                  setSendInvoice(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isExecuting}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer pointer-events-auto"
              />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <Send size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="checkbox-send-invoice"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-semibold text-zinc-900 cursor-pointer block"
              >
                Send Invoice
              </label>
              <p className="text-[11px] text-zinc-500">Email invoice directly to the customer</p>
            </div>
          </div>

          {/* Option 3: Download Invoice */}
          <div
            id="card-download-invoice"
            role="checkbox"
            aria-checked={downloadInvoice}
            tabIndex={0}
            onClick={handleToggleDownload}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggleDownload();
              }
            }}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              downloadInvoice
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 shadow-sm'
                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
            }`}
          >
            <div className="relative flex items-center justify-center pointer-events-auto">
              <input
                id="checkbox-download-invoice"
                name="downloadInvoice"
                type="checkbox"
                checked={downloadInvoice}
                onChange={(e) => {
                  setDownloadInvoice(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isExecuting}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer pointer-events-auto"
              />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <Download size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="checkbox-download-invoice"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-semibold text-zinc-900 cursor-pointer block"
              >
                Download Invoice
              </label>
              <p className="text-[11px] text-zinc-500">Save official PDF copy to your device</p>
            </div>
          </div>

          {!hasAnySelection && !isExecuting && (
            <p className="text-[11px] text-zinc-400 text-center pt-1">
              Select one or more options to continue, or click Skip.
            </p>
          )}

          {isExecuting && currentStepText && (
            <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 border border-emerald-200/60 rounded-lg text-xs font-medium text-emerald-800">
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span>{currentStepText}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isExecuting}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-800 transition-colors disabled:opacity-40"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasAnySelection || isExecuting}
            className="px-5 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
          >
            {isExecuting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
