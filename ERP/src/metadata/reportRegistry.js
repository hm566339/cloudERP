/**
 * Unified Backend Report Registry
 * Single Source of Truth for all Financial and GST Report Definitions
 */
export const REPORT_REGISTRY = {
  'trial-balance': {
    id: 'trial-balance',
    title: 'Trial Balance',
    subtitle: 'Summary of all ledger balances as of a specified date',
    endpoint: '/api/account/reports/trial-balance',
    exportEndpoint: '/api/account/reports/trial-balance/export',
    permission: 'REPORTS:READ',
    filters: [
      { name: 'asOfDate', label: 'As of Date', type: 'date', required: true, defaultToday: true },
      { name: 'fiscalYearId', label: 'Fiscal Year', type: 'relation', relationResource: 'fiscal-years' }
    ],
    columns: [
      { id: 'accountCode', header: 'Code', accessorKey: 'accountCode', type: 'text' },
      { id: 'accountName', header: 'Account Name', accessorKey: 'accountName', type: 'text' },
      { id: 'accountGroup', header: 'Group', accessorKey: 'accountGroup', type: 'text' },
      { id: 'debitAmount', header: 'Debit (Dr)', accessorKey: 'debitAmount', type: 'currency' },
      { id: 'creditAmount', header: 'Credit (Cr)', accessorKey: 'creditAmount', type: 'currency' }
    ],
    totals: ['debitAmount', 'creditAmount']
  },
  'profit-loss': {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    subtitle: 'Income statement summarizing revenues, costs, and expenses',
    endpoint: '/api/account/reports/profit-loss',
    exportEndpoint: '/api/account/reports/profit-loss/export',
    permission: 'REPORTS:READ',
    filters: [
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true, defaultToday: true }
    ],
    columns: [
      { id: 'category', header: 'Category', accessorKey: 'category', type: 'text' },
      { id: 'accountName', header: 'Account', accessorKey: 'accountName', type: 'text' },
      { id: 'amount', header: 'Amount', accessorKey: 'amount', type: 'currency' }
    ],
    totals: ['amount']
  },
  'balance-sheet': {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    subtitle: 'Statement of financial position detailing assets, liabilities, and equity',
    endpoint: '/api/account/reports/balance-sheet',
    exportEndpoint: '/api/account/reports/balance-sheet/export',
    permission: 'REPORTS:READ',
    filters: [
      { name: 'asOfDate', label: 'As of Date', type: 'date', required: true, defaultToday: true }
    ],
    columns: [
      { id: 'section', header: 'Section', accessorKey: 'section', type: 'text' },
      { id: 'accountGroup', header: 'Group', accessorKey: 'accountGroup', type: 'text' },
      { id: 'accountName', header: 'Account Name', accessorKey: 'accountName', type: 'text' },
      { id: 'amount', header: 'Balance', accessorKey: 'amount', type: 'currency' }
    ],
    totals: ['amount']
  },
  'cash-flow': {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    subtitle: 'Inflow and outflow of cash across operating, investing, and financing activities',
    endpoint: '/api/account/reports/cash-flow',
    exportEndpoint: '/api/account/reports/cash-flow/export',
    permission: 'REPORTS:READ',
    filters: [
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true, defaultToday: true }
    ],
    columns: [
      { id: 'activityType', header: 'Activity Type', accessorKey: 'activityType', type: 'text' },
      { id: 'description', header: 'Description', accessorKey: 'description', type: 'text' },
      { id: 'amount', header: 'Net Cash', accessorKey: 'amount', type: 'currency' }
    ],
    totals: ['amount']
  },
  'general-ledger': {
    id: 'general-ledger',
    title: 'General Ledger Report',
    subtitle: 'Complete chronological transaction journal lines for an account',
    endpoint: '/api/account/reports/general-ledger',
    exportEndpoint: '/api/account/reports/general-ledger/export',
    permission: 'REPORTS:READ',
    filters: [
      { name: 'accountId', label: 'Account', type: 'relation', relationResource: 'chart-of-accounts', required: true },
      { name: 'fromDate', label: 'From Date', type: 'date', required: true },
      { name: 'toDate', label: 'To Date', type: 'date', required: true, defaultToday: true }
    ],
    columns: [
      { id: 'entryDate', header: 'Date', accessorKey: 'entryDate', type: 'date' },
      { id: 'journalNumber', header: 'Journal #', accessorKey: 'journalNumber', type: 'text' },
      { id: 'description', header: 'Description', accessorKey: 'description', type: 'text' },
      { id: 'debit', header: 'Debit', accessorKey: 'debit', type: 'currency' },
      { id: 'credit', header: 'Credit', accessorKey: 'credit', type: 'currency' },
      { id: 'balance', header: 'Running Balance', accessorKey: 'balance', type: 'currency' }
    ],
    totals: ['debit', 'credit']
  }
};

export function getReportConfig(reportId) {
  return REPORT_REGISTRY[reportId] || null;
}

export default REPORT_REGISTRY;
