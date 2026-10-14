import React from 'react'
import {
  LayoutDashboard, Building2, Users, ShieldCheck, Layers, Activity, Globe,
  Settings, LineChart, IndianRupee, UserCheck, Package, ShoppingCart, Store,
  TrendingUp, UserPlus, Clock, BadgeCheck, Truck, ClipboardCheck, Cog, ScrollText,
  Network, BookOpen, Calendar, ArrowLeftRight, PieChart, FileText, CreditCard,
  Tag, User, Target, Warehouse, PackagePlus, AlertTriangle, MessageSquare, ScanLine, Factory, PackageOpen, ClipboardList, Boxes,
  ArrowDownCircle, ArrowUpCircle, Calculator, BarChart3, Shield, Database, Box,
  Receipt, FileSpreadsheet, Landmark, Download, Scale, Camera, FolderTree, Scale3d, ArrowRightLeft, BoxSelect, Lock,
  ShieldAlert, Key, CreditCard as BillingCard, HeartPulse, UserCog, Globe2, ListTree
} from 'lucide-react'

// Custom Icons
export const ArrowUpRight = TrendingUp;
export const ArrowDownRight = TrendingUp;
export const CustomScanLine = ScanLine;
export const CustomPackagePlus = Package;
export const CustomAlertTriangle = AlertTriangle;
export const CustomMessageSquare = MessageSquare;

export function buildSidebarLinks(userRole, companyId, permissions, isSuperAdminGlobal, accessibleModuleKeys = [], canViewModule, isOwner = false) {
  const base = companyId ? `/company/${companyId}` : ``

  const hasGstExport = () =>
    Array.isArray(permissions) &&
    permissions.some((p) => {
      const code = typeof p === 'string' ? p : (p?.permissionCode || p?.featureCode || '');
      const up = String(code).toUpperCase();
      return up === 'GST_REPORTS:EXPORT' || up === 'ALL' || up === 'ALL_MODULES';
    });

  const gstChildren = (gstBase) => [
    { id: 'acc-rep-gst-summary', label: 'GST Summary', path: `${gstBase}/summary`, icon: LayoutDashboard },
    { id: 'acc-rep-gst-gstr1', label: 'GSTR-1', path: `${gstBase}/gstr1`, icon: FileText },
    { id: 'acc-rep-gst-gstr3b', label: 'GSTR-3B', path: `${gstBase}/gstr3b`, icon: Receipt },
    { id: 'acc-rep-gst-hsn', label: 'HSN Summary', path: `${gstBase}/hsn-summary`, icon: FileSpreadsheet },
    { id: 'acc-rep-gst-itc', label: 'ITC Report', path: `${gstBase}/itc`, icon: Landmark },
    { id: 'acc-rep-gst-gstr2b', label: 'GSTR-2B', path: `${gstBase}/gstr2b`, icon: FileSpreadsheet },
    ...(hasGstExport() ? [{ id: 'acc-rep-gst-export', label: 'Export Reports', path: `${gstBase}/export`, icon: Download }] : []),
  ];

  if (isSuperAdminGlobal) {
    return [
      // ── Dashboard ─────────────────────────────────────────────────────
      {
        id: 'sa-dashboard',
        label: 'Dashboard',
        path: '/super-admin/dashboard',
        icon: LayoutDashboard,
      },

      // ── Organizations ─────────────────────────────────────────────────
      {
        id: 'sa-organizations',
        label: 'Organizations',
        icon: Building2,
        path: '/super-admin/organizations',
        children: [
          {
            id: 'sa-orgs-all',
            label: 'All Organizations',
            path: '/super-admin/organizations',
            icon: Building2,
          },
          {
            id: 'sa-orgs-active',
            label: 'Active Organizations',
            path: '/super-admin/organizations?status=ACTIVE',
            icon: ShieldCheck,
          },
          {
            id: 'sa-orgs-suspended',
            label: 'Suspended',
            path: '/super-admin/organizations?status=SUSPENDED',
            icon: ShieldAlert,
          },
        ],
      },

      // ── Organization Management ────────────────────────────────────────
      {
        id: 'sa-org-management',
        label: 'Org Management',
        icon: UserCog,
        path: '/super-admin/companies',
        children: [
          {
            id: 'sa-org-companies',
            label: 'Companies',
            path: '/super-admin/companies',
            icon: Building2,
          },
        ],
      },

      // ── Platform ──────────────────────────────────────────────────────
      {
        id: 'sa-platform',
        label: 'Platform',
        icon: Globe,
        path: '/super-admin/modules',
        children: [
          {
            id: 'sa-platform-modules',
            label: 'Modules',
            path: '/super-admin/modules',
            icon: Layers,
          },
          {
            id: 'sa-platform-routes',
            label: 'Module Routes',
            path: '/super-admin/module-routes',
            icon: Network,
          },
        ],
      },

    ]
  }

  // Exact Finance Manager Structure
  if (userRole && String(userRole).toLowerCase() === 'finance_manager') {
    return [
      {
        id: 'acc-main', label: 'Accounts', path: `${base}/accounts/dashboard`, icon: Calculator,
        children: [
          { id: 'acc-dash', label: 'Dashboard', path: `${base}/accounts/dashboard`, icon: LayoutDashboard },
          {
            id: 'acc-mast', label: 'Masters', path: `${base}/accounts/masters/ledgers`, icon: Database, children: [
              { id: 'acc-mast-coa', label: 'Chart of Accounts', path: `${base}/accounts/masters/ledgers`, icon: BookOpen },
              { id: 'acc-mast-bank', label: 'Bank Accounts', path: `${base}/accounts/masters/bank-accounts`, icon: Building2 },
              { id: 'acc-mast-cust', label: 'Customers', path: `${base}/accounts/masters/customers`, icon: UserCheck },
              { id: 'acc-mast-vend', label: 'Vendors', path: `${base}/accounts/masters/vendors`, icon: Truck },
              { id: 'acc-mast-grp', label: 'Account Groups', path: `${base}/accounts/masters/account-groups`, icon: Network },
              { id: 'acc-mast-cat', label: 'Account Categories', path: `${base}/accounts/masters/account-categories`, icon: Layers }
            ]
          },
          {
            id: 'acc-tax', label: 'Tax', path: `${base}/accounts/tax`, icon: BadgeCheck, children: [
              { id: 'acc-tax-gst-state', label: 'GST State Master', path: `${base}/accounts/tax/gst-state-master`, icon: Tag },
              { id: 'acc-tax-gst-reg', label: 'GST Registrations', path: `${base}/accounts/tax/gst-registrations`, icon: Tag },
              { id: 'acc-tax-gst', label: 'GST Slabs', path: `${base}/accounts/masters/gst-slabs`, icon: BadgeCheck },
              { id: 'acc-tax-hsn', label: 'HSN / SAC', path: `${base}/accounts/masters/hsn-sac`, icon: Tag }
            ]
          },
          {
            id: 'acc-txn', label: 'Transactions', path: `${base}/accounts/transactions/sales`, icon: TrendingUp, children: [
              { id: 'acc-txn-quot', label: 'Quotations', path: `${base}/accounts/transactions/quotations` },
              { id: 'acc-txn-sales', label: 'Sales Invoice', path: `${base}/accounts/transactions/sales` },
              { id: 'acc-txn-pur', label: 'Purchase Invoice', path: `${base}/accounts/transactions/purchase` },
              { id: 'acc-txn-exp', label: 'Expense', path: `${base}/accounts/transactions/expenses` },
              { id: 'acc-txn-pay', label: 'Payment Voucher', path: `${base}/accounts/transactions/payments` },
              { id: 'acc-txn-cn', label: 'Credit Note', path: `${base}/accounts/transactions/credit-notes` },
              { id: 'acc-txn-dn', label: 'Debit Note', path: `${base}/accounts/transactions/debit-notes` },
              { id: 'acc-txn-jour', label: 'GL Journals', path: `${base}/accounts/transactions/journal` },
              { id: 'acc-txn-jour-lines', label: 'GL Journal Lines', path: `${base}/accounts/transactions/journal-lines` }
            ]
          },
          {
            id: 'acc-rep', label: 'Reports', path: `${base}/accounts/reports/trial-balance`, icon: LineChart, children: [
              { id: 'acc-rep-led', label: 'General Ledger', path: `${base}/accounts/reports/ledger`, icon: BookOpen },
              { id: 'acc-rep-tb', label: 'Trial Balance', path: `${base}/accounts/reports/trial-balance`, icon: FileText },
              { id: 'acc-rep-pl', label: 'Profit & Loss', path: `${base}/accounts/reports/profit-loss`, icon: TrendingUp },
              { id: 'acc-rep-bs', label: 'Balance Sheet', path: `${base}/accounts/reports/balance-sheet`, icon: PieChart },
              { id: 'acc-rep-cf', label: 'Cash Flow', path: `${base}/accounts/reports/cash-flow`, icon: Activity },
              { id: 'acc-rep-gst', label: 'GST Reports', path: `${base}/accounts/reports/gst`, icon: BarChart3, children: gstChildren(`${base}/accounts/reports/gst`) }
            ]
          },
          {
            id: 'acc-bud', label: 'Budget', path: `${base}/accounts/budget`, icon: PieChart, children: [
              { id: 'acc-bud-hdr', label: 'Budget Headers', path: `${base}/accounts/budget/budget-headers`, icon: Layers },
              { id: 'acc-bud-lin', label: 'Budget Lines', path: `${base}/accounts/budget/budget-lines`, icon: Network }
            ]
          },
          {
            id: 'acc-bnk', label: 'Bank', path: `${base}/accounts/transactions/banking`, icon: Building2, children: [
              { id: 'acc-bnk-rec', label: 'Bank Reconciliation', path: `${base}/accounts/transactions/banking`, icon: ArrowLeftRight }
            ]
          },
          {
            id: 'acc-set', label: 'Settings', path: `${base}/accounts/organization/accounting-periods`, icon: Settings, children: [
              { id: 'acc-set-ap', label: 'Accounting Periods', path: `${base}/accounts/organization/accounting-periods`, icon: Clock },
              { id: 'acc-set-aud', label: 'Audit Logs', path: `${base}/accounts/settings/audit-logs`, icon: ScrollText }
            ]
          }
        ]
      }
    ];
  }

  const links = []

  links.push({
    id: 'dashboard', label: 'Overview Dashboard', path: `${base}/dashboard`, icon: LayoutDashboard
  })

  // 2. Finance & Accounting
  const financeChildren = []

  if (canViewModule('dashboard') || canViewModule('reports') || canViewModule('customers') || canViewModule('vendors')) {
    financeChildren.push({ id: 'fin-dashboard', label: 'Dashboard', path: `${base}/finance/dashboard`, icon: LayoutDashboard })
  }

  const mastersChildren = []
  if (canViewModule('chart_of_accounts')) mastersChildren.push({ id: 'fin-coa', label: 'Chart of Accounts', path: `${base}/finance/chart-of-accounts`, icon: BookOpen })
  if (canViewModule('customers')) mastersChildren.push({ id: 'fin-customers', label: 'Customers', path: `${base}/accounting/customers`, icon: UserCheck })
  if (canViewModule('vendors')) mastersChildren.push({ id: 'fin-vendors', label: 'Vendors', path: `${base}/accounting/vendors`, icon: Truck })
  if (canViewModule('bank_accounts')) mastersChildren.push({ id: 'fin-bank-accounts', label: 'Bank Accounts', path: `${base}/finance/bank-accounts`, icon: Building2 })
  if (canViewModule('gst_slabs')) mastersChildren.push({ id: 'fin-gst-slabs', label: 'GST Slabs', path: `${base}/accounts/masters/gst-slabs`, icon: BadgeCheck })
  if (canViewModule('hsn_sac')) mastersChildren.push({ id: 'fin-hsn-sac', label: 'HSN / SAC', path: `${base}/accounting/hsn-sac`, icon: Tag })
  if (canViewModule('gst_master')) mastersChildren.push({ id: 'fin-gst-state', label: 'GST State Master', path: `${base}/accounts/tax/gst-state-master`, icon: Tag })
  if (canViewModule('gst_master')) mastersChildren.push({ id: 'fin-gst-reg', label: 'GST Registrations', path: `${base}/accounts/tax/gst-registrations`, icon: Tag })
  if (canViewModule('account_groups')) mastersChildren.push({ id: 'fin-acc-groups', label: 'Account Groups', path: `${base}/accounts/masters/account-groups`, icon: Network })
  if (canViewModule('account_categories')) mastersChildren.push({ id: 'fin-acc-categories', label: 'Account Categories', path: `${base}/accounts/masters/account-categories`, icon: Layers })
  if (mastersChildren.length > 0) financeChildren.push({ id: 'fin-masters', label: 'Masters', path: `${base}/finance/masters`, icon: Database, children: mastersChildren })

  const txnChildren = []
  if (canViewModule('sales_invoices')) txnChildren.push({ id: 'fin-sales-invoices', label: 'Sales Invoices', path: `${base}/finance/sales-invoices`, icon: FileText })
  if (canViewModule('purchases_invoices')) txnChildren.push({ id: 'fin-ap-invoices', label: 'Purchase Invoices', path: `${base}/finance/ap-invoices`, icon: FileText })
  if (canViewModule('expenses') || canViewModule('accounts_txn')) txnChildren.push({ id: 'fin-expenses', label: 'Expense', path: `${base}/accounts/transactions/expenses`, icon: Receipt })
  if (canViewModule('payment_vouchers')) txnChildren.push({ id: 'fin-payment-vouchers', label: 'Payment Vouchers', path: `${base}/finance/payment-vouchers`, icon: CreditCard })
  if (canViewModule('credit_notes')) txnChildren.push({ id: 'fin-credit-notes', label: 'Credit Notes', path: `${base}/finance/credit-notes`, icon: ArrowDownCircle })
  if (canViewModule('debit_notes')) txnChildren.push({ id: 'fin-debit-notes', label: 'Debit Notes', path: `${base}/finance/debit-notes`, icon: ArrowUpCircle })
  if (canViewModule('gl_journals') || canViewModule('gl')) txnChildren.push({ id: 'fin-ledger', label: 'General Ledger', path: `${base}/finance/ledger`, icon: BookOpen })
  if (canViewModule('bank_transactions')) txnChildren.push({ id: 'fin-bank-txns', label: 'Bank Transactions', path: `${base}/finance/bank-transactions`, icon: ArrowLeftRight })
  if (txnChildren.length > 0) financeChildren.push({ id: 'fin-transactions', label: 'Transactions', path: `${base}/finance/transactions`, icon: TrendingUp, children: txnChildren })

  const bankingChildren = []
  if (canViewModule('reconciliation')) bankingChildren.push({ id: 'fin-reconciliation', label: 'Bank Reconciliation', path: `${base}/finance/bank-transactions`, icon: ClipboardCheck })
  if (canViewModule('bank_ledger')) bankingChildren.push({ id: 'fin-bank-ledger', label: 'Bank Ledger', path: `${base}/finance/bank-ledger`, icon: Building2 })
  if (bankingChildren.length > 0) financeChildren.push({ id: 'fin-banking', label: 'Banking', path: `${base}/finance/banking`, icon: Building2, children: bankingChildren })

  const accChildren = []
  if (canViewModule('fiscal_years') || canViewModule('companies')) accChildren.push({ id: 'fin-fiscal-years', label: 'Fiscal Years', path: `${base}/finance/financial-years`, icon: Calendar })
  if (canViewModule('accounting_periods') || canViewModule('companies')) accChildren.push({ id: 'fin-acc-periods', label: 'Accounting Periods', path: `${base}/finance/accounting-periods`, icon: Clock })

  const budgetChildren = []
  if (canViewModule('budget_headers')) budgetChildren.push({ id: 'fin-budgets-hdr', label: 'Budgets', path: `${base}/finance/budgets`, icon: PieChart })
  if (budgetChildren.length > 0) accChildren.push({ id: 'fin-budgets', label: 'Budgets', path: `${base}/finance/budgets`, icon: PieChart, children: budgetChildren })

  if (accChildren.length > 0) financeChildren.push({ id: 'fin-accounting', label: 'Accounting', path: `${base}/finance/accounting`, icon: Calculator, children: accChildren })

  const reportChildren = []
  if (canViewModule('reports') || canViewModule('reports_read_only')) {
    reportChildren.push({ id: 'rep-tb', label: 'Trial Balance', path: `${base}/finance/reports/trial-balance`, icon: FileText })
    reportChildren.push({ id: 'rep-gl', label: 'General Ledger Report', path: `${base}/finance/reports/gl`, icon: BookOpen })
    reportChildren.push({ id: 'rep-bs', label: 'Balance Sheet', path: `${base}/finance/reports/balance-sheet`, icon: PieChart })
    reportChildren.push({ id: 'rep-pl', label: 'Profit & Loss', path: `${base}/finance/reports/profit-loss`, icon: TrendingUp })
    reportChildren.push({ id: 'rep-cf', label: 'Cash Flow', path: `${base}/finance/reports/cash-flow`, icon: Activity })
    reportChildren.push({ id: 'rep-fr', label: 'Financial Reports', path: `${base}/finance/reports`, icon: BarChart3 })
  }
  if (reportChildren.length > 0) financeChildren.push({ id: 'fin-reports', label: 'Reports', path: `${base}/finance/reports`, icon: LineChart, children: reportChildren })

  const adminChildren = []
  if (canViewModule('audit_logs')) adminChildren.push({ id: 'fin-audit', label: 'Audit Logs', path: `${base}/finance/audit`, icon: ScrollText })
  if (adminChildren.length > 0) financeChildren.push({ id: 'fin-administration', label: 'Administration', path: `${base}/finance/administration`, icon: Shield, children: adminChildren })

  // New Accounts Module
  const accountsChildren = []

  if (canViewModule('dashboard') || canViewModule('accounts_dashboard')) {
    accountsChildren.push({ id: 'acc-dash', label: 'Dashboard', path: `${base}/accounts/dashboard`, icon: LayoutDashboard })
  }

  const accMastersChildren = []
  if (canViewModule('chart_of_accounts') || canViewModule('accounts_masters')) accMastersChildren.push({ id: 'acc-mast-coa', label: 'Chart of Accounts', path: `${base}/accounts/masters/ledgers`, icon: BookOpen })
  if (canViewModule('bank_accounts') || canViewModule('accounts_masters')) accMastersChildren.push({ id: 'acc-mast-bank', label: 'Bank Accounts', path: `${base}/accounts/masters/bank-accounts`, icon: Building2 })
  if (canViewModule('customers') || canViewModule('accounts_masters')) accMastersChildren.push({ id: 'acc-mast-cust', label: 'Customers', path: `${base}/accounts/masters/customers`, icon: UserCheck })
  if (canViewModule('vendors') || canViewModule('accounts_masters')) accMastersChildren.push({ id: 'acc-mast-vend', label: 'Vendors', path: `${base}/accounts/masters/vendors`, icon: Truck })
  if (canViewModule('account_groups') || canViewModule('accounts_settings')) accMastersChildren.push({ id: 'acc-mast-grp', label: 'Account Groups', path: `${base}/accounts/masters/account-groups`, icon: Network })
  if (canViewModule('account_categories') || canViewModule('accounts_settings')) accMastersChildren.push({ id: 'acc-mast-cat', label: 'Account Categories', path: `${base}/accounts/masters/account-categories`, icon: Layers })
  if (canViewModule('fiscal_years') || canViewModule('accounts_masters')) accMastersChildren.push({ id: 'acc-mast-fy', label: 'Fiscal Years', path: `${base}/accounts/organization/financial-years`, icon: Calendar })

  if (accMastersChildren.length > 0) accountsChildren.push({ id: 'acc-masters', label: 'Masters', path: `${base}/accounts/masters`, icon: Database, children: accMastersChildren })

  const accTaxChildren = []
  if (canViewModule('gst_master') || canViewModule('accounts_masters')) accTaxChildren.push({ id: 'acc-tax-gst-state', label: 'GST State Master', path: `${base}/accounts/tax/gst-state-master`, icon: Tag })
  if (canViewModule('gst_master') || canViewModule('accounts_masters')) accTaxChildren.push({ id: 'acc-tax-gst-reg', label: 'GST Registrations', path: `${base}/accounts/tax/gst-registrations`, icon: Tag })
  if (canViewModule('gst_slabs') || canViewModule('accounts_masters')) accTaxChildren.push({ id: 'acc-tax-gst', label: 'GST Slabs', path: `${base}/accounts/masters/gst-slabs`, icon: BadgeCheck })
  if (canViewModule('hsn_sac') || canViewModule('accounts_masters')) accTaxChildren.push({ id: 'acc-tax-hsn', label: 'HSN / SAC', path: `${base}/accounts/masters/hsn-sac`, icon: Tag })

  if (accTaxChildren.length > 0) accountsChildren.push({ id: 'acc-tax', label: 'Tax', path: `${base}/accounts/tax`, icon: BadgeCheck, children: accTaxChildren })

  const accTxnChildren = []
  if (canViewModule('quotations') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-quot', label: 'Quotations', path: `${base}/accounts/transactions/quotations` })
  if (canViewModule('sales_invoices') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-sales', label: 'Sales Invoice', path: `${base}/accounts/transactions/sales` })
  if (canViewModule('purchases_invoices') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-pur', label: 'Purchase Invoice', path: `${base}/accounts/transactions/purchase` })
  if (canViewModule('expenses') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-exp', label: 'Expense', path: `${base}/accounts/transactions/expenses` })
  if (canViewModule('payment_vouchers') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-pay', label: 'Payment Voucher', path: `${base}/accounts/transactions/payments` })
  if (canViewModule('credit_notes') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-cn', label: 'Credit Note', path: `${base}/accounts/transactions/credit-notes` })
  if (canViewModule('debit_notes') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-dn', label: 'Debit Note', path: `${base}/accounts/transactions/debit-notes` })
  if (canViewModule('gl_journals') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-jour', label: 'GL Journals', path: `${base}/accounts/transactions/journal` })
  if (canViewModule('gl_journal_lines') || canViewModule('accounts_txn')) accTxnChildren.push({ id: 'acc-txn-jour-lines', label: 'GL Journal Lines', path: `${base}/accounts/transactions/journal-lines` })

  if (accTxnChildren.length > 0) accountsChildren.push({ id: 'acc-txn', label: 'Transactions', path: `${base}/accounts/transactions/quotations`, icon: TrendingUp, children: accTxnChildren })

  const accRepChildren = []
  if (canViewModule('reports') || canViewModule('accounts_rep')) {
    accRepChildren.push({ id: 'acc-rep-led', label: 'General Ledger', path: `${base}/accounts/reports/ledger`, icon: BookOpen })
    accRepChildren.push({ id: 'acc-rep-tb', label: 'Trial Balance', path: `${base}/accounts/reports/trial-balance`, icon: FileText })
    accRepChildren.push({ id: 'acc-rep-pl', label: 'Profit & Loss', path: `${base}/accounts/reports/profit-loss`, icon: TrendingUp })
    accRepChildren.push({ id: 'acc-rep-bs', label: 'Balance Sheet', path: `${base}/accounts/reports/balance-sheet`, icon: PieChart })
    accRepChildren.push({ id: 'acc-rep-cf', label: 'Cash Flow', path: `${base}/accounts/reports/cash-flow`, icon: Activity })
    if (canViewModule('gst_reports')) accRepChildren.push({ id: 'acc-rep-gst', label: 'GST Reports', path: `${base}/accounts/reports/gst`, icon: BarChart3, children: gstChildren(`${base}/accounts/reports/gst`) })
  }
  if (accRepChildren.length > 0) accountsChildren.push({ id: 'acc-reports', label: 'Reports', path: `${base}/accounts/reports/trial-balance`, icon: LineChart, children: accRepChildren })

  const accBudChildren = []
  if (canViewModule('budget_headers') || canViewModule('accounts_budget')) accBudChildren.push({ id: 'acc-bud-hdr', label: 'Budget Headers', path: `${base}/accounts/budget/budget-headers`, icon: Layers })
  if (canViewModule('budget_lines') || canViewModule('accounts_budget')) accBudChildren.push({ id: 'acc-bud-lin', label: 'Budget Lines', path: `${base}/accounts/budget/budget-lines`, icon: Network })
  if (accBudChildren.length > 0) accountsChildren.push({ id: 'acc-budget', label: 'Budget', path: `${base}/accounts/budget`, icon: PieChart, children: accBudChildren })

  const accBankChildren = []
  if (canViewModule('bank_reconciliation') || canViewModule('accounts_txn')) accBankChildren.push({ id: 'acc-bnk-rec', label: 'Bank Reconciliation', path: `${base}/accounts/transactions/banking`, icon: ArrowLeftRight })
  if (accBankChildren.length > 0) accountsChildren.push({ id: 'acc-bank', label: 'Bank', path: `${base}/accounts/transactions/banking`, icon: Building2, children: accBankChildren })

  const accSetChildren = []
  if (canViewModule('accounting_periods') || canViewModule('accounts_org')) accSetChildren.push({ id: 'acc-set-ap', label: 'Accounting Periods', path: `${base}/accounts/organization/accounting-periods`, icon: Clock })
  if (canViewModule('audit_logs') || canViewModule('accounts_org')) accSetChildren.push({ id: 'acc-set-aud', label: 'Audit Logs', path: `${base}/accounts/settings/audit-logs`, icon: ScrollText })
  accSetChildren.push({ id: 'acc-set-sales', label: 'Sales Settings', path: `${base}/accounts/settings/sales`, icon: Settings })
  if (accSetChildren.length > 0) accountsChildren.push({ id: 'acc-settings', label: 'Settings', path: `${base}/accounts/organization/accounting-periods`, icon: Settings, children: accSetChildren })

  if (accountsChildren.length > 0) {
    links.push({
      id: 'accounts', label: 'Accounts', icon: Calculator, path: `${base}/accounts/dashboard`,
      children: accountsChildren,
    })
  }

  // 3. HR & Employee Management
  const hrChildren = []
  if (canViewModule('hr') || canViewModule('hr_dashboard')) hrChildren.push({ id: 'hr-dashboard', label: 'HR Dashboard', path: `${base}/hr/dashboard`, icon: LayoutDashboard })
  if (canViewModule('hr_profile') || canViewModule('hr')) hrChildren.push({ id: 'hr-profile', label: 'Employee Profile', path: `${base}/hr/profile`, icon: User })
  if (canViewModule('hr_attendance') || canViewModule('hr')) hrChildren.push({ id: 'hr-attendance', label: 'Attendance', path: `${base}/hr/attendance`, icon: Clock })
  if (canViewModule('hr_leave') || canViewModule('hr')) hrChildren.push({ id: 'hr-leave', label: 'Leave Management', path: `${base}/hr/leave`, icon: Calendar })
  if (canViewModule('hr_payroll') || canViewModule('hr')) hrChildren.push({ id: 'hr-payroll', label: 'Payroll', path: `${base}/hr/payroll`, icon: IndianRupee })
  if (canViewModule('hr_recruitment') || canViewModule('hr')) hrChildren.push({ id: 'hr-recruitment', label: 'Recruitment', path: `${base}/hr/recruitment`, icon: Target })
  if (canViewModule('hr_performance') || canViewModule('hr')) hrChildren.push({ id: 'hr-performance', label: 'Performance Review', path: `${base}/hr/performance`, icon: ClipboardCheck })
  if (canViewModule('hr_shifts') || canViewModule('hr')) hrChildren.push({ id: 'hr-shifts', label: 'Shift Scheduling', path: `${base}/hr/shifts`, icon: Calendar })
  if (canViewModule('hr_audit') || canViewModule('hr')) hrChildren.push({ id: 'hr-audit', label: 'Audit Logs', path: `${base}/hr/audit`, icon: ScrollText })

  if (hrChildren.length > 0) {
    links.push({
      id: 'hr', label: 'HR & Employees', icon: Users, path: `${base}/hr`,
      children: hrChildren,
    })
  }

  // 4. Inventory Management
  const invChildren = []
  const canViewInv = (mod) => canViewModule(mod) || canViewModule('ALL_MODULES') || canViewModule('ALL');

  if (canViewInv('inventory') || canViewInv('inv_dashboard') || true) { // Always show dashboard if they have any access, or rely on normal dashboard permission
    invChildren.push({ id: 'inv-dashboard', label: 'Dashboard', path: `${base}/inventory/dashboard`, icon: LayoutDashboard })
  }

  const productGroupChildren = []
  if (canViewInv('PRODUCTS')) productGroupChildren.push({ id: 'inv-products', label: 'Products', path: `${base}/inventory/products`, icon: Package })
  if (canViewInv('PRODUCT_CATEGORIES')) productGroupChildren.push({ id: 'inv-product-categories', label: 'Categories', path: `${base}/inventory/product-categories`, icon: FolderTree })
  if (canViewInv('PRODUCT_UOMS')) productGroupChildren.push({ id: 'inv-product-uoms', label: 'Units of Measure', path: `${base}/inventory/product-uoms`, icon: Scale3d })
  if (canViewInv('PRODUCT_PRICES')) productGroupChildren.push({ id: 'inv-product-prices', label: 'Product Prices', path: `${base}/inventory/product-prices`, icon: Tag })
  if (canViewInv('PRODUCT_BATCHES')) productGroupChildren.push({ id: 'inv-product-batches', label: 'Product Batches', path: `${base}/inventory/product-batches`, icon: Box })
  if (canViewInv('PRODUCT_SERIALS')) productGroupChildren.push({ id: 'inv-product-serials', label: 'Product Serials', path: `${base}/inventory/product-serials`, icon: ScanLine })

  if (productGroupChildren.length > 0) {
    invChildren.push({ id: 'inv-products-group', label: 'Products', icon: Package, children: productGroupChildren })
  }

  const warehouseGroupChildren = []
  if (canViewInv('WAREHOUSES')) warehouseGroupChildren.push({ id: 'inv-warehouse', label: 'Warehouses', path: `${base}/inventory/warehouse`, icon: Warehouse })
  if (canViewInv('WAREHOUSE_LOCATIONS')) warehouseGroupChildren.push({ id: 'inv-warehouse-locations', label: 'Warehouse Locations', path: `${base}/inventory/warehouse-locations`, icon: Store })

  if (warehouseGroupChildren.length > 0) {
    invChildren.push({ id: 'inv-warehouse-group', label: 'Warehouses', icon: Warehouse, children: warehouseGroupChildren })
  }

  const stockOpsChildren = []
  if (canViewInv('STOCK')) stockOpsChildren.push({ id: 'inv-current-stock', label: 'Current Stock', path: `${base}/inventory/stocks`, icon: Boxes })
  if (canViewInv('STOCK_MOVEMENTS')) stockOpsChildren.push({ id: 'inv-stock-movements', label: 'Stock Movements', path: `${base}/inventory/stock-movements`, icon: BoxSelect })
  if (canViewInv('STOCK_TRANSFERS')) stockOpsChildren.push({ id: 'inv-transfer', label: 'Stock Transfers', path: `${base}/inventory/stock-transfers`, icon: ArrowLeftRight })
  if (canViewInv('STOCK_RESERVATIONS')) stockOpsChildren.push({ id: 'inv-stock-reservations', label: 'Stock Reservations', path: `${base}/inventory/stock-reservations`, icon: Lock })
  if (canViewInv('STOCK_ADJUSTMENTS')) stockOpsChildren.push({ id: 'inv-stock-adjustments', label: 'Stock Adjustments', path: `${base}/inventory/stock-adjustments`, icon: ArrowRightLeft })
  if (canViewInv('OPENING_STOCK')) stockOpsChildren.push({ id: 'inv-opening-stocks', label: 'Opening Stock', path: `${base}/inventory/opening-stocks`, icon: PackageOpen })

  if (stockOpsChildren.length > 0) {
    invChildren.push({ id: 'inv-stock-ops-group', label: 'Stock Operations', icon: ClipboardList, children: stockOpsChildren })
  }

  const invControlChildren = []
  if (canViewInv('INVENTORY_VALUATION')) invControlChildren.push({ id: 'inv-valuations', label: 'Inventory Valuation', path: `${base}/inventory/valuations`, icon: Landmark })
  if (canViewInv('INVENTORY_REPORTS')) invControlChildren.push({ id: 'inv-reports', label: 'Inventory Reports', path: `${base}/inventory/reports`, icon: FileText })
  if (canViewInv('INVENTORY_POSTING')) invControlChildren.push({ id: 'inv-posting', label: 'Inventory Posting', path: `${base}/inventory/posting`, icon: Receipt })

  if (invControlChildren.length > 0) {
    invChildren.push({ id: 'inv-control-group', label: 'Inventory Control', icon: ShieldCheck, children: invControlChildren })
  }

  const integrationsChildren = []
  if (canViewInv('SALES_INVOICE_INTEGRATION')) integrationsChildren.push({ id: 'inv-sales-invoice', label: 'Sales Invoice', path: `${base}/inventory/integrations/sales-invoice`, icon: FileText })
  if (canViewInv('PURCHASE_INVOICE_INTEGRATION')) integrationsChildren.push({ id: 'inv-purchase-invoice', label: 'Purchase Invoice', path: `${base}/inventory/integrations/purchase-invoice`, icon: Receipt })
  if (canViewInv('STOCK_INTEGRATION')) integrationsChildren.push({ id: 'inv-stock-integration', label: 'Stock Integration', path: `${base}/inventory/integrations/stock`, icon: Network })

  if (integrationsChildren.length > 0) {
    invChildren.push({ id: 'inv-integrations-group', label: 'Integrations', icon: Network, children: integrationsChildren })
  }

  // Hide Inventory Management completely if NO children are allowed and dashboard is only item
  if (invChildren.length > 1 || (invChildren.length === 1 && invChildren[0].id !== 'inv-dashboard')) {
    links.push({
      id: 'inventory', label: 'Inventory Management', icon: Boxes, path: `${base}/inventory`,
      children: invChildren,
    })
  } else if (invChildren.length === 1 && (productGroupChildren.length > 0 || warehouseGroupChildren.length > 0 || stockOpsChildren.length > 0 || invControlChildren.length > 0 || integrationsChildren.length > 0)) {
    // fallback if somehow dashboard is missing but others are there
    links.push({
      id: 'inventory', label: 'Inventory Management', icon: Boxes, path: `${base}/inventory`,
      children: invChildren,
    })
  } else if (invChildren.length === 1 && invChildren[0].id === 'inv-dashboard') {
    const hasAnyModule = productGroupChildren.length > 0 || warehouseGroupChildren.length > 0 || stockOpsChildren.length > 0 || invControlChildren.length > 0 || integrationsChildren.length > 0;
    if (hasAnyModule) {
      links.push({
        id: 'inventory', label: 'Inventory Management', icon: Boxes, path: `${base}/inventory`,
        children: invChildren,
      })
    }
  }

  // 5. Sales & CRM
  const salesChildren = []
  if (canViewModule('sales') || canViewModule('crm') || canViewModule('sales_dashboard')) salesChildren.push({ id: 'sales-dashboard', label: 'Sales & CRM Dashboard', path: `${base}/sales-crm/dashboard`, icon: LayoutDashboard })
  if (canViewModule('sales_customers') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-customers', label: 'Customer Management', path: `${base}/sales-crm/customers`, icon: UserCheck })
  if (canViewModule('sales_leads') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-leads', label: 'Lead Tracking', path: `${base}/sales-crm/leads`, icon: UserPlus })
  if (canViewModule('sales_quotes') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-quotes', label: 'Quotations', path: `${base}/sales-crm/quotations`, icon: FileText })
  if (canViewModule('sales_orders') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-orders', label: 'Sales Orders', path: `${base}/sales-crm/orders`, icon: ShoppingCart })
  if (canViewModule('sales_comms') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-comms', label: 'Customer Communication', path: `${base}/sales-crm/communication`, icon: CustomMessageSquare })
  if (canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-inquiries', label: 'Inquiries', path: `${base}/sales-crm/inquiries`, icon: MessageSquare })
  if (canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-followups', label: 'Follow-Ups', path: `${base}/sales-crm/follow-ups`, icon: Clock })
  if (canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-lead-sources', label: 'Lead Sources', path: `${base}/sales-crm/lead-sources`, icon: Target })
  if (canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-customer-types', label: 'Customer Types', path: `${base}/sales-crm/customer-types`, icon: Tag })
  if (canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-activity-types', label: 'Activity Types', path: `${base}/sales-crm/activity-types`, icon: Activity })
  if (canViewModule('sales_analytics') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-analytics', label: 'Sales Analytics', path: `${base}/sales-crm/analytics`, icon: LineChart })
  if (canViewModule('sales_audit') || canViewModule('sales') || canViewModule('crm')) salesChildren.push({ id: 'sales-audit', label: 'Audit Logs', path: `${base}/sales-crm/audit`, icon: ScrollText })

  if (salesChildren.length > 0) {
    links.push({
      id: 'sales-crm', label: 'Sales & CRM', icon: TrendingUp, path: `${base}/sales-crm`,
      children: salesChildren,
    })
  }

  // 6. Purchase Management
  const purChildren = []
  if (canViewModule('purchases') || canViewModule('pur_dashboard')) purChildren.push({ id: 'pur-dashboard', label: 'Purchase Dashboard', path: `${base}/purchases/dashboard`, icon: LayoutDashboard })
  if (canViewModule('pur_vendors') || canViewModule('purchases')) purChildren.push({ id: 'pur-vendors', label: 'Vendor Management', path: `${base}/purchases/vendors`, icon: Truck })
  if (canViewModule('pur_requests') || canViewModule('purchases')) purChildren.push({ id: 'pur-requests', label: 'Purchase Requests', path: `${base}/purchases/requests`, icon: ClipboardList })
  if (canViewModule('pur_orders') || canViewModule('purchases')) purChildren.push({ id: 'pur-orders', label: 'Purchase Orders', path: `${base}/purchases/purchase-orders`, icon: ShoppingCart })
  if (canViewModule('pur_quotes') || canViewModule('purchases')) purChildren.push({ id: 'pur-quotes', label: 'Supplier Quotations', path: `${base}/purchases/quotations`, icon: FileText })
  if (canViewModule('pur_approve') || canViewModule('purchases')) purChildren.push({ id: 'pur-approve', label: 'Approval Workflow', path: `${base}/purchases/approvals`, icon: ClipboardCheck })
  if (canViewModule('pur_audit') || canViewModule('purchases')) purChildren.push({ id: 'pur-audit', label: 'Audit Logs', path: `${base}/purchases/audit`, icon: ScrollText })

  if (purChildren.length > 0) {
    links.push({
      id: 'purchases', label: 'Purchase Management', icon: Store, path: `${base}/purchases`,
      children: purChildren,
    })
  }

  // 7. Manufacturing
  const mfgChildren = []
  if (canViewModule('manufacturing') || canViewModule('mfg_dashboard')) mfgChildren.push({ id: 'mfg-dashboard', label: 'Manufacturing Dashboard', path: `${base}/manufacturing/dashboard`, icon: LayoutDashboard })
  if (canViewModule('mfg_production') || canViewModule('manufacturing')) mfgChildren.push({ id: 'mfg-production', label: 'Production Orders', path: `${base}/manufacturing/production`, icon: Cog })
  if (canViewModule('mfg_batches') || canViewModule('manufacturing')) mfgChildren.push({ id: 'mfg-batches', label: 'Batch Tracking & QC', path: `${base}/manufacturing/batches`, icon: PackageOpen })
  if (canViewModule('mfg_audit') || canViewModule('manufacturing')) mfgChildren.push({ id: 'mfg-audit', label: 'Audit Logs', path: `${base}/manufacturing/audit`, icon: ScrollText })

  if (mfgChildren.length > 0) {
    links.push({
      id: 'manufacturing', label: 'Manufacturing', icon: Factory, path: `${base}/manufacturing`,
      children: mfgChildren,
    })
  }

  // Admin & SSO sections
  const isOwnerUser = isOwner || String(userRole).toLowerCase() === 'owner';
  const hasSsoAccess =
    isSuperAdminGlobal ||
    isOwnerUser ||
    userRole === 'company_admin' ||
    userRole === 'super_admin' ||
    (Array.isArray(accessibleModuleKeys) && (accessibleModuleKeys.includes('sso') || accessibleModuleKeys.includes('admin'))) ||
    canViewModule('sso') ||
    canViewModule('SSO') ||
    canViewModule('admin');

  if (hasSsoAccess) {
    const adminChildren = []

    if (isSuperAdminGlobal) {
      adminChildren.push({ id: 'users', label: 'Users', path: `${base}/users`, icon: Users })
      adminChildren.push({ id: 'roles', label: 'Roles', path: `${base}/roles`, icon: ShieldCheck })
      adminChildren.push({ id: 'modules', label: 'Modules', path: `${base}/modules`, icon: Box })
      adminChildren.push({ id: 'module-routes', label: 'Module Routes', path: `${base}/module-routes`, icon: Layers })
      adminChildren.push({ id: 'sessions', label: 'Sessions', path: `${base}/sessions`, icon: Activity })
    } else {
      adminChildren.push({ id: 'admin-dashboard', label: 'Admin Dashboard', path: `${base}/admin`, icon: LayoutDashboard })
      if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('sso_user') || canViewModule('user') || canViewModule('USER')) {
        adminChildren.push({ id: 'users', label: 'Users', path: `${base}/users`, icon: Users })
      }
      if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('sso_role') || canViewModule('role') || canViewModule('ROLE')) {
        adminChildren.push({ id: 'roles', label: 'Roles', path: `${base}/roles`, icon: ShieldCheck })
      }
      if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('sso_portal_access') || canViewModule('portal_access') || canViewModule('PORTAL_ACCESS')) {
        adminChildren.push({ id: 'portal-access', label: 'Portal Access', path: `${base}/portal-access`, icon: Globe })
      }
      if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('sso_session') || canViewModule('session') || canViewModule('SESSION')) {
        adminChildren.push({ id: 'sessions', label: 'Sessions', path: `${base}/sessions`, icon: Activity })
      }
      if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('sso_system_logs') || canViewModule('system_logs') || canViewModule('audit')) {
        adminChildren.push({ id: 'system-logs', label: 'System Logs', path: `${base}/admin/system-logs`, icon: ScrollText })
      }
    }
    if (isOwnerUser || userRole === 'company_admin' || userRole === 'super_admin' || canViewModule('workflow') || canViewModule('WORKFLOW')) {
      adminChildren.push({ id: 'workflow-approval-requests', label: 'Approval Requests', path: `/workflows/approvals`, icon: ClipboardCheck })
      adminChildren.push({ id: 'workflow-approvals', label: 'Workflow & Approvals', path: `/workflows`, icon: ClipboardCheck })
    }

    if (adminChildren.length > 0) {
      links.push({
        id: 'admin', label: 'SSO & Administration', icon: ShieldCheck, path: isSuperAdminGlobal ? `${base}/users` : `${base}/admin`,
        children: adminChildren
      })
    }
  }

  return links
}
