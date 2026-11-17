import React from 'react';
import { Modal, Button } from '../../../components/common';
import { Printer, Download } from 'lucide-react';

export default function QuotationPrintModal({
  isOpen,
  onClose,
  quotation,
}) {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Print Quotation: ${quotation.quotationNumber || 'Draft'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Printable Paper Area */}
        <div id="printable-quotation" className="p-6 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-xs space-y-6">
          <div className="flex justify-between items-start border-b border-zinc-200 dark:border-[#2A2F3D] pb-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">COMMERCIAL QUOTATION</h1>
              <p className="text-zinc-500 font-mono mt-1">Ref: {quotation.quotationNumber || 'QT-DRAFT'}</p>
              <p className="text-zinc-500">Date: {new Date(quotation.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Mark2 Cloud ERP</h2>
              <p className="text-zinc-500 text-[11px]">GSTIN: 27AABCM8293Q1Z5</p>
              <p className="text-zinc-500 text-[11px]">Valid Until: {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN') : '30 Days'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg">
              <p className="font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1">Billed To:</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{quotation.accountName || 'Client Account'}</p>
              {quotation.billingAddress && <p className="text-zinc-500">{quotation.billingAddress}</p>}
              {quotation.gstin && <p className="text-zinc-500 font-mono">GSTIN: {quotation.gstin}</p>}
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg">
              <p className="font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1">Status & Terms:</p>
              <p className="text-zinc-500">Status: <span className="font-semibold uppercase text-zinc-800 dark:text-[#E6E8EE]">{quotation.status}</span></p>
              <p className="text-zinc-500">Payment: 100% Against PI</p>
              <p className="text-zinc-500">Currency: INR (₹)</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-100 dark:bg-[#1C202B] text-zinc-600 dark:text-[#A0A6B5] text-[10px] uppercase">
                <tr>
                  <th className="p-2 w-10 text-center">#</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-center w-16">Qty</th>
                  <th className="p-2 text-right w-24">Rate (₹)</th>
                  <th className="p-2 text-center w-16">Disc %</th>
                  <th className="p-2 text-center w-16">Tax %</th>
                  <th className="p-2 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
                {(quotation.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-center text-zinc-400 font-mono">{idx + 1}</td>
                    <td className="p-2 font-medium text-zinc-800 dark:text-[#E6E8EE]">{it.description || it.itemName}</td>
                    <td className="p-2 text-center">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">₹{(it.unitPrice || 0).toLocaleString('en-IN')}</td>
                    <td className="p-2 text-center">{it.discountPercent || 0}%</td>
                    <td className="p-2 text-center">{it.taxRatePercent || 18}%</td>
                    <td className="p-2 text-right font-mono font-semibold">₹{(it.lineTotal || (it.quantity * it.unitPrice) || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start pt-2">
            <div className="flex-1 pr-6 text-zinc-500 text-[11px]">
              <p className="font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-0.5">Terms & Notes:</p>
              <p className="whitespace-pre-line">{quotation.termsAndConditions || 'Standard warranty and commercial supply policies apply.'}</p>
            </div>
            <div className="w-56 space-y-1 text-right">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span className="font-mono">₹{(quotation.subtotalAmount || quotation.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Tax:</span>
                <span className="font-mono">₹{(quotation.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-[#2A2F3D]">
                <span>Total:</span>
                <span className="font-mono text-primary">₹{(quotation.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

