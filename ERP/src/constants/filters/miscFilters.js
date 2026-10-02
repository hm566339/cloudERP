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

import { AccountCategoryType, AccountNature, AccountNatureCategory } from '../accountingEnums';

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



export const miscFilters = {
// ━━━ Module Routes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  moduleRoutes: {
    searchParam: 'search',
    fields: [
      { key: 'active', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
    ],
    sortFields: [],
    pagination: PAGESIZE_NOSORT,
  },

  // ━━━ Reports ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  trialBalance: {
    searchParam: 'search',
    fields: [
      { key: 'branchId', label: 'Branch', type: 'select', options: [] },
      { key: 'costCenterId', label: 'Cost Center', type: 'select', options: [] },
      { key: 'projectId', label: 'Project', type: 'select', options: [] },
      { key: 'accountId', label: 'Account', type: 'select', options: [] },
    ],
    sortFields: [
      { label: 'Account Code', value: 'accountCode' },
      { label: 'Account Name', value: 'accountName' },
      { label: 'Opening Balance', value: 'openingBalance' },
      { label: 'Opening Debit', value: 'openingDebit' },
      { label: 'Opening Credit', value: 'openingCredit' },
      { label: 'Debit Total', value: 'debitTotal' },
      { label: 'Credit Total', value: 'creditTotal' },
      { label: 'Closing Balance', value: 'closingBalance' },
    ],
    pagination: SPRING_PAGEABLE,
  },
  
  cashFlow: {
    searchParam: 'search',
    fields: [
      { key: 'category', label: 'Category', type: 'select', options: [] },
    ],
    sortFields: [],
    pagination: SPRING_PAGEABLE,
  },

  // ━━━ Chart of Accounts ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + ChartOfAccountFilterDto
  chartOfAccounts: {
    searchParam: 'searchKey',
    fields: [
      { key: 'accountTypes', label: 'Account Type', type: 'select',
        options: AccountNatureCategory.map(v => ({ label: v.replace(/_/g, ' '), value: v })) },
      { key: 'groupId', label: 'Account Group', type: 'select', options: [] },
      { key: 'postingAllowed', label: 'Posting Allowed', type: 'select',
        options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      { key: 'isActive', label: 'Status', type: 'select',
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
      { key: 'accountCode', label: 'Account Code', type: 'text' },
      { key: 'accountName', label: 'Account Name', type: 'text' },
      { key: 'parentAccountCode', label: 'Parent Account Code', type: 'text' },
      { key: 'minOpeningBalance', label: 'Min Balance', type: 'number' },
      { key: 'maxOpeningBalance', label: 'Max Balance', type: 'number' },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' },
    ],
    sortFields: [
      { label: 'Account Code', value: 'accountCode' },
      { label: 'Account Name', value: 'accountName' },
      { label: 'Created Date', value: 'createdAt' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'accountCode', label: 'Account Code', type: 'text', required: true },
        { key: 'accountName', label: 'Account Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'isActive', label: 'Active', type: 'boolean' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/chart-of-accounts/${id}`,
      update: (id) => `/api/account/chart-of-accounts/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

  // ━━━ Account Categories ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + AccountCategoryFilterDto
  accountCategories: {
    searchParam: 'searchKey',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'codes', label: 'Code', type: 'select',
        options: AccountCategoryType },
      { key: 'natures', label: 'Nature', type: 'select',
        options: AccountNature },
      { key: 'isDeleted', label: 'Deleted', type: 'select',
        options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' },
    ],
    sortFields: [
      { label: 'Code', value: 'code' },
      { label: 'Name', value: 'name' },
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Updated Date', value: 'updatedAt' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'nature', label: 'Nature', type: 'select', required: true,
          options: AccountNatureCategory.map(v => ({ label: v.replace(/_/g, ' '), value: v })) },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/account-categories/${id}`,
      update: (id) => `/api/account/account-categories/${id}`,
      updateMethod: 'PUT',
      idField: 'accountCategoryId',
    },
  },

  // ━━━ Account Groups ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + AccountGroupFilterDto
  accountGroups: {
    searchParam: 'searchKey',
    fields: [
      { key: 'name', label: 'Group Name', type: 'text' },
      { key: 'categoryId', label: 'Category', type: 'select', options: [] },
      { key: 'parentGroupId', label: 'Parent Group', type: 'select', options: [] },
      { key: 'categoryTypes', label: 'Category Type', type: 'select',
        options: AccountCategoryType },
      { key: 'isDeleted', label: 'Deleted', type: 'select',
        options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' },
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Created Date', value: 'createdAt' },
      { label: 'Updated Date', value: 'updatedAt' },
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'categoryId', label: 'Category ID', type: 'text', required: true },
        { key: 'parentGroupId', label: 'Parent Group ID', type: 'text' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/account-groups/${id}`,
      update: (id) => `/api/account/account-groups/${id}`,
      updateMethod: 'PUT',
      idField: 'accountGroupId',
    },
  },

  // ━━━ Accounting Periods ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Swagger: page, size, sortBy, sortDir + AccountingPeriodFilterDto
  accountingPeriods: {
    searchParam: 'searchKey',
    fields: [
      { key: 'fiscalYearId', label: 'Fiscal Year', type: 'select', options: [] },
      { key: 'periodName', label: 'Period Name', type: 'text' },
      { key: 'isClosed', label: 'Is Closed', type: 'select', options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]},
      { key: 'startDateFrom', label: 'Start Date (From)', type: 'date' },
      { key: 'startDateTo', label: 'Start Date (To)', type: 'date' },
      { key: 'endDateFrom', label: 'End Date (From)', type: 'date' },
      { key: 'endDateTo', label: 'End Date (To)', type: 'date' },
      { key: 'createdFrom', label: 'Created From', type: 'date' },
      { key: 'createdTo', label: 'Created To', type: 'date' },
      { key: 'updatedFrom', label: 'Updated From', type: 'date' },
      { key: 'updatedTo', label: 'Updated To', type: 'date' },
    ],
    sortFields: [
      { label: 'Start Date', value: 'startDate' },
      { label: 'End Date', value: 'endDate' },
      { label: 'Period Name', value: 'periodName' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' }
    ],
    pagination: FLAT_PAGE_SIZE_SORT('sortBy', 'sortDir'),
    viewConfig: { hiddenKeys: ['id', 'companyId', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'periodName', label: 'Period Name', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'End Date', type: 'date', required: true },
        { key: 'isClosed', label: 'Is Closed', type: 'boolean' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/accounting-periods/${id}`,
      update: (id) => `/api/account/accounting-periods/${id}`,
      updateMethod: 'PUT',
      idField: 'accountingPeriodId',
    },
  },

  // ━━━ Quotations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  quotations: {
    searchParam: 'searchKey',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Expired', value: 'EXPIRED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      },
      { key: 'piNumber', label: 'PI Number', type: 'text' },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'sourceQuotationId', label: 'Source Quotation ID', type: 'text' },
      { key: 'startDate', label: 'Date From', type: 'date' },
      { key: 'endDate', label: 'Date To', type: 'date' }
    ],
    sortFields: [
      { label: 'Date', value: 'date' },
      { label: 'Customer', value: 'customer' },
      { label: 'Amount', value: 'amount' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Sales Orders ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  salesOrders: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'fromDate', label: 'Date From', type: 'date' },
      { key: 'toDate', label: 'Date To', type: 'date' }
    ],
    sortFields: [
      { label: 'Date', value: 'soDate' },
      { label: 'Customer', value: 'customerName' },
      { label: 'Amount', value: 'totalAmount' },
      { label: 'Created Date', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
  },

  // ━━━ Proforma Invoices ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  proformaInvoices: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        hideAllOption: true,
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Issued', value: 'ISSUED' },
          { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Partially Converted', value: 'PARTIALLY_CONVERTED' },
          { label: 'Fully Converted', value: 'FULLY_CONVERTED' },
          { label: 'Expired', value: 'EXPIRED' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      }
    ],
    sortFields: [
      { label: 'Date', value: 'piDate' },
      { label: 'Customer', value: 'customerName' },
      { label: 'Amount', value: 'totalAmount' },
      { label: 'Created Date', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
  },

  // ━━━ Delivery Challans ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deliveryChallans: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      },
      { key: 'customerId', label: 'Customer', type: 'select', options: [] },
      { key: 'fromDate', label: 'Date From', type: 'date' },
      { key: 'toDate', label: 'Date To', type: 'date' }
    ],
    sortFields: [
      { label: 'Challan Number', value: 'dcNumber' },
      { label: 'Date', value: 'dcDate' },
      { label: 'Customer', value: 'customerName' },
      { label: 'Total Amount', value: 'totalAmount' },
      { label: 'Created Date', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
  },



  // ━━━ Production Orders ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  productionOrders: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Not Started', value: 'Not Started' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Paused', value: 'Paused' },
          { label: 'Completed', value: 'Completed' }
        ]
      }
    ],
    sortFields: [
      { label: 'Order ID', value: 'id' },
      { label: 'Product', value: 'product' },
      { label: 'Start Date', value: 'startDate' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Batches ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  batches: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'QC Status', type: 'select', priority: true,
        options: [
          { label: 'Passed', value: 'Passed' },
          { label: 'Rejected', value: 'Rejected' },
          { label: 'Pending', value: 'Pending' }
        ]
      }
    ],
    sortFields: [
      { label: 'Batch ID', value: 'id' },
      { label: 'Product', value: 'product' },
      { label: 'Stage', value: 'stage' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Expenses ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  expenses: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' }
        ]
      },
      { key: 'category', label: 'Category', type: 'select', options: [] }
    ],
    sortFields: [
      { label: 'Date', value: 'date' },
      { label: 'Category', value: 'category' },
      { label: 'Amount', value: 'amount' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

};
