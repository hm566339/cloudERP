import {
  Wallet,
  Banknote,
  Coins,
  Landmark,
  PiggyBank,
  Receipt,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Scale,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';

// ─── DTO contracts (JSDoc typedefs — the project is JSX, so types are documented here) ──

/**
 * GST Summary Dashboard request DTO (POST /api/reports/gst/summary)
 * The API expects this object nested under a `data` key.
 * @typedef {Object} GstSummaryRequest
 * @property {string} companyId
 * @property {string} branchId
 * @property {string} gstRegistrationId
 * @property {string} financialYearId
 * @property {string} fromDate
 * @property {string} toDate
 * @property {'ALL'|'SALES'|'PURCHASE'|'CREDIT_NOTE'|'DEBIT_NOTE'} invoiceType
 * @property {string} stateCode
 * @property {number|null} gstRate
 * @property {string} hsn
 * @property {string} customerId
 * @property {string} vendorId
 * @property {number} page
 * @property {number} size
 * @property {string} sortBy
 * @property {'ASC'|'DESC'} sortDirection
 */

/**
 * GST Summary Dashboard response DTO (sections rendered on the dashboard).
 * @typedef {Object} GstSummaryResponse
 * @property {Object} summary        Period totals used by the KPI cards.
 * @property {Object} taxSummary     Section 1 — Tax Summary.
 * @property {Object} itcSummary     Section 2 — ITC Summary.
 * @property {Object} gstLiability   Section 3 — GST Liability.
 * @property {Object} supplySummary  Section 4 — Supply Summary.
 * @property {Object} statistics     Section 5 — Statistics.
 * @property {Object} charts         Section 6 — Chart series.
 * @property {Object} exportOptions  Section 7 — Export availability.
 * @property {Object} audit          Generated-at / audit trail info.
 */

// ─── Defensive DTO accessors ─────────────────────────────────────────────────

export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** First non-null value along any of the given key paths (deep fallback). */
export const pick = (obj, paths) => {
  for (const path of paths) {
    let cur = obj;
    let ok = true;
    for (const key of path) {
      if (cur === null || cur === undefined) {
        ok = false;
        break;
      }
      cur = cur[key];
    }
    if (ok && cur !== null && cur !== undefined && cur !== '') return cur;
  }
  return undefined;
};

export const money = (v) => (v === null || v === undefined || v === '' ? '-' : formatCurrency(num(v)));

export const count = (v) => (v === null || v === undefined || v === '' ? '-' : num(v).toLocaleString('en-IN'));

export const pct = (v) => (v === null || v === undefined || v === '' ? '-' : `${num(v).toFixed(2)}%`);

// ─── Static filter enums ─────────────────────────────────────────────────────

export const GST_INVOICE_TYPES = [
  { value: 'ALL', label: 'All Invoice Types' },
  { value: 'SALES', label: 'Sales Invoice' },
  { value: 'PURCHASE', label: 'Purchase Invoice' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
  { value: 'DEBIT_NOTE', label: 'Debit Note' },
];

export const GST_RATES = [
  { value: 0, label: '0% (Nil)' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
];

export const GST_STATES = [
  { value: '01', label: 'Jammu & Kashmir' },
  { value: '02', label: 'Himachal Pradesh' },
  { value: '03', label: 'Punjab' },
  { value: '04', label: 'Chandigarh' },
  { value: '05', label: 'Uttarakhand' },
  { value: '06', label: 'Haryana' },
  { value: '07', label: 'Delhi' },
  { value: '08', label: 'Rajasthan' },
  { value: '09', label: 'Uttar Pradesh' },
  { value: '10', label: 'Bihar' },
  { value: '11', label: 'Sikkim' },
  { value: '12', label: 'Arunachal Pradesh' },
  { value: '13', label: 'Nagaland' },
  { value: '14', label: 'Manipur' },
  { value: '15', label: 'Mizoram' },
  { value: '16', label: 'Tripura' },
  { value: '17', label: 'Meghalaya' },
  { value: '18', label: 'Assam' },
  { value: '19', label: 'West Bengal' },
  { value: '20', label: 'Jharkhand' },
  { value: '21', label: 'Odisha' },
  { value: '22', label: 'Chhattisgarh' },
  { value: '23', label: 'Madhya Pradesh' },
  { value: '24', label: 'Gujarat' },
  { value: '26', label: 'Daman & Diu / Dadra & Nagar Haveli' },
  { value: '27', label: 'Maharashtra' },
  { value: '29', label: 'Karnataka' },
  { value: '30', label: 'Goa' },
  { value: '31', label: 'Lakshadweep' },
  { value: '32', label: 'Kerala' },
  { value: '33', label: 'Tamil Nadu' },
  { value: '34', label: 'Puducherry' },
  { value: '35', label: 'Andaman & Nicobar Islands' },
  { value: '36', label: 'Telangana' },
  { value: '37', label: 'Andhra Pradesh' },
  { value: '38', label: 'Ladakh' },
];

// ─── KPI cards (Section: Top of page) ────────────────────────────────────────

export const SUMMARY_CARD_META = [
  { label: 'Taxable Amount', icon: Wallet, variant: 'info', paths: [['summary', 'taxableAmount'], ['summary', 'totalTaxableValue'], ['taxSummary', 'taxableAmount']] },
  { label: 'CGST', icon: Banknote, variant: 'default', paths: [['summary', 'cgst'], ['taxSummary', 'cgst']] },
  { label: 'SGST', icon: Coins, variant: 'default', paths: [['summary', 'sgst'], ['taxSummary', 'sgst']] },
  { label: 'IGST', icon: Landmark, variant: 'default', paths: [['summary', 'igst'], ['taxSummary', 'igst']] },
  { label: 'CESS', icon: PiggyBank, variant: 'default', paths: [['summary', 'cess'], ['taxSummary', 'cess']] },
  { label: 'Total Tax', icon: Receipt, variant: 'warning', paths: [['summary', 'totalTax'], ['summary', 'totalTaxAmount'], ['taxSummary', 'totalTax']] },
  { label: 'Output GST', icon: ArrowUpFromLine, variant: 'success', paths: [['gstLiability', 'outputGst'], ['summary', 'outputGst']] },
  { label: 'Input GST', icon: ArrowDownFromLine, variant: 'info', paths: [['gstLiability', 'inputGst'], ['summary', 'inputGst']] },
  { label: 'Net GST Liability', icon: Scale, variant: 'danger', paths: [['gstLiability', 'netGstLiability'], ['gstLiability', 'netPayable']] },
  { label: 'Available ITC', icon: ShieldCheck, variant: 'success', paths: [['itcSummary', 'availableItc']] },
  { label: 'Utilized ITC', icon: CheckCircle2, variant: 'info', paths: [['itcSummary', 'utilizedItc']] },
  { label: 'Reverse Charge', icon: RotateCcw, variant: 'warning', paths: [['gstLiability', 'reverseCharge']] },
];

// ─── Statistics cards (Section 5) ──────────────────────────────────────────────

export const STATISTICS_CARD_META = [
  { label: 'Sales Invoices', icon: Receipt, variant: 'default', paths: [['statistics', 'salesInvoices'], ['statistics', 'salesInvoiceCount']] },
  { label: 'Purchase Invoices', icon: Receipt, variant: 'default', paths: [['statistics', 'purchaseInvoices'], ['statistics', 'purchaseInvoiceCount']] },
  { label: 'Credit Notes', icon: RotateCcw, variant: 'warning', paths: [['statistics', 'creditNotes'], ['statistics', 'creditNoteCount']] },
  { label: 'Debit Notes', icon: RotateCcw, variant: 'info', paths: [['statistics', 'debitNotes'], ['statistics', 'debitNoteCount']] },
  { label: 'Customers', icon: Wallet, variant: 'success', paths: [['statistics', 'customers'], ['statistics', 'customerCount']] },
  { label: 'Vendors', icon: Banknote, variant: 'danger', paths: [['statistics', 'vendors'], ['statistics', 'vendorCount']] },
  { label: 'Total Transactions', icon: BarChart3, variant: 'primary', paths: [['statistics', 'totalTransactions'], ['statistics', 'totalCount']] },
];

// ─── Sections 1–5 field lists ────────────────────────────────────────────────

export const SUMMARY_SECTIONS = [
  {
    key: 'taxSummary',
    title: 'Tax Summary',
    description: 'Period-wise outward / inward tax accrual',
    icon: Receipt,
    fields: [
      { label: 'Taxable Amount', paths: [['taxableAmount'], ['taxableValue']] },
      { label: 'CGST', paths: [['cgst']] },
      { label: 'SGST', paths: [['sgst']] },
      { label: 'IGST', paths: [['igst']] },
      { label: 'CESS', paths: [['cess']] },
      { label: 'Total Tax', paths: [['totalTax'], ['totalTaxAmount']] },
    ],
  },
  {
    key: 'itcSummary',
    title: 'ITC Summary',
    description: 'Input tax credit position',
    icon: ShieldCheck,
    fields: [
      { label: 'Opening ITC', paths: [['openingItc']] },
      { label: 'Available ITC', paths: [['availableItc']] },
      { label: 'Eligible ITC', paths: [['eligibleItc']] },
      { label: 'Blocked ITC', paths: [['blockedItc']] },
      { label: 'Reversed ITC', paths: [['reversedItc']] },
      { label: 'Utilized ITC', paths: [['utilizedItc']] },
      { label: 'Closing ITC', paths: [['closingItc']] },
    ],
  },
  {
    key: 'gstLiability',
    title: 'GST Liability',
    description: 'Payable / refundable position',
    icon: Scale,
    fields: [
      { label: 'Output GST', paths: [['outputGst']] },
      { label: 'Input GST', paths: [['inputGst']] },
      { label: 'Reverse Charge', paths: [['reverseCharge']] },
      { label: 'Interest', paths: [['interest']] },
      { label: 'Late Fee', paths: [['lateFee']] },
      { label: 'Net GST Liability', paths: [['netGstLiability'], ['netPayable']] },
    ],
  },
  {
    key: 'supplySummary',
    title: 'Supply Summary',
    description: 'Supply type breakup',
    icon: ArrowUpFromLine,
    fields: [
      { label: 'Taxable Supply', paths: [['taxable'], ['taxableSupply']] },
      { label: 'Zero Rated', paths: [['zeroRated']] },
      { label: 'Nil Rated', paths: [['nilRated']] },
      { label: 'Exempt', paths: [['exempt'], ['exemptSupply']] },
      { label: 'Export', paths: [['export'], ['exportSupply']] },
      { label: 'Import', paths: [['import'], ['importSupply']] },
      { label: 'SEZ Supply', paths: [['sez'], ['sezSupply']] },
      { label: 'Interstate Supply', paths: [['interstate'], ['interstateSupply']] },
      { label: 'Intrastate Supply', paths: [['intrastate'], ['intrastateSupply']] },
    ],
  },
  {
    key: 'statistics',
    title: 'Statistics',
    description: 'Document and party counts',
    icon: BarChart3,
    fields: [
      { label: 'Sales Invoices', paths: [['salesInvoices'], ['salesInvoiceCount']], count: true },
      { label: 'Purchase Invoices', paths: [['purchaseInvoices'], ['purchaseInvoiceCount']], count: true },
      { label: 'Credit Notes', paths: [['creditNotes'], ['creditNoteCount']], count: true },
      { label: 'Debit Notes', paths: [['debitNotes'], ['debitNoteCount']], count: true },
      { label: 'Customers', paths: [['customers'], ['customerCount']], count: true },
      { label: 'Vendors', paths: [['vendors'], ['vendorCount']], count: true },
      { label: 'Total Transactions', paths: [['totalTransactions'], ['totalCount']], count: true },
    ],
  },
];

// ─── Section 6 chart definitions ─────────────────────────────────────────────

export const CHART_DEFINITIONS = [
  {
    key: 'monthlyTaxTrend',
    title: 'Monthly Tax Trend',
    type: 'area',
    xKey: 'month',
    series: [
      { dataKey: 'taxableAmount', name: 'Taxable Amount', color: '#6366f1' },
      { dataKey: 'totalTax', name: 'Total Tax', color: '#10b981' },
    ],
  },
  {
    key: 'monthlyItcTrend',
    title: 'Monthly ITC Trend',
    type: 'area',
    xKey: 'month',
    series: [
      { dataKey: 'availableItc', name: 'Available ITC', color: '#0ea5e9' },
      { dataKey: 'utilizedItc', name: 'Utilized ITC', color: '#f59e0b' },
    ],
  },
  {
    key: 'monthlyLiabilityTrend',
    title: 'Monthly Liability Trend',
    type: 'bar',
    xKey: 'month',
    series: [
      { dataKey: 'outputGst', name: 'Output GST', color: '#6366f1' },
      { dataKey: 'inputGst', name: 'Input GST', color: '#10b981' },
      { dataKey: 'netGstLiability', name: 'Net Liability', color: '#ef4444' },
    ],
  },
  {
    key: 'gstDistribution',
    title: 'GST Distribution',
    type: 'pie',
    series: [
      { dataKey: 'cgst', name: 'CGST', color: '#6366f1' },
      { dataKey: 'sgst', name: 'SGST', color: '#10b981' },
      { dataKey: 'igst', name: 'IGST', color: '#f59e0b' },
      { dataKey: 'cess', name: 'CESS', color: '#ef4444' },
    ],
  },
  {
    key: 'stateWiseTax',
    title: 'State Wise Tax',
    type: 'bar',
    xKey: 'state',
    series: [{ dataKey: 'tax', name: 'Tax', color: '#8b5cf6' }],
  },
  {
    key: 'hsnWiseTax',
    title: 'HSN Wise Tax',
    type: 'bar',
    xKey: 'hsn',
    series: [{ dataKey: 'tax', name: 'Tax', color: '#0ea5e9' }],
  },
];

// ─── Section 7 export options ────────────────────────────────────────────────

export const EXPORT_FORMATS = [
  { type: 'pdf', label: 'PDF' },
  { type: 'excel', label: 'Excel' },
  { type: 'csv', label: 'CSV' },
];

// ─── Default Filters and Indian Financial Year Helpers ───────────────────────

/**
 * Calculates dynamic Indian Financial Year dates (April 1 through March 31).
 * From Date: First day of current financial year (April 1).
 * To Date: Today's date (formatted as ISO YYYY-MM-DD).
 * For months Jan-Mar (0, 1, 2), financial year started on April 1 of previous calendar year.
 * For months Apr-Dec (3..11), financial year started on April 1 of current calendar year.
 *
 * @param {Date} [referenceDate=new Date()]
 * @returns {{ fromDate: string, toDate: string }}
 */
export function getIndianFinancialYearDates(referenceDate = new Date()) {
  const d = referenceDate instanceof Date && !isNaN(referenceDate.getTime()) ? referenceDate : new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 2 = Mar, 3 = Apr, ..., 11 = Dec
  const date = d.getDate();

  const fyStartYear = month >= 3 ? year : year - 1;
  const pad = (n) => String(n).padStart(2, '0');

  return {
    fromDate: `${fyStartYear}-04-01`,
    toDate: `${year}-${pad(month + 1)}-${pad(date)}`,
  };
}

/**
 * Default filter object for the GST Summary Dashboard.
 *
 * @param {string} [companyId='']
 * @param {Date} [referenceDate=new Date()]
 * @returns {object}
 */
export function getDefaultGstSummaryFilters(companyId = '', referenceDate = new Date()) {
  const { fromDate, toDate } = getIndianFinancialYearDates(referenceDate);
  return {
    companyId: companyId || '',
    branchId: '',
    gstRegistrationId: '',
    financialYearId: '',
    fromDate,
    toDate,
    invoiceType: 'ALL',
    stateCode: '',
    gstRate: '',
    hsn: '',
    customerId: '',
    vendorId: '',
    sortBy: 'invoiceDate',
    sortDirection: 'DESC',
    pageSize: '20',
  };
}

/**
 * Finds the current financial year from a list of fiscal year records.
 * Matches by explicit active status, date range inclusion, or year label.
 *
 * @param {Array} fiscalYears
 * @param {Date} [referenceDate=new Date()]
 * @returns {object|null}
 */
export function findCurrentFiscalYear(fiscalYears = [], referenceDate = new Date()) {
  if (!Array.isArray(fiscalYears) || fiscalYears.length === 0) return null;

  // 1. Check by date range: today falling between startDate and endDate
  const { toDate: todayStr } = getIndianFinancialYearDates(referenceDate);
  const byDate = fiscalYears.find((fy) => {
    const start = String(fy.startDate || '').slice(0, 10);
    const end = String(fy.endDate || '').slice(0, 10);
    return Boolean(start && end && todayStr >= start && todayStr <= end);
  });
  if (byDate) return byDate;

  // 2. Explicit active flag/status
  const active = fiscalYears.find((fy) => fy.isActive === true || fy.status === 'ACTIVE');
  if (active) return active;

  // 3. Check by FY label/name containing the start year (e.g. 2026)
  const { fromDate } = getIndianFinancialYearDates(referenceDate);
  const fyStartYear = fromDate.slice(0, 4);
  const byName = fiscalYears.find((fy) => {
    const label = String(fy.name || fy.fiscalYear || fy.code || fy.year || '');
    return label.includes(fyStartYear);
  });
  if (byName) return byName;

  return null;
}

/**
 * Cleans a filter value so placeholder labels like "All Branches" or empty strings are represented as null for backend UUIDs.
 *
 * @param {string|null|undefined} val
 * @returns {string|null}
 */
export function cleanFilterId(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith('all ') || trimmed.toLowerCase().startsWith('select ')) {
    return null;
  }
  return trimmed;
}

/**
 * Normalizes and validates an ISO YYYY-MM-DD date string.
 *
 * @param {string|null|undefined} val
 * @returns {string|null}
 */
export function cleanFilterDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * Normalizes filter state into a clean payload for the backend API.
 * Ensures IDs are UUIDs or null, dropdown defaults are properly mapped,
 * dates are valid ISO strings, and the company ID is included.
 *
 * @param {object} filters
 * @param {string} [fallbackCompanyId='']
 * @returns {object}
 */
export function buildGstSummaryPayload(filters = {}, fallbackCompanyId = '') {
  const effectiveCompanyId = cleanFilterId(filters.companyId) || cleanFilterId(fallbackCompanyId);

  return {
    companyId: effectiveCompanyId,
    branchId: cleanFilterId(filters.branchId),
    gstRegistrationId: cleanFilterId(filters.gstRegistrationId),
    financialYearId: cleanFilterId(filters.financialYearId),
    fromDate: cleanFilterDate(filters.fromDate),
    toDate: cleanFilterDate(filters.toDate),
    invoiceType:
      filters.invoiceType && !filters.invoiceType.toLowerCase().startsWith('all ')
        ? filters.invoiceType
        : 'ALL',
    stateCode:
      filters.stateCode && !filters.stateCode.toLowerCase().startsWith('all ')
        ? filters.stateCode.trim()
        : '',
    gstRate:
      filters.gstRate === '' || filters.gstRate === null || filters.gstRate === undefined || isNaN(Number(filters.gstRate))
        ? null
        : Number(filters.gstRate),
    hsn:
      filters.hsn && !filters.hsn.toLowerCase().startsWith('all ')
        ? filters.hsn.trim()
        : '',
    customerId: cleanFilterId(filters.customerId),
    vendorId: cleanFilterId(filters.vendorId),
    page: 0,
    size: Number(filters.pageSize) || 20,
    sortBy: filters.sortBy || 'invoiceDate',
    sortDirection: filters.sortDirection || 'DESC',
  };
}

