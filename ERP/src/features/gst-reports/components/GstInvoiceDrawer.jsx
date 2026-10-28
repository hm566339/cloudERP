import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export default function GstInvoiceDrawer({
  invoice,
  currency = 'INR',
  partyLabel = 'Customer',
}) {
  if (!invoice) return null;

  const partyName = invoice.customerName || invoice.partyName || invoice.vendorName || invoice.supplierName || '-';
  const taxableVal = invoice.taxableAmount ?? invoice.taxableValue ?? 0;
  const cgstVal = invoice.cgst ?? invoice.cgstAmount ?? 0;
  const sgstVal = invoice.sgst ?? invoice.sgstAmount ?? 0;
  const igstVal = invoice.igst ?? invoice.igstAmount ?? 0;
  const cessVal = invoice.cess ?? invoice.cessAmount ?? 0;
  const totalTax = (invoice.totalTax ?? invoice.totalTaxAmount) || (cgstVal + sgstVal + igstVal + cessVal);
  const totalVal = invoice.totalInvoiceValue ?? invoice.totalAmount ?? (taxableVal + totalTax);

  return (
    <div className="bg-zinc-50/70 dark:bg-surface-dark/70 p-5 rounded-xl border border-zinc-200 dark:border-border-dark space-y-4 m-3 shadow-inner animate-slide-down">
      {/* Top Details Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white dark:bg-card-dark text-zinc-900 dark:text-[#E6E8EE] rounded-lg border border-zinc-200 dark:border-border-dark shadow-2xs">
            {invoice.invoiceNumber || invoice.invoiceNo || '-'}
          </span>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">{partyName}</h4>
            <p className="text-[10px] text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
              Date: <span className="font-medium text-zinc-700 dark:text-zinc-300">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</span> |{' '}
              GSTIN: <span className="font-medium text-zinc-700 dark:text-zinc-300 font-mono">{invoice.gstin || invoice.supplierGstin || '-'}</span> |{' '}
              POS: <span className="font-medium text-zinc-700 dark:text-zinc-300">{invoice.placeOfSupply || invoice.stateCode || '-'}</span>
            </p>
          </div>
        </div>

        {invoice.invoiceType && (
          <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border bg-white dark:bg-card-dark border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-[#E6E8EE]">
            {String(invoice.invoiceType).replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Main Totals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/80 dark:border-border-dark shadow-2xs">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider">Taxable Value</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] font-mono mt-0.5">
            {currency} {formatCurrency(taxableVal)}
          </p>
        </div>

        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/80 dark:border-border-dark shadow-2xs">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider">Total Tax</p>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
            {currency} {formatCurrency(totalTax)}
          </p>
        </div>

        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/80 dark:border-border-dark shadow-2xs">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider">Total Invoice Value</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {currency} {formatCurrency(totalVal)}
          </p>
        </div>

        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/80 dark:border-border-dark shadow-2xs">
          <p className="text-[9px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider">{partyLabel}</p>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5" title={partyName}>
            {partyName}
          </p>
        </div>
      </div>

      {/* Tax Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-2.5 rounded-lg bg-white/60 dark:bg-card-dark/60 border border-zinc-100 dark:border-border-dark">
          <p className="text-[8.8px] font-bold text-zinc-400 uppercase">CGST</p>
          <p className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
            {currency} {formatCurrency(cgstVal)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/60 dark:bg-card-dark/60 border border-zinc-100 dark:border-border-dark">
          <p className="text-[8.8px] font-bold text-zinc-400 uppercase">SGST</p>
          <p className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
            {currency} {formatCurrency(sgstVal)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/60 dark:bg-card-dark/60 border border-zinc-100 dark:border-border-dark">
          <p className="text-[8.8px] font-bold text-zinc-400 uppercase">IGST</p>
          <p className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
            {currency} {formatCurrency(igstVal)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/60 dark:bg-card-dark/60 border border-zinc-100 dark:border-border-dark">
          <p className="text-[8.8px] font-bold text-zinc-400 uppercase">CESS</p>
          <p className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
            {currency} {formatCurrency(cessVal)}
          </p>
        </div>
      </div>
    </div>
  );
}

