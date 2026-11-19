import { useAppSelector } from '../app/hooks.js';
import { selectCurrentUser, selectAuthContext } from '../features/auth/authSlice.js';
import {
  normalizeModuleName,
  getEntitledModules,
  hasModule as checkHasModule,
  hasFeature as checkHasFeature,
  hasPermission as checkHasPermission,
  canRead as checkCanRead,
  canWrite as checkCanWrite,
  canDelete as checkCanDelete,
  canViewModule as checkCanViewModule,
  isOwnerUser,
  CANONICAL_MODULES,
} from './moduleNormalization.js';

export {
  normalizeModuleName,
  getEntitledModules,
  CANONICAL_MODULES,
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  COMPANY_ADMIN: 'company_admin',
  FINANCE_MANAGER: 'finance_manager',
  ACCOUNTANT: 'accountant',
  AP_EXECUTIVE: 'ap_executive',
  AR_EXECUTIVE: 'ar_executive',
  CASHIER: 'cashier',
  GL_ACCOUNTANT: 'gl_accountant',
  TAX_MANAGER: 'tax_manager',
  BUDGET_MANAGER: 'budget_manager',
  BANK_MANAGER: 'bank_manager',
  AUDITOR: 'auditor',
  CFO: 'cfo',
  VIEWER: 'viewer', // fallback
};

// Map of roles to their capabilities based on backend application-rbac.yml
export const rolePermissions = {
  [ROLES.SUPER_ADMIN]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'],
    modules: ['ALL_MODULES']
  },
  [ROLES.OWNER]: {
    canCreate: true, canEdit: true, canDelete: true, canApprove: true,
    permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'],
    modules: ['ALL_MODULES', 'ORGANIZATION', 'COMPANIES', 'DASHBOARD', 'REPORTS', 'WORKFLOW', 'workflows', 'workflow', 'APPROVALS', 'approvals']
  },
  [ROLES.COMPANY_ADMIN]: {
    canCreate: true, canEdit: true, canDelete: true, canApprove: true,
    modules: ['companies', 'fiscal_years', 'accounting_periods', 'account_groups', 'account_categories', 'chart_of_accounts', 'dashboard', 'ACCOUNTS_RECEIVABLE', 'CUSTOMERS', 'VENDORS', 'BANK_ACCOUNTS', 'BANK_TRANSACTIONS', 'GL_JOURNALS', 'GENERAL_LEDGER', 'EXPENSES', 'expenses', 'WORKFLOW', 'workflows', 'workflow', 'APPROVALS', 'approvals']
  },
  [ROLES.FINANCE_MANAGER]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'],
    modules: [
      'CUSTOMERS', 'VENDORS', 'QUOTATIONS', 'SALES_INVOICES', 'PURCHASE_INVOICES',
      'PAYMENT_VOUCHERS', 'RECEIPTS', 'CREDIT_NOTES', 'DEBIT_NOTES',
      'GENERAL_LEDGER', 'CHART_OF_ACCOUNTS', 'ACCOUNT_GROUPS', 'ACCOUNT_CATEGORIES',
      'GL_JOURNALS', 'GL_JOURNAL_LINES', 'BANK_ACCOUNTS', 'BANK_TRANSACTIONS',
      'BUDGET_HEADERS', 'BUDGET_LINES', 'GST_SLABS', 'HSN_SAC', 'GST_MASTER', 'GST_REPORTS',
      'REPORTS', 'DASHBOARD', 'AUDIT_LOGS', 'ACCOUNTING_PERIODS', 'FISCAL_YEARS',
      'ACCOUNTS_RECEIVABLE', 'EXPENSES',
      'PRODUCTS', 'PRODUCT_PRICES', 'STOCK', 'STOCK_MOVEMENTS', 'STOCK_ADJUSTMENTS',
      'INVENTORY_VALUATION', 'INVENTORY_REPORTS',
      'SALES_INVOICE_INTEGRATION', 'PURCHASE_INVOICE_INTEGRATION', 'STOCK_INTEGRATION',
      'WAREHOUSES', 'WAREHOUSE_LOCATIONS'
    ]
  },
  [ROLES.ACCOUNTANT]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'EXPORT', 'PRINT'],
    modules: [
      'CUSTOMERS', 'VENDORS', 'QUOTATIONS', 'SALES_INVOICES', 'PURCHASE_INVOICES',
      'PAYMENT_VOUCHERS', 'RECEIPTS', 'CREDIT_NOTES', 'DEBIT_NOTES',
      'GL_JOURNALS', 'GL_JOURNAL_LINES', 'CHART_OF_ACCOUNTS',
      'REPORTS', 'GST_MASTER', 'GST_REPORTS', 'GST_SLABS', 'HSN_SAC', 'DASHBOARD', 'ACCOUNTS_RECEIVABLE',
      'BUDGET_HEADERS', 'BUDGET_LINES', 'EXPENSES',
      'PRODUCTS', 'PRODUCT_PRICES', 'STOCK', 'WAREHOUSES', 'WAREHOUSE_LOCATIONS',
      'STOCK_MOVEMENTS', 'INVENTORY_VALUATION', 'INVENTORY_REPORTS',
      'SALES_INVOICE_INTEGRATION', 'PURCHASE_INVOICE_INTEGRATION', 'STOCK_INTEGRATION'
    ]
  },
  [ROLES.AP_EXECUTIVE]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'],
    modules: [
      'VENDORS', 'PURCHASE_INVOICES', 'PAYMENT_VOUCHERS', 'REPORTS', 'DASHBOARD',
      'PRODUCTS', 'PRODUCT_UOMS', 'WAREHOUSES', 'WAREHOUSE_LOCATIONS',
      'PRODUCT_PRICES', 'PRODUCT_BATCHES', 'PURCHASE_INVOICE_INTEGRATION'
    ]
  },
  [ROLES.AR_EXECUTIVE]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'],
    modules: [
      'CUSTOMERS', 'SALES_INVOICES', 'RECEIPTS', 'REPORTS', 'DASHBOARD',
      'PRODUCTS', 'PRODUCT_UOMS', 'PRODUCT_PRICES', 'SALES_INVOICE_INTEGRATION'
    ]
  },
  [ROLES.CASHIER]: {
    permissions: ['CREATE', 'READ', 'UPDATE'],
    modules: ['RECEIPTS', 'PAYMENT_VOUCHERS', 'BANK_TRANSACTIONS', 'DASHBOARD']
  },
  [ROLES.GL_ACCOUNTANT]: {
    permissions: ['READ', 'EXPORT', 'PRINT'],
    modules: [
      'GL_JOURNALS', 'GL_JOURNAL_LINES', 'CHART_OF_ACCOUNTS', 'ACCOUNT_GROUPS', 'ACCOUNT_CATEGORIES', 'REPORTS', 'DASHBOARD',
      'PRODUCTS', 'STOCK', 'WAREHOUSES', 'WAREHOUSE_LOCATIONS',
      'INVENTORY_VALUATION', 'INVENTORY_REPORTS'
    ]
  },
  [ROLES.TAX_MANAGER]: {
    permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'PRINT'],
    modules: [
      'GST_SLABS', 'HSN_SAC', 'GST_MASTER', 'GST_REPORTS', 'SALES_TAXES', 'DASHBOARD',
      'PRODUCTS', 'PRODUCT_CATEGORIES', 'PRODUCT_UOMS', 'INVENTORY_REPORTS'
    ]
  },
  [ROLES.BUDGET_MANAGER]: {
    permissions: ['CREATE', 'READ', 'UPDATE'],
    modules: ['BUDGET_HEADERS', 'BUDGET_LINES', 'REPORTS', 'DASHBOARD']
  },
  [ROLES.BANK_MANAGER]: {
    permissions: ['CREATE', 'READ', 'UPDATE'],
    modules: ['BANK_ACCOUNTS', 'BANK_TRANSACTIONS', 'BANK_RECONCILIATION', 'DASHBOARD']
  },
  [ROLES.AUDITOR]: {
    permissions: ['READ', 'EXPORT', 'PRINT'],
    modules: ['ALL_MODULES', 'CUSTOMERS', 'VENDORS', 'PURCHASE_INVOICES', 'SALES_INVOICES', 'GENERAL_LEDGER', 'REPORTS', 'AUDIT_LOGS', 'DASHBOARD']
  },
  [ROLES.CFO]: {
    permissions: ['READ', 'APPROVE', 'EXPORT', 'PRINT'],
    modules: ['ALL_MODULES', 'DASHBOARD', 'REPORTS']
  },
  [ROLES.VIEWER]: {
    permissions: ['READ'],
    modules: [
      'DASHBOARD',
      'PRODUCTS', 'STOCK', 'INVENTORY_REPORTS'
    ]
  }
};

/**
 * Decodes a JWT token safely without using external libraries
 */
export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

/**
 * Extracts and normalizes the role from the JWT token and fallback user object
 */
export function extractRoleFromToken(token, user = {}) {
  const decodedToken = parseJwt(token) || {};
  let rawRole = 'viewer';

  // Check token payload first
  if (decodedToken.roles && decodedToken.roles.length > 0) {
    rawRole = typeof decodedToken.roles[0] === 'string' ? decodedToken.roles[0] : (decodedToken.roles[0]?.name || 'viewer');
  } else if (decodedToken.role) {
    if (typeof decodedToken.role === 'string') rawRole = decodedToken.role;
    else if (Array.isArray(decodedToken.role)) rawRole = decodedToken.role[0]?.name || decodedToken.role[0] || 'viewer';
  }
  // Fallback to the user object
  else if (user.roles && user.roles.length > 0) {
    rawRole = typeof user.roles[0] === 'string' ? user.roles[0] : (user.roles[0]?.name || 'viewer');
  } else if (user.role) {
    if (typeof user.role === 'string') rawRole = user.role;
    else if (Array.isArray(user.role)) rawRole = user.role[0]?.name || user.role[0] || 'viewer';
  }

  return normalizeRole(rawRole);
}

/**
 * Normalizes the role name from the backend to our constants
 */
export function normalizeRole(roleName) {
  if (!roleName) return ROLES.VIEWER;
  const lower = typeof roleName === 'string' ? roleName.toLowerCase() : String(roleName).toLowerCase();
  const stripped = lower.replace(/[\s_]/g, '');

  if (stripped.includes('superadmin') || stripped === 'systemadmin') return ROLES.SUPER_ADMIN;
  if (stripped === 'owner' || stripped === 'organizationowner') return ROLES.OWNER;
  if (stripped.includes('companyadmin')) return ROLES.COMPANY_ADMIN;
  if (stripped.includes('financemanager')) return ROLES.FINANCE_MANAGER;
  if (stripped.includes('glaccountant')) return ROLES.GL_ACCOUNTANT;
  if (stripped.includes('accountant')) return ROLES.ACCOUNTANT;
  if (stripped.includes('apexecutive')) return ROLES.AP_EXECUTIVE;
  if (stripped.includes('arexecutive')) return ROLES.AR_EXECUTIVE;
  if (stripped.includes('cashier')) return ROLES.CASHIER;
  if (stripped.includes('taxmanager')) return ROLES.TAX_MANAGER;
  if (stripped.includes('budgetmanager')) return ROLES.BUDGET_MANAGER;
  if (stripped.includes('bankmanager')) return ROLES.BANK_MANAGER;
  if (stripped.includes('auditor') || stripped.includes('audit')) return ROLES.AUDITOR;
  if (stripped.includes('cfo')) return ROLES.CFO;

  return lower;
}

/**
 * Custom hook to enforce canonical authorization in components.
 * Consumes single normalized authContext from Redux.
 */
export function useRBAC() {
  const authContext = useAppSelector(selectAuthContext);
  const currentUser = useAppSelector(selectCurrentUser);
  const user = authContext?.user || currentUser;

  let roleName = ROLES.VIEWER;
  if (user && user.role) {
    if (typeof user.role === 'string') {
      roleName = normalizeRole(user.role);
    } else if (Array.isArray(user.role)) {
      roleName = normalizeRole(user.role[0]?.name || user.role[0]);
    }
  }

  const isSuperAdmin = roleName === ROLES.SUPER_ADMIN;
  const isOwner = roleName === ROLES.OWNER || authContext?.membership?.memberType === 'OWNER' || isOwnerUser(authContext);

  const accessMode = String(authContext?.accessMode || user?.accessMode || '').toUpperCase();
  const isBlocked = accessMode === 'BLOCKED';
  const isReadOnly = accessMode === 'READ_ONLY';

  const canCreate = (mod = null) => {
    if (isBlocked || isReadOnly) return false;
    if (isSuperAdmin || isOwner) return true;
    if (mod) return checkHasPermission(authContext, mod, 'CREATE');
    const hasAnyWrite = (authContext.permissions || []).some(p => {
      const act = typeof p === 'string' ? p : (p.action || p.permissionCode || '');
      return String(act).toUpperCase().includes('CREATE') || String(act).toUpperCase().includes('WRITE');
    });
    return hasAnyWrite || (rolePermissions[roleName]?.canCreate ?? false);
  };

  const canEdit = (mod = null) => {
    if (isBlocked || isReadOnly) return false;
    if (isSuperAdmin || isOwner) return true;
    if (mod) return checkHasPermission(authContext, mod, 'UPDATE');
    const hasAnyUpdate = (authContext.permissions || []).some(p => {
      const act = typeof p === 'string' ? p : (p.action || p.permissionCode || '');
      return String(act).toUpperCase().includes('UPDATE') || String(act).toUpperCase().includes('EDIT') || String(act).toUpperCase().includes('WRITE');
    });
    return hasAnyUpdate || (rolePermissions[roleName]?.canEdit ?? false);
  };

  const canDelete = (mod = null) => {
    if (isBlocked || isReadOnly) return false;
    if (isSuperAdmin || isOwner) return true;
    if (mod) return checkCanDelete(authContext, mod);
    const hasAnyDelete = (authContext.permissions || []).some(p => {
      const act = typeof p === 'string' ? p : (p.action || p.permissionCode || '');
      return String(act).toUpperCase().includes('DELETE');
    });
    return hasAnyDelete || (rolePermissions[roleName]?.canDelete ?? false);
  };

  const canApprove = (mod = null) => {
    if (isBlocked || isReadOnly) return false;
    if (isSuperAdmin || isOwner) return true;
    if (mod) return checkHasPermission(authContext, mod, 'APPROVE');
    const hasAnyApprove = (authContext.permissions || []).some(p => {
      const act = typeof p === 'string' ? p : (p.action || p.permissionCode || '');
      return String(act).toUpperCase().includes('APPROVE');
    });
    return hasAnyApprove || (rolePermissions[roleName]?.canApprove ?? false);
  };

  const canViewModule = (moduleName) => {
    return checkCanViewModule(authContext, moduleName);
  };

  const hasModule = (moduleName) => {
    return checkHasModule(authContext, moduleName);
  };

  const hasFeature = (featureName, moduleName) => {
    return checkHasFeature(authContext, featureName, moduleName);
  };

  const hasPermission = (featureName, action, moduleName) => {
    return checkHasPermission(authContext, featureName, action, moduleName);
  };

  const canRead = (featureName, moduleName) => {
    return checkCanRead(authContext, featureName, moduleName);
  };

  const canWrite = (featureName, moduleName) => {
    return checkCanWrite(authContext, featureName, moduleName);
  };

  return {
    roleName,
    authContext,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canViewModule,
    hasModule,
    hasFeature,
    hasPermission,
    canRead,
    canWrite,
    canDeleteAction: (feat, mod) => checkCanDelete(authContext, feat, mod),

    isSuperAdmin,
    isOwner,
    isCompanyAdmin: roleName === ROLES.COMPANY_ADMIN,
    isFinanceManager: roleName === ROLES.FINANCE_MANAGER,
    isAccountant: roleName === ROLES.ACCOUNTANT,
    isApExecutive: roleName === ROLES.AP_EXECUTIVE,
    isArExecutive: roleName === ROLES.AR_EXECUTIVE,
    isCashier: roleName === ROLES.CASHIER,
    isGlAccountant: roleName === ROLES.GL_ACCOUNTANT,
    isTaxManager: roleName === ROLES.TAX_MANAGER,
    isBudgetManager: roleName === ROLES.BUDGET_MANAGER,
    isBankManager: roleName === ROLES.BANK_MANAGER,
    isAuditor: roleName === ROLES.AUDITOR,
    isCFO: roleName === ROLES.CFO,
    isViewer: roleName === ROLES.VIEWER,

    // Legacy backwards compatibility mappings
    isAdmin: roleName === ROLES.SUPER_ADMIN || roleName === ROLES.COMPANY_ADMIN,
    isManager: roleName === ROLES.FINANCE_MANAGER || roleName === ROLES.CFO,
    isOperator: [
      ROLES.ACCOUNTANT, ROLES.AP_EXECUTIVE, ROLES.AR_EXECUTIVE,
      ROLES.CASHIER, ROLES.GL_ACCOUNTANT, ROLES.TAX_MANAGER,
      ROLES.BUDGET_MANAGER, ROLES.BANK_MANAGER
    ].includes(roleName),
  };
}

export function canAccessModule(userOrModules, moduleName) {
  if (!userOrModules && userOrModules !== 0) return false;

  const modules = Array.isArray(userOrModules)
    ? userOrModules
    : (userOrModules?.modules || userOrModules?.permissions || []);

  const normalizedModules = (modules || [])
    .map((module) => normalizeModuleName(module))
    .filter(Boolean);

  const targetModule = normalizeModuleName(moduleName);
  if (!targetModule) return false;

  return normalizedModules.includes('ALL_MODULES') || normalizedModules.includes(targetModule);
}

export function hasModule(user, moduleName) {
  if (!user) return false;
  return checkHasModule(user, moduleName);
}

export function hasPermission(user, permission, action = null) {
  if (!user) return false;
  return checkHasPermission(user, permission, action);
}

export function canAccess(user, moduleName, permission = null) {
  if (!user) return false;
  if (!checkCanViewModule(user, moduleName)) return false;
  if (permission && !checkHasPermission(user, permission)) return false;
  return true;
}

export function derivePermissionsFrom(user = {}, decodedToken = {}, userRole = null) {
  const explicit = user?.permissions || [];
  if (explicit && explicit.length > 0) return explicit;

  const tokenPerms = decodedToken?.permissions || decodedToken?.modules || [];
  if (Array.isArray(tokenPerms) && tokenPerms.length > 0) return tokenPerms;

  if (decodedToken?.moduleName) return [decodedToken.moduleName];

  return [];
}
