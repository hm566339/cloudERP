/**
 * @fileoverview Centralized route definitions and path helpers.
 * Single source of truth for all navigation and routing throughout CloudERP.
 */

export const PATHS = {
  // Public & Authentication
  ROOT: '/',
  LANDING: '/landing',
  TRY_FREE: '/try-free',
  LOGIN: '/',
  MODULES: '/',
  ADMIN_LOGIN: '/admin-login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  AUTH_CALLBACK: '/auth/callback',
  NOT_AUTHORIZED: '/403',
  NOT_FOUND: '/404',

  // Core Shell & Switchers
  WORKSPACE: '/workspace',
  COMPANY_SELECT: '/company-select',

  // Dashboards
  SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
  OWNER_DASHBOARD: '/owner/dashboard',
  ACCOUNTS_DASHBOARD: '/accounts/dashboard',
  INVENTORY_DASHBOARD: '/inventory/dashboard',
  CRM_DASHBOARD: '/crm/dashboard',

  // Accounts & Finance
  ACCOUNTS: {
    ROOT: '/accounts',
    DASHBOARD: '/accounts/dashboard',
    ORGANIZATION: '/accounts/organization',
    FINANCIAL_YEARS: '/accounts/organization/financial-years',
    ACCOUNTING_PERIODS: '/accounts/organization/accounting-periods',
    CHART_OF_ACCOUNTS: '/accounts/masters/ledgers',
    CUSTOMERS: '/accounts/masters/customers',
    VENDORS: '/accounts/masters/vendors',
    EXPENSE_CATEGORIES: '/accounts/masters/expense-categories',
    BANK_ACCOUNTS: '/accounts/masters/bank-accounts',
    BANK_TRANSACTIONS: '/accounts/masters/bank-transactions',
    JOURNAL_ENTRIES: '/accounts/general-ledger/journal-entries',
    GENERAL_LEDGER: '/accounts/general-ledger/ledger-report',
    SALES_INVOICES: '/accounts/receivables/invoices',
    QUOTATIONS: '/accounts/receivables/quotations',
    PROFORMA_INVOICES: '/accounts/receivables/proforma',
    RECEIPT_VOUCHERS: '/accounts/receivables/receipts',
    CREDIT_NOTES: '/accounts/receivables/credit-notes',
    DELIVERY_CHALLANS: '/accounts/receivables/delivery-challans',
    PURCHASE_INVOICES: '/accounts/payables/invoices',
    PAYMENT_VOUCHERS: '/accounts/payables/payments',
    DEBIT_NOTES: '/accounts/payables/debit-notes',
    PURCHASE_ORDERS: '/accounts/payables/orders',
    PURCHASE_REQUISITIONS: '/accounts/payables/requests',
    GOODS_RECEIPTS: '/accounts/payables/goods-receipts',
    EXPENSES: '/accounts/expenses',
    BUDGETS: '/accounts/budgets',
    GST_REPORTS: '/accounts/gst/reports',
    REPORTS: '/accounts/reports',
    AUDIT_LOGS: '/accounts/audit-logs',
  },

  // Inventory
  INVENTORY: {
    ROOT: '/inventory',
    DASHBOARD: '/inventory/dashboard',
    PRODUCTS: '/inventory/products',
    CATEGORIES: '/inventory/categories',
    UOMS: '/inventory/uom',
    PRICES: '/inventory/prices',
    WAREHOUSES: '/inventory/warehouses',
    STOCKS: '/inventory/stocks',
    MOVEMENTS: '/inventory/movements',
    ADJUSTMENTS: '/inventory/adjustments',
    TRANSFERS: '/inventory/transfers',
    RESERVATIONS: '/inventory/reservations',
    BATCHES: '/inventory/batches',
    SERIALS: '/inventory/serials',
    VALUATION: '/inventory/valuation',
  },

  // Workflows & Approvals
  WORKFLOWS: {
    ROOT: '/workflows',
    DASHBOARD: '/workflows/dashboard',
    DEFINITIONS: '/workflows/definitions',
    TASKS: '/workflows/tasks',
    AUDIT: '/workflows/audit',
  },

  // Company / Settings / System Admin
  COMPANY: (companyId = ':companyId') => `/company/${companyId}`,
  COMPANY_DASHBOARD: (companyId = ':companyId') => `/company/${companyId}/dashboard`,
  SETTINGS: {
    ROOT: '/settings',
    GENERAL: '/settings/general',
    SECURITY: '/settings/security',
    SECURITY_ROLES: '/settings/security/roles',
    SECURITY_USERS: '/settings/security/users',
    SECURITY_FEATURES: '/settings/security/features',
    SECURITY_PERMISSIONS: '/settings/security/permissions',
    NOTIFICATIONS: '/settings/notifications',
    INTEGRATIONS: '/settings/integrations',
    PLANS: '/settings/plans',
    ACCOUNT: '/settings/sales',
    SALES: '/settings/sales',
    INVENTORY: '/settings/inventory',
    WORKFLOW: '/settings/workflow',
    CRM: '/settings/crm',
  },
  SUPER_ADMIN: {
    ROOT: '/super-admin',
    ORGANIZATIONS: '/super-admin/organizations',
    COMPANIES: '/super-admin/companies',
    MODULES: '/super-admin/modules',
    SESSIONS: '/super-admin/sessions',
  },
};

export default PATHS;
