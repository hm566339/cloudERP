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
  DocumentStatus,
  PostingStatus,
  InvoiceStatus,
} from '../accountingEnums.js';

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



export const salesFilters = {
  // ━━━ Customers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  customers: {
    searchParam: 'query',
    fields: [
      { key: 'isActive', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
      { key: 'customerCode', label: 'Customer Code', type: 'text' },
      { key: 'customerName', label: 'Customer Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'gstin', label: 'GSTIN', type: 'text' },
      { key: 'pan', label: 'PAN', type: 'text' },
      { key: 'createdAt', label: 'Created Date', type: 'dateRange', priority: true, startKey: 'createdFrom', endKey: 'createdTo' },
      { key: 'updatedAt', label: 'Updated Date', type: 'dateRange', startKey: 'updatedFrom', endKey: 'updatedTo' },
      { key: 'city', label: 'City', type: 'select', priority: true, options: [] },
      { key: 'state', label: 'State', type: 'select', options: [] },
      { key: 'country', label: 'Country', type: 'select', options: [] },
      { key: 'minCreditLimit', label: 'Min Credit Limit', type: 'number' },
      { key: 'maxCreditLimit', label: 'Max Credit Limit', type: 'number' },
    ],
    sortFields: [
      { label: 'Name', value: 'customerName' },
      { label: 'Date Joined', value: 'createdAt' },
      { label: 'Location (City)', value: 'city' },
      { label: 'Outstanding Balance', value: 'outstandingBalance' },
      { label: 'Status', value: 'isActive' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'customerCode', label: 'Customer Code', type: 'text', maxLength: 50 },
        { key: 'customerName', label: 'Customer Name', type: 'text', required: true, maxLength: 100 },
        { key: 'email', label: 'Email', type: 'text', pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", title: "Valid email address required" },
        { key: 'phone', label: 'Phone', type: 'text', pattern: "^[0-9+\\-()\\s]{10,15}$", title: "Valid phone number required" },
        { key: 'gstin', label: 'GSTIN', type: 'text', pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", title: "Must be a valid 15-character GSTIN", uppercase: true },
        { key: 'panNo', label: 'PAN No', type: 'text', pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", title: "Must be a valid 10-character PAN", uppercase: true },
        { key: 'addressLine1', label: 'Address', type: 'text', maxLength: 255 },
        { key: 'city', label: 'City', type: 'text', maxLength: 100 },
        { key: 'state', label: 'State', type: 'text', maxLength: 100 },
        { key: 'country', label: 'Country', type: 'text', maxLength: 100 },
        { key: 'creditLimit', label: 'Credit Limit', type: 'number' },
        { key: 'isActive', label: 'Is Active', type: 'boolean', defaultValue: true },
      ]
    },
    endpoints: {
      getById: (id) => `/api/account/customers/${id}`,
      update: (id) => `/api/account/customers/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

  // ━━━ Credit Notes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  creditNotes: {
    searchParam: 'searchKey',
    fields: [
      { key: 'creditNoteNo', label: 'Credit Note No', type: 'text' },
      { key: 'referenceNo', label: 'Reference No', type: 'text' },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'salesInvoiceId', label: 'Sales Invoice', type: 'select', options: [] },
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
      { label: 'Credit Note No', value: 'creditNoteNo' },
      { label: 'Note Date', value: 'noteDate' },
      { label: 'Amount', value: 'amount' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: {
      hiddenKeys: ['id', 'companyId', 'isDeleted', 'glJournalEntryId', 'receivableAccountId', 'revenueAdjustmentAccountId']
    },
    updateConfig: {
      fields: [
        { key: 'noteDate', label: 'Note Date', type: 'date', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'gstAmount', label: 'GST Amount', type: 'number' },
        { key: 'referenceNo', label: 'Reference No', type: 'text' },
        { key: 'reason', label: 'Reason', type: 'text' }
      ]
    }
  },

  // ━━━ Quotations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  quotations: {
    searchParam: 'searchKey',
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        hideAllOption: true,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
          { label: 'Customer Accepted', value: 'CUSTOMER_ACCEPTED' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Converted', value: 'CONVERTED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Expired', value: 'EXPIRED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      },
      { key: 'quotationDateFrom', label: 'Date From', type: 'date' },
      { key: 'quotationDateTo', label: 'Date To', type: 'date' },
      { key: 'validUntilFrom', label: 'Valid Until From', type: 'date' },
      { key: 'validUntilTo', label: 'Valid Until To', type: 'date' },
      { key: 'customerName', label: 'Customer', type: 'select', options: [] }
    ],
    sortFields: [
      { label: 'Date', value: 'quotationDate' },
      { label: 'Total Amount', value: 'totalAmount' },
      { label: 'Outstanding Amount', value: 'outstandingAmount' },
      { label: 'Created Date', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId'] },
    updateConfig: { fields: [] }
  },

  // ━━━ Sales Invoices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  salesInvoices: {
    searchParam: 'searchKey',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'statuses', label: 'Status', type: 'select', priority: true,
        options: InvoiceStatus },
      { key: 'postingStatuses', label: 'Posting Status', type: 'select',
        options: PostingStatus },
      { key: 'invoiceCurrency', label: 'Currency', type: 'text' },
      { key: 'invoiceDateFrom', label: 'Date From', type: 'date' },
      { key: 'invoiceDateTo', label: 'Date To', type: 'date' },
      { key: 'dueDateFrom', label: 'Due Date From', type: 'date' },
      { key: 'dueDateTo', label: 'Due Date To', type: 'date' },
      { key: 'minTotalAmount', label: 'Min Amount', type: 'number' },
      { key: 'maxTotalAmount', label: 'Max Amount', type: 'number' },
      { key: 'minOutstandingAmount', label: 'Min Outstanding', type: 'number' },
      { key: 'maxOutstandingAmount', label: 'Max Outstanding', type: 'number' },
      { key: 'hasOutstandingBalance', label: 'Has Outstanding', type: 'select',
        options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      { key: 'isOverdue', label: 'Overdue Only', type: 'select',
        options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      { key: 'approvedBy', label: 'Approved By', type: 'text' },
      { key: 'postedBy', label: 'Posted By', type: 'text' }
    ],
    sortFields: [
      { label: 'Invoice Date', value: 'invoiceDate' },
      { label: 'Invoice No', value: 'invoiceNumber' },
      { label: 'Due Date', value: 'dueDate' },
      { label: 'Total Amount', value: 'totalAmount' },
      { label: 'Outstanding Amount', value: 'outstandingAmount' },
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Updated Date', value: 'updatedAt' },
      { label: 'Days Outstanding', value: 'daysOutstanding' },
      { label: 'Customer Name', value: 'customerName' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId', 'customerId', 'isDeleted', 'glJournalEntryId', 'lineItems'] },
    updateConfig: {
      fields: [
        { key: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
        { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { key: 'invoiceCurrency', label: 'Currency', type: 'text', required: true },
        { key: 'exchangeRate', label: 'Exchange Rate', type: 'number' },
        { key: 'placeOfSupply', label: 'Place of Supply', type: 'text' },
        { key: 'referenceNumber', label: 'Reference Number', type: 'text' },
        { key: 'businessDescription', label: 'Business Description', type: 'text' },
        { key: 'remarks', label: 'Remarks', type: 'text' }
      ]
    },
    endpoints: {
      getById: (id) => `/api/account/sales/invoices/${id}`,
      update: (id) => `/api/account/sales/invoices/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

  // ━━━ Invoice Taxes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  invoiceTaxes: {
    searchParam: 'searchKey',
    fields: [
      { key: 'gstSlabId', label: 'GST Slab', type: 'select', options: [] },
      { key: 'isDeleted', label: 'Is Deleted', type: 'select', options: [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}] },
      { key: 'minTaxableAmount', label: 'Min Taxable Amount', type: 'number' },
      { key: 'maxTaxableAmount', label: 'Max Taxable Amount', type: 'number' },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' }
    ],
    sortFields: [
      { label: 'GST Slab', value: 'gstSlabName' },
      { label: 'Taxable Amount', value: 'taxableAmount' },
      { label: 'CGST Amount', value: 'cgstAmount' },
      { label: 'SGST Amount', value: 'sgstAmount' },
      { label: 'IGST Amount', value: 'igstAmount' },
      { label: 'Cess Amount', value: 'cessAmount' },
      { label: 'Created Date', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'companyId', 'salesInvoiceId'] },
    updateConfig: { fields: [] }
  },

  // ━━━ CRM Leads ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  leads: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true, options: [] },
      { key: 'leadSource', label: 'Lead Source', type: 'select', priority: true, options: [] },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' },
    ],
    sortFields: [
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Lead Name', value: 'displayName' },
      { label: 'Company Name', value: 'organizationName' },
      { label: 'Lead Score', value: 'leadScore' },
      { label: 'Annual Revenue', value: 'annualRevenue' },
      { label: 'Next Follow Up', value: 'nextFollowUpDate' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { hiddenKeys: ['id', 'tenantId', 'companyId', 'isDeleted'] },
    updateConfig: { fields: [] }
  }
};
