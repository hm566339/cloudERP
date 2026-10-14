import {
  LayoutDashboard, Database, TrendingUp, LineChart,
  PieChart, Building2, Shield, Percent, BarChart3, Settings,
} from 'lucide-react'

function filterItem(item, hasAccess) {
  if (item.children) {
    const filtered = item.children
      .map((child) => filterItem(child, hasAccess))
      .filter(Boolean)
    if (filtered.length === 0) return null
    return { ...item, children: filtered }
  }
  if (item.module && !hasAccess(item.module, item.action)) return null
  return item
}

export function buildFilteredSidebar(config, hasAccess) {
  return config
    .map((item) => filterItem(item, hasAccess))
    .filter(Boolean)
}

export const FINANCE_SIDEBAR = [
  {
    id: 'fin-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/accounts/dashboard',
    module: 'DASHBOARD',
  },
  {
    id: 'fin-masters',
    label: 'Masters',
    icon: Database,
    children: [
      { id: 'master-cust', label: 'Customers', path: '/accounts/masters/customers', module: 'CUSTOMERS' },
      { id: 'master-vend', label: 'Vendors', path: '/accounts/masters/vendors', module: 'VENDORS' },
      { id: 'master-coa', label: 'Chart of Accounts', path: '/accounts/masters/ledgers', module: 'CHART_OF_ACCOUNTS' },
      { id: 'master-ag', label: 'Account Groups', path: '/accounts/masters/account-groups', module: 'ACCOUNT_GROUPS' },
      { id: 'master-ac', label: 'Account Categories', path: '/accounts/masters/account-categories', module: 'ACCOUNT_CATEGORIES' },
      { id: 'master-ap', label: 'Accounting Periods', path: '/accounts/organization/accounting-periods', module: 'ACCOUNTING_PERIODS' },
      { id: 'master-fy', label: 'Fiscal Years', path: '/accounts/organization/financial-years', module: 'FISCAL_YEARS' },
      { id: 'master-ec', label: 'Expense Categories', path: '/accounts/masters/expense-categories', module: null },
    ],
  },
  {
    id: 'fin-txn',
    label: 'Transactions',
    icon: TrendingUp,
    children: [
      { id: 'txn-si', label: 'Sales', path: '/accounts/transactions/quotations', module: 'SALES_INVOICES' },
      { id: 'txn-pi', label: 'Purchase', path: '/accounts/transactions/purchase-requisitions', module: 'PURCHASE_INVOICES' },
      { id: 'txn-exp', label: 'Expense', path: '/accounts/transactions/expenses/requests', module: 'EXPENSES' },
      { id: 'txn-cn', label: 'Credit Note', path: '/accounts/transactions/credit-notes', module: 'CREDIT_NOTES' },
      { id: 'txn-dn', label: 'Debit Note', path: '/accounts/transactions/debit-notes', module: 'DEBIT_NOTES' },
      { id: 'txn-gl-journals', label: 'GL Journals', path: '/accounts/transactions/journal', module: 'GL_JOURNALS' },
      { id: 'txn-gll', label: 'GL Journal Lines', path: '/accounts/transactions/journal-lines', module: 'GL_JOURNAL_LINES' },
    ],
  },
  {
    id: 'fin-rpt',
    label: 'Reports',
    icon: LineChart,
    module: 'REPORTS',
    children: [
      { id: 'rpt-gl', label: 'General Ledger', path: '/accounts/reports/ledger' },
      { id: 'rpt-tb', label: 'Trial Balance', path: '/accounts/reports/trial-balance' },
      { id: 'rpt-pl', label: 'Profit & Loss', path: '/accounts/reports/profit-loss' },
      { id: 'rpt-bs', label: 'Balance Sheet', path: '/accounts/reports/balance-sheet' },
      { id: 'rpt-cf', label: 'Cash Flow', path: '/accounts/reports/cash-flow' },
      {
        id: 'rpt-gst',
        label: 'GST Reports',
        path: '/accounts/reports/gst',
        icon: BarChart3,
        module: 'GST_REPORTS',
        children: [
          { id: 'rpt-gst-summary', label: 'GST Summary', path: '/accounts/reports/gst/summary', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-gstr1', label: 'GSTR-1', path: '/accounts/reports/gst/gstr1', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-gstr3b', label: 'GSTR-3B', path: '/accounts/reports/gst/gstr3b', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-hsn', label: 'HSN Summary', path: '/accounts/reports/gst/hsn-summary', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-itc', label: 'ITC Report', path: '/accounts/reports/gst/itc', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-gstr2b', label: 'GSTR-2B', path: '/accounts/reports/gst/gstr2b', module: 'GST_REPORTS', action: 'READ' },
          { id: 'rpt-gst-export', label: 'Export Reports', path: '/accounts/reports/gst/export', module: 'GST_REPORTS', action: 'EXPORT' },
        ],
      },
    ],
  },
  {
    id: 'fin-budget',
    label: 'Budget',
    icon: PieChart,
    children: [
      { id: 'budget-headers', label: 'Budget Headers', path: '/accounts/budget/budget-headers', module: 'BUDGET_HEADERS' },
      { id: 'budget-lines', label: 'Budget Lines', path: '/accounts/budget/budget-lines', module: 'BUDGET_LINES' },
    ],
  },
  {
    id: 'fin-bank',
    label: 'Bank',
    icon: Building2,
    children: [
      { id: 'bank-accounts', label: 'Bank Accounts', path: '/accounts/masters/bank-accounts', module: 'BANK_ACCOUNTS' },
      { id: 'bank-txn', label: 'Bank Transactions', path: '/accounts/transactions/banking', module: 'BANK_TRANSACTIONS' },
      { id: 'bank-recon', label: 'Bank Reconciliation', path: '/accounts/transactions/bank-reconciliation', module: 'BANK_RECONCILIATION' },
    ],
  },
  {
    id: 'fin-tax',
    label: 'Tax',
    icon: Percent,
    children: [
      { id: 'tax-gst-state', label: 'GST State Master', path: '/accounts/tax/gst-state-master', module: 'GST_MASTER' },
      { id: 'tax-gst-reg', label: 'GST Registrations', path: '/accounts/tax/gst-registrations', module: 'GST_MASTER' },
      { id: 'tax-gst', label: 'GST Slabs', path: '/accounts/masters/gst-slabs', module: 'GST_SLABS' },
      { id: 'tax-hsn', label: 'HSN / SAC', path: '/accounts/masters/hsn-sac', module: 'HSN_SAC' },
    ],
  },
  {
    id: 'fin-audit',
    label: 'Audit',
    icon: Shield,
    children: [
      { id: 'audit-logs', label: 'Audit Logs', path: '/accounts/settings/audit-logs', module: 'AUDIT_LOGS' },
    ],
  },
  {
    id: 'fin-settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { id: 'settings-sales', label: 'Sales', path: '/accounts/settings/sales' }
    ],
  },
]
