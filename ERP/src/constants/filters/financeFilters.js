/**
 * Filter Configurations — API-driven filter/sort/pagination configs for every list endpoint.
 *
 * Each key maps a resource name to:
 *   - fields[]:        filter controls rendered in the filter bar
 *   - sortFields[]:    sort dropdown options
 *   - pagination:      how this endpoint's pagination/sort query params are named
 *   - viewConfig:      field display config for View Details modal
 *   - updateConfig:    field config for Update modal form
 *   - endpoints:       route helpers for get-by-id / update
 *
 * Field types: 'text' | 'select' | 'date' | 'boolean' | 'number'
 * Sort styles: 'spring' (single `sort=field,dir`) | 'explicit' (separate sortBy + direction params)
 */

import {
  PaymentMode,
  BankAccountType,
  BankTransactionType,
  PostingStatus,
  HsnSacType,
  PaymentVoucherStatus,
  PaymentStatus,
  SourceModule,
} from '../accountingEnums';

// ─── Pagination Presets ──────────────────────────────────────────────
const SPRING_PAGEABLE = { pageParam: 'page', sizeParam: 'size', sortStyle: 'spring', sortParam: 'sort' };
const EXPLICIT_PAGE_SIZE = (sortByParam = 'sortBy', dirParam = 'sortDirection') => ({
  pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam, dirParam,
});
// Type B variant: page+size+sortBy+sortDir (flat)
const FLAT_PAGE_SIZE_SORT = (sortByParam = 'sortBy', dirParam = 'sortDir') => ({
  pageParam: 'page', sizeParam: 'size', sortStyle: 'explicit', sortByParam, dirParam,
});
// Type C: page+pageSize only, no sort (server decides)
const PAGESIZE_NOSORT = { pageParam: 'page', sizeParam: 'pageSize' };

// ─── Helper: format enum values for display ──────────────────────────
const enumOptions = (values) => values.map(v => ({ label: v.replace(/_/g, ' '), value: v }));

// ─── FILTER CONFIGS ──────────────────────────────────────────────────



export const financeFilters = {





  // ━━━ Journal Entries ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  journalEntries: {
    searchParam: 'searchKey',
    fields: [
      { key: 'voucherNo', label: 'Voucher No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Posted', value: 'POSTED' }, { label: 'Approved', value: 'APPROVED' }] },
      { key: 'accountId', label: 'Account', type: 'select', options: [] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    sortFields: [
      { label: 'Voucher Date', value: 'voucherDate' },
      { label: 'Created At', value: 'createdAt' }
    ],
    pagination: FLAT_PAGE_SIZE_SORT(),
  },

  // ━━━ Journal Lines ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  journalLines: {
    searchParam: 'description',
    fields: [
      { key: 'journalEntryId', label: 'Journal', type: 'select', options: [] },
      { key: 'accountId', label: 'Account', type: 'select', options: [] },
      { key: 'minDebitAmount', label: 'Min Debit', type: 'number' },
      { key: 'maxDebitAmount', label: 'Max Debit', type: 'number' },
      { key: 'minCreditAmount', label: 'Min Credit', type: 'number' },
      { key: 'maxCreditAmount', label: 'Max Credit', type: 'number' },
      { key: 'currencyCode', label: 'Currency', type: 'text' },
      { key: 'departmentId', label: 'Department', type: 'text' },
      { key: 'costCenter', label: 'Cost Center', type: 'text' },
      { key: 'referenceNumber', label: 'Reference No.', type: 'text' },
      { key: 'isDeleted', label: 'Deleted Only', type: 'select', options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] }
    ],
    sortFields: [
      { label: 'Debit', value: 'debitAmount' },
      { label: 'Credit', value: 'creditAmount' }
    ],
    pagination: FLAT_PAGE_SIZE_SORT(),
  },

  // ━━━ Receipt Vouchers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  receiptVouchers: {
    searchParam: 'searchKey',
    fields: [
      { key: 'receiptNo', label: 'Receipt No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'salesInvoiceId', label: 'Sales Invoice', type: 'select', options: [] },
      { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: PaymentMode },
      { key: 'minAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxAmount', label: 'Max Amount', type: 'number' },
      { key: 'receiptDateFrom', label: 'Receipt Date From', type: 'date' },
      { key: 'receiptDateTo', label: 'Receipt Date To', type: 'date' },
    ],
    sortFields: [
      { label: 'Receipt No', value: 'receiptNo' },
      { label: 'Receipt Date', value: 'receiptDate' },
      { label: 'Amount', value: 'receiptAmount' }
    ],
    pagination: SPRING_PAGEABLE,
  },


  // ━━━ Bank Accounts ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    bankAccounts: {
    searchParam: 'searchKey',
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'select', options: [] },
      { key: 'accountTypes', label: 'Account Type', type: 'select', priority: true,
        options: BankAccountType },
      { key: 'isActive', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
      { key: 'branchName', label: 'Branch Name', type: 'text' },
      { key: 'accountNumber', label: 'Account Number', type: 'text' },
      { key: 'ifscCode', label: 'IFSC Code', type: 'text' },
      { key: 'upiId', label: 'UPI ID', type: 'text' },
      { key: 'minOpeningBalance', label: 'Min Opening Balance', type: 'number' },
      { key: 'maxOpeningBalance', label: 'Max Opening Balance', type: 'number' },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' }
    ],
    sortFields: [
      { label: 'Bank Name', value: 'bankName' },
      { label: 'Created Date', value: 'createdAt' },
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: {
      hiddenKeys: ['id', 'companyId', 'isDeleted'],
    },
    updateConfig: {
      fields: [
        { key: 'slabName', label: 'Slab Name', type: 'text', required: true },
        { key: 'cgstRate', label: 'CGST %', type: 'number' },
        { key: 'sgstRate', label: 'SGST %', type: 'number' },
        { key: 'igstRate', label: 'IGST %', type: 'number' },
        { key: 'cessRate', label: 'CESS %', type: 'number' },
        { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/gst-slabs/${id}`,
      update: (id) => `/api/account/gst-slabs/${id}`,
      updateMethod: 'PUT',
      idField: 'gstSlabId',
    },
  },

  // ━━━ Budget Lines ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + BudgetLineFilterDto
    budgetLines: {
    searchParam: 'searchKeyword',
    fields: [
      { key: 'budgetHeaderId', label: 'Budget Header', type: 'select', options: [] },
      { key: 'accountId', label: 'Account', type: 'select', options: [] },
      { key: 'departmentId', label: 'Department', type: 'select', options: [] },
      { key: 'fiscalYearId', label: 'Fiscal Year', type: 'select', options: [] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' },
      { key: 'minAllocatedAmount', label: 'Min Allocated', type: 'number' },
      { key: 'maxAllocatedAmount', label: 'Max Allocated', type: 'number' },
      { key: 'minUtilizedAmount', label: 'Min Utilized', type: 'number' },
      { key: 'maxUtilizedAmount', label: 'Max Utilized', type: 'number' },
      { key: 'minRemainingAmount', label: 'Min Remaining', type: 'number' },
      { key: 'maxRemainingAmount', label: 'Max Remaining', type: 'number' },
      { key: 'isDeleted', label: 'Deleted', type: 'select', options: [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}] }
    ],
    sortFields: [
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Allocated Amount', value: 'allocatedAmount' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
  },

  // ━━━ Fiscal Years ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + FiscalYearFilterDto
  fiscalYears: {
    searchParam: 'searchKey',
    fields: [
      { key: 'fiscalYearName', label: 'Fiscal Year Name', type: 'text' },
      { key: 'isClosed', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Closed', value: 'true' }, { label: 'Open', value: 'false' }] },
      { key: 'startDateFrom', label: 'Start Date From', type: 'date' },
      { key: 'startDateTo', label: 'Start Date To', type: 'date' },
      { key: 'endDateFrom', label: 'End Date From', type: 'date' },
      { key: 'endDateTo', label: 'End Date To', type: 'date' },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' }
    ],
    sortFields: [
      { label: 'Start Date', value: 'startDate' },
      { label: 'End Date', value: 'endDate' },
      { label: 'Name', value: 'fiscalYear' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
  },

  // ━━━ Payment Vouchers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  paymentVouchers: {
    ...SPRING_PAGEABLE,
    searchParam: 'searchKey',
    fields: [
      { key: 'vendorId', label: 'Vendor', type: 'select', priority: true, options: [] },
      { key: 'bankAccountId', label: 'Bank Account', type: 'select', priority: true, options: [] },
      { key: 'paymentModes', label: 'Payment Mode', type: 'select',
        options: PaymentMode },
      { key: 'paymentStatuses', label: 'Payment Status', type: 'select',
        options: PaymentVoucherStatus },
      { key: 'glPostingStatuses', label: 'GL Status', type: 'select',
        options: PostingStatus },
      { key: 'voucherDateFrom', label: 'Date From', type: 'date' },
      { key: 'voucherDateTo', label: 'Date To', type: 'date' },
      { key: 'minAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxAmount', label: 'Max Amount', type: 'number' },
      { key: 'voucherNo', label: 'Voucher No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
    ],
    sortFields: [
      { label: 'Voucher No', value: 'voucherNo' },
      { label: 'Voucher Date', value: 'voucherDate' },
      { label: 'Amount', value: 'paymentAmount' }
    ],
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted', 'vendorId', 'bankAccountId', 'payableAccountId', 'paymentAccountId', 'allocations'] },
    updateConfig: {
      fields: [
        { key: 'voucherNo', label: 'Voucher Number', type: 'text', required: true },
        { key: 'voucherDate', label: 'Voucher Date', type: 'date', required: true },
        { key: 'paymentAmount', label: 'Payment Amount', type: 'number', required: true },
        { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: PaymentMode },
        { key: 'referenceNo', label: 'Reference No', type: 'text' },
        { key: 'remarks', label: 'Remarks', type: 'text' }
      ]
    },
    endpoints: {
      getById: (id) => `/api/account/payment-vouchers/${id}`,
      update: (id) => `/api/account/payment-vouchers/${id}`,
      updateMethod: 'PUT',
      idField: 'voucherId',
    },
  },

  // ━━━ Budget Headers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + BudgetHeaderFilterDto
    budgetHeaders: {
    searchParam: 'searchKey',
    fields: [
      { key: 'fiscalYearId', label: 'Fiscal Year', type: 'select', options: [] },
      { key: 'minTotalBudget', label: 'Min Total Budget', type: 'number' },
      { key: 'maxTotalBudget', label: 'Max Total Budget', type: 'number' },
      { key: 'isDeleted', label: 'Deleted', type: 'select', options: [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}] }
    ],
    sortFields: [
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Budget Name', value: 'budgetName' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
  },

  // ━━━ AP Payments ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, pageSize + ApPaymentFilterDto (Type C)
    apPayments: {
    searchParam: 'searchKeyword',
    fields: [
      { key: 'vendorId', label: 'Vendor', type: 'select', priority: true, options: [] },
      { key: 'paymentNo', label: 'Payment No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
      { key: 'paymentMode', label: 'Payment Mode', type: 'select', priority: true, options: PaymentMode },
      { key: 'paymentStatus', label: 'Payment Status', type: 'select', priority: true, options: PaymentStatus },
      { key: 'glPostingStatus', label: 'GL Status', type: 'select', options: PostingStatus },
      { key: 'fromPaymentDate', label: 'Payment Date From', type: 'date' },
      { key: 'toPaymentDate', label: 'Payment Date To', type: 'date' },
      { key: 'minPaymentAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxPaymentAmount', label: 'Max Amount', type: 'number' },
      { key: 'minAllocatedAmount', label: 'Min Allocated', type: 'number' },
      { key: 'maxAllocatedAmount', label: 'Max Allocated', type: 'number' },
      { key: 'glJournalEntryId', label: 'GL Journal Entry ID', type: 'text' },
      { key: 'fromCreatedDate', label: 'Created From', type: 'date' },
      { key: 'toCreatedDate', label: 'Created To', type: 'date' },
      { key: 'isDeleted', label: 'Deleted', type: 'select', options: [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}] }
    ],
    sortFields: [
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Payment Date', value: 'paymentDate' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted', 'vendorId'] },
    updateConfig: {
      fields: [
        { key: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'referenceNo', label: 'Reference No', type: 'text' },
        { key: 'narration', label: 'Narration', type: 'text' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/ap-payments/${id}`,
      update: (id) => `/api/account/ap-payments/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },
  // ━━━ HSN Codes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  hsnCodes: {
    searchParam: 'search',
    fields: [
      { key: 'category', label: 'Category', type: 'select', options: [] }
    ],
    sortFields: [
      { label: 'HSN Code', value: 'code' },
      { label: 'GST Rate', value: 'gstRate' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

};
