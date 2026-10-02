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
  InvoiceStatus,
  DocumentStatus,
  PostingStatus,
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



export const purchaseFilters = {
  // ━━━ Vendors ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  vendors: {
    searchParam: 'searchKey',
    fields: [
      { key: 'vendorCode', label: 'Vendor Code', type: 'text' },
      { key: 'vendorName', label: 'Vendor Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'gstin', label: 'GSTIN', type: 'text' },
      { key: 'pan', label: 'PAN No', type: 'text' },
      { key: 'city', label: 'City', type: 'select', priority: true, options: [] },
      { key: 'state', label: 'State', type: 'select', options: [] },
      { key: 'country', label: 'Country', type: 'select', options: [] },
      { key: 'pinCode', label: 'PIN Code', type: 'text' },
      { key: 'minCreditLimit', label: 'Min Credit Limit', type: 'number' },
      { key: 'maxCreditLimit', label: 'Max Credit Limit', type: 'number' },
      { key: 'isActive', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
      { key: 'createdAt', label: 'Created Date', type: 'dateRange', priority: true, startKey: 'createdFrom', endKey: 'createdTo' },
      { key: 'updatedAt', label: 'Updated Date', type: 'dateRange', startKey: 'updatedFrom', endKey: 'updatedTo' },
    ],
    sortFields: [
      { label: 'Name', value: 'vendorName' },
      { label: 'Code', value: 'vendorCode' },
      { label: 'Date Joined', value: 'createdAt' },
      { label: 'Outstanding Balance', value: 'outstandingBalance' },
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'vendorCode', label: 'Vendor Code', type: 'text' },
        { key: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'gstin', label: 'GSTIN', type: 'text' },
        { key: 'panNo', label: 'PAN No', type: 'text' },
        { key: 'addressLine1', label: 'Address', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'state', label: 'State', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'pinCode', label: 'PIN Code', type: 'text' },
        { key: 'creditLimit', label: 'Credit Limit', type: 'number' },
        { key: 'isActive', label: 'Is Active', type: 'boolean', defaultValue: true },
      ]
    },
    endpoints: {
      getById: (id) => `/api/account/v1/vendors/${id}`,
      update: (id) => `/api/account/v1/vendors/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },


  // ━━━ AP Invoices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, direction + ApInvoiceFilterDto
  apInvoices: {
    searchParam: 'searchKey',
    fields: [
      { key: 'vendorId', label: 'Vendor', type: 'select', options: [] },
      { key: 'invoiceNo', label: 'Invoice No', type: 'text' },
      { key: 'invoiceCurrency', label: 'Currency', type: 'text' },
      { key: 'statuses', label: 'Status', type: 'select', priority: true,
        options: InvoiceStatus },
      { key: 'minOutstandingAmount', label: 'Min Outstanding', type: 'number' },
      { key: 'maxOutstandingAmount', label: 'Max Outstanding', type: 'number' },
      { key: 'approvedBy', label: 'Approved By', type: 'text' },
      { key: 'invoiceDateFrom', label: 'Date From', type: 'date' },
      { key: 'invoiceDateTo', label: 'Date To', type: 'date' },
      { key: 'dueDateFrom', label: 'Due Date From', type: 'date' },
      { key: 'dueDateTo', label: 'Due Date To', type: 'date' },
      { key: 'minTotalAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxTotalAmount', label: 'Max Amount', type: 'number' },
      { key: 'hasOutstandingBalance', label: 'Has Outstanding', type: 'select',
        options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      { key: 'isOverdue', label: 'Overdue Only', type: 'select',
        options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    ],
    sortFields: [
      { label: 'Invoice Date', value: 'invoiceDate' },
      { label: 'Due Date', value: 'dueDate' },
      { label: 'Total Amount', value: 'totalAmount' },
      { label: 'Outstanding Amount', value: 'outstandingAmount' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'direction'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted', 'vendorId', 'glJournalEntryId', 'lineItems'] },
    updateConfig: {
      fields: [
        { key: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
        { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { key: 'referenceNumber', label: 'Reference Number', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'text' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/invoices/${id}`,
      update: (id) => `/api/account/invoices/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

  // ━━━ Debit Notes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  debitNotes: {
    searchParam: 'searchKey',
    fields: [
      { key: 'debitNoteNo', label: 'Debit Note No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
      { key: 'vendorId', label: 'Vendor', type: 'select', options: [] },
      { key: 'apInvoiceId', label: 'AP Invoice', type: 'select', options: [] },
      { key: 'statuses', label: 'Status', type: 'select', priority: true,
        options: DocumentStatus },
      { key: 'glPostingStatuses', label: 'GL Status', type: 'select',
        options: PostingStatus },
      { key: 'minAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxAmount', label: 'Max Amount', type: 'number' },
      { key: 'noteDateFrom', label: 'Note Date From', type: 'date' },
      { key: 'noteDateTo', label: 'Note Date To', type: 'date' }
    ],
    sortFields: [
      { label: 'Debit Note No', value: 'debitNoteNo' },
      { label: 'Note Date', value: 'noteDate' },
      { label: 'Amount', value: 'amount' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted', 'vendorId'] },
    updateConfig: {
      fields: [
        { key: 'noteDate', label: 'Note Date', type: 'date', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'gstAmount', label: 'GST Amount', type: 'number' },
        { key: 'referenceNo', label: 'Reference No', type: 'text' },
        { key: 'reason', label: 'Reason', type: 'text' }
      ]
    },
    endpoints: {
      getById: (id) => `/api/account/debit-notes/${id}`,
      update: (id) => `/api/account/debit-notes/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

};
