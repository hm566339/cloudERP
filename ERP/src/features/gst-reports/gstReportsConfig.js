import { gstReportsApi } from '../../api/account/reports/gst';
import { formatCurrency } from '../../utils/formatters';

// ─── Report type keys (used by routes, nav, and API) ────────────────────────
export const GST_REPORT_TYPES = {
  GSTR1: 'gstr1',
  GSTR3B: 'gstr3b',
  HSN_SUMMARY: 'hsn-summary',
  ITC: 'itc',
};

// ─── Formatting helpers (defensive against unknown backend shapes) ──────────
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (v) => (v === null || v === undefined || v === '' ? '-' : formatCurrency(Number(v)));

const text = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

const dateText = (v) => (v ? String(v).slice(0, 10) : '-');

// ─── Per-report viewer meta (columns + summary cards) ───────────────────────
const amountColumn = { header: 'Taxable Value', accessor: (r) => money(r.taxableValue ?? r.taxableAmount ?? r.taxable), className: 'text-right', cellClassName: 'text-right font-medium' };
const cgstColumn = { header: 'CGST', accessor: (r) => money(r.cgst ?? r.cgstAmount), className: 'text-right', cellClassName: 'text-right font-medium' };
const sgstColumn = { header: 'SGST', accessor: (r) => money(r.sgst ?? r.sgstAmount), className: 'text-right', cellClassName: 'text-right font-medium' };
const igstColumn = { header: 'IGST', accessor: (r) => money(r.igst ?? r.igstAmount), className: 'text-right', cellClassName: 'text-right font-medium' };
const cessColumn = { header: 'Cess', accessor: (r) => money(r.cess ?? r.cessAmount), className: 'text-right', cellClassName: 'text-right font-medium' };
const totalTaxColumn = { header: 'Total Tax', accessor: (r) => money(r.totalTax ?? r.taxAmount ?? r.totalTaxAmount), className: 'text-right', cellClassName: 'text-right font-bold' };
const gstinColumn = { header: 'GSTIN', accessor: (r) => text(r.gstin ?? r.counterpartyGstin ?? r.supplierGstin) };
const nameColumn = { header: 'Party', accessor: (r) => text(r.partyName ?? r.counterpartyName ?? r.supplierName ?? r.customerName ?? r.name) };
const invoiceNoColumn = { header: 'Invoice No', accessor: (r) => text(r.invoiceNumber ?? r.invoiceNo ?? r.invoiceNumber) };
const invoiceDateColumn = { header: 'Invoice Date', accessor: (r) => dateText(r.invoiceDate ?? r.date ?? r.invoiceDate) };
const invoiceTypeColumn = { header: 'Type', accessor: (r) => text(r.invoiceType ?? r.type ?? r.documentType) };

export const gstReportMeta = {
  [GST_REPORT_TYPES.GSTR1]: {
    title: 'GSTR-1',
    subtitle: 'Outward supplies — monthly return',
    summaryCards: [
      { label: 'Total Invoices', key: 'totalInvoices' },
      { label: 'Taxable Value', key: 'totalTaxableValue', currency: true },
      { label: 'Total Tax', key: 'totalTax', currency: true },
      { label: 'IGST', key: 'totalIgst', currency: true },
    ],
    columns: [
      nameColumn,
      gstinColumn,
      invoiceNoColumn,
      invoiceDateColumn,
      invoiceTypeColumn,
      amountColumn,
      cgstColumn,
      sgstColumn,
      igstColumn,
      totalTaxColumn,
    ],
  },
  [GST_REPORT_TYPES.GSTR3B]: {
    title: 'GSTR-3B',
    subtitle: 'Monthly summary return',
    summaryCards: [
      { label: 'Sales (Taxable)', key: 'totalTaxableValue', currency: true },
      { label: 'Total Tax', key: 'totalTax', currency: true },
      { label: 'ITC Claimed', key: 'itcClaimed', currency: true },
      { label: 'Net Payable', key: 'netPayable', currency: true },
    ],
    columns: [
      { header: 'Section', accessor: (r) => text(r.section ?? r.sectionName) },
      { header: 'Particulars', accessor: (r) => text(r.particulars ?? r.description ?? r.name) },
      amountColumn,
      cgstColumn,
      sgstColumn,
      igstColumn,
      cessColumn,
      totalTaxColumn,
    ],
  },
  [GST_REPORT_TYPES.HSN_SUMMARY]: {
    title: 'HSN Summary',
    subtitle: 'HSN-wise summary of outward supplies',
    summaryCards: [
      { label: 'Total HSN Codes', key: 'totalHsnCodes' },
      { label: 'Total Quantity', key: 'totalQuantity' },
      { label: 'Total Taxable Value', key: 'totalTaxableValue', currency: true },
      { label: 'Total CGST', key: 'totalCgst', currency: true },
      { label: 'Total SGST', key: 'totalSgst', currency: true },
      { label: 'Total IGST', key: 'totalIgst', currency: true },
      { label: 'Total CESS', key: 'totalCess', currency: true },
    ],
    columns: [
      { header: 'HSN Code', accessor: (r) => text(r.hsnCode) },
      { header: 'Description', accessor: (r) => text(r.description) },
      { header: 'UQC', accessor: (r) => text(r.uqc) },
      { header: 'Quantity', accessor: (r) => num(r.quantity).toLocaleString(), className: 'text-right', cellClassName: 'text-right font-medium' },
      amountColumn,
      cgstColumn,
      sgstColumn,
      igstColumn,
      cessColumn,
    ],
  },
  [GST_REPORT_TYPES.ITC]: {
    title: 'ITC Report',
    subtitle: 'Input tax credit on inward supplies',
    summaryCards: [
      { label: 'Total Purchases', key: 'totalPurchases', currency: true },
      { label: 'Taxable Value', key: 'totalTaxableValue', currency: true },
      { label: 'Total Tax', key: 'totalTax', currency: true },
      { label: 'ITC Claimed', key: 'itcClaimed', currency: true },
      { label: 'ITC Reversed', key: 'itcReversed', currency: true },
    ],
    columns: [
      nameColumn,
      gstinColumn,
      invoiceNoColumn,
      invoiceDateColumn,
      amountColumn,
      cgstColumn,
      sgstColumn,
      igstColumn,
      totalTaxColumn,
      { header: 'ITC Eligible', accessor: (r) => money(r.itcEligible ?? r.eligibleItc), className: 'text-right', cellClassName: 'text-right font-medium' },
      { header: 'ITC Claimed', accessor: (r) => money(r.itcClaimed ?? r.claimedItc), className: 'text-right', cellClassName: 'text-right font-bold text-emerald-700' },
      { header: 'ITC Reversed', accessor: (r) => money(r.itcReversed ?? r.reversedItc), className: 'text-right', cellClassName: 'text-right font-medium text-red-700' },
    ],
  },
};

// ─── Report fetchers keyed by report type ───────────────────────────────────
export const gstReportFetchers = {
  [GST_REPORT_TYPES.GSTR1]: gstReportsApi.getGstr1,
  [GST_REPORT_TYPES.GSTR3B]: gstReportsApi.getGstr3b,
  [GST_REPORT_TYPES.HSN_SUMMARY]: gstReportsApi.getHsnSummary,
  [GST_REPORT_TYPES.ITC]: gstReportsApi.getItc,
};

// ─── Export options (shown on the Export Reports page) ──────────────────────
export const gstExportOptions = [
  { id: 'gstr1', type: GST_REPORT_TYPES.GSTR1, label: 'GSTR-1', description: 'Outward supplies return (JSON / CSV)' },
  { id: 'gstr3b', type: GST_REPORT_TYPES.GSTR3B, label: 'GSTR-3B', description: 'Monthly summary return (JSON)' },
  { id: 'hsn-summary', type: GST_REPORT_TYPES.HSN_SUMMARY, label: 'HSN Summary', description: 'HSN-wise outward supplies (JSON / CSV)' },
  { id: 'itc', type: GST_REPORT_TYPES.ITC, label: 'ITC Report', description: 'Input tax credit register (JSON / CSV)' },
];
