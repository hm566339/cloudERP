// This config mirrors the backend rbac.yaml as the source of truth for the frontend UX gating.

export const MODULES = {
  CUSTOMERS: 'CUSTOMERS',
  VENDORS: 'VENDORS',
  SALES_INVOICES: 'SALES_INVOICES',
  AR_INVOICES: 'SALES_INVOICES',      // Alias: AR invoices use the SALES_INVOICES module key
  PURCHASE_INVOICES: 'PURCHASE_INVOICES',
  PAYMENT_VOUCHERS: 'PAYMENT_VOUCHERS',
  RECEIPTS: 'RECEIPTS',
  CREDIT_NOTES: 'CREDIT_NOTES',
  DEBIT_NOTES: 'DEBIT_NOTES',
  GL_JOURNALS: 'GL_JOURNALS',
  CHART_OF_ACCOUNTS: 'CHART_OF_ACCOUNTS',
  BANK_ACCOUNTS: 'BANK_ACCOUNTS',
  BANK_TRANSACTIONS: 'BANK_TRANSACTIONS',
  BUDGET_HEADERS: 'BUDGET_HEADERS',
  REPORTS: 'REPORTS',
  DASHBOARD: 'DASHBOARD',
  GST_SLABS: 'GST_SLABS',
  HSN_SAC: 'HSN_SAC',
  SALES_TAXES: 'SALES_TAXES',
  GST_MASTER: 'GST_MASTER',
  GST_REPORTS: 'GST_REPORTS',
  RECONCILIATION: 'RECONCILIATION',
  AUDIT_LOGS: 'AUDIT_LOGS',
  FISCAL_YEARS: 'FISCAL_YEARS',
  ACCOUNTING_PERIODS: 'ACCOUNTING_PERIODS',
  ACCOUNT_GROUPS: 'ACCOUNT_GROUPS',
  ACCOUNT_CATEGORIES: 'ACCOUNT_CATEGORIES',
  APPROVALS: 'APPROVALS'
};

const ALL_MODULES_LIST = Object.values(MODULES);

export const RBAC_CONFIG = {
  roles: {
    SUPER_ADMIN: {
      permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
      modules: ['ALL_MODULES']
    },
    SYSTEM_ADMIN: {
      // Alias for SUPER_ADMIN — matches backend JWT role name
      permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
      modules: ['ALL_MODULES']
    },
    COMPANY_ADMIN: {
      permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      modules: [
        'FISCAL_YEARS', 'ACCOUNTING_PERIODS', 'ACCOUNT_GROUPS', 
        'ACCOUNT_CATEGORIES', 'CHART_OF_ACCOUNTS', 'DASHBOARD'
      ]
    },
    FINANCE_MANAGER: {
      permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
      modules: [
        'CUSTOMERS', 'VENDORS', 'SALES_INVOICES', 'PURCHASE_INVOICES', 'PAYMENT_VOUCHERS',
        'RECEIPTS', 'CREDIT_NOTES', 'DEBIT_NOTES', 'GL_JOURNALS', 'CHART_OF_ACCOUNTS',
        'BANK_ACCOUNTS', 'BANK_TRANSACTIONS', 'BUDGET_HEADERS', 'REPORTS', 'GST_REPORTS', 'DASHBOARD'
      ]
    },
    ACCOUNTANT: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: [
        'CUSTOMERS', 'VENDORS', 'SALES_INVOICES', 'PURCHASE_INVOICES', 'PAYMENT_VOUCHERS',
        'RECEIPTS', 'CREDIT_NOTES', 'DEBIT_NOTES', 'GL_JOURNALS', 'CHART_OF_ACCOUNTS', 
        'REPORTS', 'GST_REPORTS', 'DASHBOARD'
      ]
    },
    AP_EXECUTIVE: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['VENDORS', 'PURCHASE_INVOICES', 'PAYMENT_VOUCHERS', 'REPORTS', 'DASHBOARD']
    },
    AR_EXECUTIVE: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['CUSTOMERS', 'SALES_INVOICES', 'RECEIPTS', 'REPORTS', 'DASHBOARD']
    },
    CASHIER: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['RECEIPTS', 'PAYMENT_VOUCHERS', 'BANK_TRANSACTIONS', 'DASHBOARD']
    },
    GL_ACCOUNTANT: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['GL_JOURNALS', 'CHART_OF_ACCOUNTS', 'ACCOUNT_GROUPS', 'ACCOUNT_CATEGORIES', 'REPORTS', 'DASHBOARD']
    },
    TAX_MANAGER: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['GST_MASTER', 'GST_REPORTS', 'GST_SLABS', 'HSN_SAC', 'SALES_TAXES', 'DASHBOARD']
    },
    BUDGET_MANAGER: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['BUDGET_HEADERS', 'REPORTS', 'DASHBOARD']
    },
    BANK_MANAGER: {
      permissions: ['READ', 'CREATE', 'UPDATE'],
      modules: ['BANK_ACCOUNTS', 'BANK_TRANSACTIONS', 'RECONCILIATION', 'DASHBOARD']
    },
    AUDITOR: {
      permissions: ['READ'],
      modules: ['ALL_MODULES']
    },
    CFO: {
      permissions: ['READ', 'APPROVE'],
      modules: ['ALL_MODULES']
    },
    VIEWER: {
      permissions: ['READ'],
      modules: ['DASHBOARD']
    }
  }
};

/**
 * Resolves the configuration into a normalized object for the current role
 * @param {string} roleName 
 * @returns {object} { permissions: [...], modules: [...] }
 */
export const resolveRolePermissions = (roleName) => {
  const normalizedRole = String(roleName || 'VIEWER').toUpperCase();
  const config = RBAC_CONFIG.roles[normalizedRole] || RBAC_CONFIG.roles.VIEWER;
  
  let resolvedModules = config.modules;
  if (resolvedModules.includes('ALL_MODULES')) {
    resolvedModules = ALL_MODULES_LIST;
  }
  
  return {
    role: normalizedRole,
    permissions: config.permissions,
    modules: resolvedModules
  };
};
