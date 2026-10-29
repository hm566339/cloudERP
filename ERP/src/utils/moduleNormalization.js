/**
 * Centralized Module Normalization & Authorization Helper
 * Canonical SSO /api/sso/auth/me authorization context processor.
 */

export const CANONICAL_MODULES = {
  ACCOUNT: 'ACCOUNT',
  INVENTORY: 'INVENTORY',
  CRM: 'CRM',
  CORE: 'CORE',
  HR: 'HR',
  MANUFACTURING: 'MANUFACTURING',
  PURCHASES: 'PURCHASES',
  WORKFLOW: 'WORKFLOW',
  SSO: 'SSO',
};

export const SSO_FEATURE_CODES = [
  'AUTH',
  'USER',
  'ROLE',
  'PERMISSION',
  'FEATURE',
  'MODULE',
  'MODULE_ROUTE',
  'COMPANY',
  'COMPANY_SUBSCRIPTION',
  'SUBSCRIPTION',
  'SUBSCRIPTION_PLAN',
  'SESSION',
  'ORGANIZATION',
  'PORTAL_ACCESS',
  'DASHBOARD',
  'PLATFORM_ADMIN',
  'BILLING',
];

/**
 * Normalizes any module identifier (string or object) to its canonical module name.
 * e.g.:
 *   'accountDev', 'account', 'accounts', 'finance', 'accounting' -> 'ACCOUNT'
 *   'inventory', 'inv' -> 'INVENTORY'
 *   'crm', 'sales-crm', 'salescrm', 'sales' -> 'CRM'
 *   'workflow', 'workflows', 'wf' -> 'WORKFLOW'
 *   'core' -> 'CORE'
 *   'sso', 'SSO', 'auth', 'admin' -> 'SSO'
 */
export function normalizeModuleName(input) {
  if (!input && input !== 0) return '';
  const name = typeof input === 'object'
    ? (input.canonical || input.name || input.code || input.moduleName || '')
    : input;
  const raw = String(name).trim();
  const lower = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (lower.startsWith('account') || lower.startsWith('finance') || lower.startsWith('accounting')) {
    return CANONICAL_MODULES.ACCOUNT;
  }
  if (lower.startsWith('inventor') || lower === 'inv') {
    return CANONICAL_MODULES.INVENTORY;
  }
  if (lower === 'crm' || lower.includes('salescrm') || lower === 'sales') {
    return CANONICAL_MODULES.CRM;
  }
  if (lower.startsWith('workflow') || lower === 'wf') {
    return CANONICAL_MODULES.WORKFLOW;
  }
  if (lower === 'hr') {
    return CANONICAL_MODULES.HR;
  }
  if (lower.startsWith('manufactur') || lower === 'mfg') {
    return CANONICAL_MODULES.MANUFACTURING;
  }
  if (lower.startsWith('purchase') || lower.startsWith('procure')) {
    return CANONICAL_MODULES.PURCHASES;
  }
  if (lower === 'core') {
    return CANONICAL_MODULES.CORE;
  }
  if (lower === 'sso' || lower === 'auth' || lower === 'admin' || lower.includes('sso') || lower.includes('superadmin') || lower === 'systemadmin' || lower === 'portalaccess') {
    return CANONICAL_MODULES.SSO;
  }
  return raw.toUpperCase();
}

export function normalizeRole(rawRole) {
  let roleStr = 'viewer';
  if (typeof rawRole === 'string') roleStr = rawRole;
  else if (Array.isArray(rawRole)) roleStr = rawRole[0]?.name || String(rawRole[0]) || 'viewer';
  else if (rawRole && typeof rawRole === 'object') roleStr = rawRole.name || 'viewer';

  const lower = typeof roleStr === 'string' ? roleStr.toLowerCase() : 'viewer';
  const stripped = lower.replace(/[\s_]/g, '');
  if (stripped.includes('superadmin') || stripped === 'systemadmin') return 'super_admin';
  return lower;
}

export function normalizeModulesList(rawModules) {
  if (!Array.isArray(rawModules)) return [];
  return rawModules
    .filter((m) => m !== null && m !== undefined)
    .map((m) => {
      if (typeof m === 'string') {
        const canonical = normalizeModuleName(m);
        return { id: m, name: m, code: m.toLowerCase(), canonical, active: true };
      }
      if (typeof m !== 'object') return null;
      const canonical = normalizeModuleName(m.canonical || m.code || m.name);
      return {
        ...m,
        canonical,
        active: m.active !== false,
      };
    })
    .filter(Boolean);
}

export function normalizeFeaturesList(rawFeatures) {
  if (!Array.isArray(rawFeatures)) return [];
  return rawFeatures
    .filter((f) => f !== null && f !== undefined)
    .map((f) => {
      if (typeof f === 'string') {
        const upper = f.toUpperCase();
        const defaultMod = SSO_FEATURE_CODES.includes(upper) ? CANONICAL_MODULES.SSO : '';
        return {
          featureCode: upper,
          featureName: f,
          moduleName: defaultMod,
          active: true,
        };
      }
      if (typeof f !== 'object') return null;
      const feat = String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase();
      const explicitMod = normalizeModuleName(f.moduleName);
      const resolvedMod = explicitMod || (SSO_FEATURE_CODES.includes(feat) ? CANONICAL_MODULES.SSO : '');
      return {
        ...f,
        featureCode: feat,
        featureName: f.featureName || f.featureCode,
        moduleName: resolvedMod,
        active: f.active !== false,
      };
    })
    .filter(Boolean);
}

const FEATURE_CODE_ALIASES = {
  // SSO / System
  ROLES: 'ROLE',
  ROLE_MANAGEMENT: 'ROLE',
  USERS: 'USER',
  USER_MANAGEMENT: 'USER',
  PERMISSIONS: 'PERMISSION',
  PERMISSION_MANAGEMENT: 'PERMISSION',
  FEATURES: 'FEATURE',
  FEATURE_MANAGEMENT: 'FEATURE',
  MODULES: 'MODULE',
  MODULE_MANAGEMENT: 'MODULE',
  SESSIONS: 'SESSION',
  SESSION_MANAGEMENT: 'SESSION',
  PORTALACCESS: 'PORTAL_ACCESS',
  PORTAL_ACCESS: 'PORTAL_ACCESS',
  ORGANIZATIONS: 'ORGANIZATION',
  ORGANIZATION_MANAGEMENT: 'ORGANIZATION',
  COMPANIES: 'COMPANY',
  COMPANY_MANAGEMENT: 'COMPANY',
  SUBSCRIPTIONS: 'SUBSCRIPTION',
  SUBSCRIPTION_MANAGEMENT: 'SUBSCRIPTION',

  // Accounts
  CUSTOMER: 'CUSTOMERS',
  VENDOR: 'VENDORS',
  COA: 'CHART_OF_ACCOUNTS',
  LEDGER: 'CHART_OF_ACCOUNTS',
  LEDGERS: 'CHART_OF_ACCOUNTS',
  ACCOUNT_GROUP: 'ACCOUNT_GROUPS',
  ACCOUNT_CATEGORY: 'ACCOUNT_CATEGORIES',
  ACCOUNTING_PERIOD: 'ACCOUNTING_PERIODS',
  FISCAL_YEAR: 'FISCAL_YEARS',
  EXPENSE: 'EXPENSES',
  EXPENSE_CATEGORY: 'EXPENSE_CATEGORIES',
  EXPENSES_CATEGORY: 'EXPENSE_CATEGORIES',
  SALES_INVOICE: 'SALES_INVOICES',
  PURCHASE_INVOICE: 'PURCHASE_INVOICES',
  PAYMENT_VOUCHER: 'PAYMENT_VOUCHERS',
  RECEIPT_VOUCHER: 'RECEIPT_VOUCHERS',
  CREDIT_NOTE: 'CREDIT_NOTES',
  DEBIT_NOTE: 'DEBIT_NOTES',
  GL_JOURNAL: 'GL_JOURNALS',
  GL_JOURNAL_LINE: 'GL_JOURNAL_LINES',
  GST_STATE: 'GST_STATE_MASTER',
  GST_REGISTRATION: 'GST_REGISTRATIONS',
  GST_SLAB: 'GST_SLABS',
  BANK_ACCOUNT: 'BANK_ACCOUNTS',
  BANK_TRANSACTION: 'BANK_TRANSACTIONS',
  BANK_RECON: 'BANK_RECONCILIATION',
  BUDGET: 'BUDGET_HEADERS',
  BUDGETS: 'BUDGET_HEADERS',
  BUDGET_HEADER: 'BUDGET_HEADERS',
  BUDGET_LINE: 'BUDGET_LINES',
  AUDIT_LOG: 'AUDIT_LOGS',

  // Inventory
  PRODUCT: 'PRODUCTS',
  CATEGORY: 'PRODUCT_CATEGORIES',
  CATEGORIES: 'PRODUCT_CATEGORIES',
  PRODUCT_CATEGORY: 'PRODUCT_CATEGORIES',
  PRODUCT_PRICE: 'PRODUCT_PRICES',
  PRODUCT_BATCH: 'PRODUCT_BATCHES',
  PRODUCT_SERIAL: 'PRODUCT_SERIALS',
  UNIT_OF_MEASURE: 'PRODUCT_UOMS',
  UNIT_OF_MEASURES: 'PRODUCT_UOMS',
  UOM: 'PRODUCT_UOMS',
  UOMS: 'PRODUCT_UOMS',
  WAREHOUSE: 'WAREHOUSES',
  WAREHOUSE_LOCATION: 'WAREHOUSE_LOCATIONS',
  STOCK_MOVEMENT: 'STOCK_MOVEMENTS',
  STOCK_TRANSFER: 'STOCK_TRANSFERS',
  STOCK_RESERVATION: 'STOCK_RESERVATIONS',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENTS',

  // Sales & CRM
  LEAD: 'LEADS',
  QUOTATION: 'QUOTATIONS',
  ORDER: 'SALES_ORDERS',
  ORDERS: 'SALES_ORDERS',
  SALES_ORDER: 'SALES_ORDERS',

  // Procurement
  PURCHASE_REQUEST: 'PURCHASE_REQUISITIONS',
  PURCHASE_REQUESTS: 'PURCHASE_REQUISITIONS',
  PURCHASE_REQUISITION: 'PURCHASE_REQUISITIONS',
  PURCHASE_ORDER: 'PURCHASE_ORDERS',
  SUPPLIER_QUOTE: 'SUPPLIER_QUOTATIONS',
  SUPPLIER_QUOTES: 'SUPPLIER_QUOTATIONS',
  SUPPLIER_QUOTATION: 'SUPPLIER_QUOTATIONS',
  GOODS_RECEIPT: 'GOODS_RECEIPTS',

  // Workflow & Approvals
  APPROVALS: 'WORKFLOW_TASKS',
  APPROVAL_REQUEST: 'WORKFLOW_TASKS',
  APPROVAL_REQUESTS: 'WORKFLOW_TASKS',
  WORKFLOW_TASK: 'WORKFLOW_TASKS',
  WORKFLOW_TASKS: 'WORKFLOW_TASKS',
  WORKFLOW_APPROVAL: 'WORKFLOW_DEFINITIONS',
  WORKFLOW_APPROVALS: 'WORKFLOW_DEFINITIONS',
  WORKFLOW_DEFINITION: 'WORKFLOW_DEFINITIONS',
  WORKFLOW_DEFINITIONS: 'WORKFLOW_DEFINITIONS',
};

export function normalizeFeatureCode(input) {
  if (!input) return '';
  const clean = String(input).trim().toUpperCase().replace(/[-\s]/g, '_');
  if (FEATURE_CODE_ALIASES[clean]) {
    return FEATURE_CODE_ALIASES[clean];
  }
  return clean;
}

export function normalizePermissionsList(rawPermissions) {
  if (!Array.isArray(rawPermissions)) return [];
  return rawPermissions
    .filter((p) => p !== null && p !== undefined)
    .map((p) => {
      if (typeof p === 'string') {
        const upper = p.trim().toUpperCase();
        if (!upper) return null;
        let parts = upper.split(':');
        let feat = parts[0] || upper;
        let act = parts[1] || '';
        if (!act && upper.includes('_')) {
          const lastUnderscore = upper.lastIndexOf('_');
          const suffix = upper.slice(lastUnderscore + 1);
          if (['READ', 'VIEW', 'CREATE', 'WRITE', 'UPDATE', 'EDIT', 'DELETE', 'APPROVE'].includes(suffix)) {
            feat = upper.slice(0, lastUnderscore);
            act = suffix;
          }
        }
        if (act === 'VIEW') act = 'READ';
        const defaultMod = SSO_FEATURE_CODES.includes(feat) ? CANONICAL_MODULES.SSO : '';
        return {
          featureCode: feat,
          action: act,
          permissionCode: act ? `${feat}:${act}` : upper,
          moduleName: defaultMod,
          active: true,
          allowed: true,
        };
      }
      if (typeof p !== 'object') return null;
      let feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
      let act = String(p.action || '').trim().toUpperCase();
      if (act === 'VIEW') act = 'READ';
      const permCode = String(p.permissionCode || (act ? `${feat}:${act}` : feat)).trim().toUpperCase();
      if (!feat && permCode.includes(':')) {
        const parts = permCode.split(':');
        feat = parts[0] || '';
        if (!act) act = parts[1] || '';
        if (act === 'VIEW') act = 'READ';
      }
      const explicitMod = normalizeModuleName(p.moduleName);
      const resolvedMod = explicitMod || (SSO_FEATURE_CODES.includes(feat) ? CANONICAL_MODULES.SSO : '');
      const isActive = p.active !== false && String(p.status || '').toUpperCase() !== 'INACTIVE' && p.status !== false;
      return {
        ...p,
        featureCode: feat,
        action: act,
        permissionCode: permCode,
        moduleName: resolvedMod,
        active: isActive,
        allowed: p.allowed !== false,
      };
    })
    .filter(Boolean);
}

export function buildAuthContext(payload) {
  const data = payload?.data || payload || {};
  const userCtx = data.user || data;
  const rawRole = data.roles || data.role || userCtx?.role || userCtx?.roles;
  const role = normalizeRole(rawRole);

  return {
    user: {
      ...userCtx,
      id: userCtx?.id || data.id,
      username: userCtx?.username || data.username,
      email: userCtx?.email || data.email,
      fullName: userCtx?.fullName || data.fullName,
      empId: userCtx?.empId || data.empId,
      role,
      accountStatus: userCtx?.accountStatus || data.accountStatus,
      companyCode: data.currentCompany?.code || data.companyCode,
      companyId: data.currentCompany?.id || data.companyId,
      companyName: data.currentCompany?.name || data.companyName,
      organizationCode: data.organization?.code || data.organizationCode,
      organizationId: data.organization?.id || data.organizationId,
      accessMode: data.accessMode || 'FULL',
    },
    organization: data.organization || null,
    currentCompany: data.currentCompany || null,
    companies: Array.isArray(data.companies) ? data.companies : [],
    membership: data.membership || null,
    subscription: data.subscription || null,
    accessMode: data.accessMode || 'FULL',
    modules: normalizeModulesList(data.modules || []),
    features: normalizeFeaturesList(data.features || []),
    permissions: normalizePermissionsList(data.permissions || []),
  };
}

export function isSystemAdminUser(authContextOrUser) {
  if (!authContextOrUser) return false;
  const user = authContextOrUser?.user || authContextOrUser;
  const roleStr = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const cleanRole = String(roleStr).trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (cleanRole === 'SYSTEMADMIN' || cleanRole === 'ROLESYSTEMADMIN' || cleanRole === 'SUPERADMIN' || cleanRole === 'ROLESUPERADMIN') {
    return true;
  }
  const rolesList = authContextOrUser?.roles || user?.roles;
  if (Array.isArray(rolesList)) {
    for (const r of rolesList) {
      const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
      const clean = String(name).trim().toUpperCase().replace(/[\s_-]+/g, '');
      if (clean === 'SYSTEMADMIN' || clean === 'ROLESYSTEMADMIN' || clean === 'SUPERADMIN' || clean === 'ROLESUPERADMIN') {
        return true;
      }
    }
  }
  if (Array.isArray(user?.authorities)) {
    for (const a of user.authorities) {
      const authStr = typeof a === 'string' ? a : a?.authority;
      const clean = String(authStr).trim().toUpperCase().replace(/[\s_-]+/g, '');
      if (clean === 'SYSTEMADMIN' || clean === 'ROLESYSTEMADMIN' || clean === 'SUPERADMIN' || clean === 'ROLESUPERADMIN') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns list of unique active canonical modules entitled to the user.
 * @param {object|Array} authContextOrModules
 * @returns {string[]} e.g. ['ACCOUNT', 'INVENTORY', 'CRM']
 */
export function getEntitledModules(authContextOrModules) {
  if (!authContextOrModules) return [];

  // Super admin preserves platform-wide canonical modules
  if (isSystemAdminUser(authContextOrModules)) {
    return Object.values(CANONICAL_MODULES);
  }

  const rawModules = Array.isArray(authContextOrModules)
    ? authContextOrModules
    : (authContextOrModules.modules || []);

  const entitled = new Set();

  for (const m of rawModules) {
    if (typeof m === 'string') {
      const canonical = normalizeModuleName(m);
      if (canonical) entitled.add(canonical);
    } else if (m && typeof m === 'object') {
      if (m.active !== false) {
        const canonical = normalizeModuleName(m.canonical || m.code || m.name || m.moduleName);
        if (canonical) entitled.add(canonical);
      }
    }
  }

  // Check if any ALL or ALL_MODULES permission is present
  const permissions = authContextOrModules?.permissions || [];
  for (const p of permissions) {
    const code = typeof p === 'string' ? p.toUpperCase() : (p.permissionCode || p.featureCode || '').toUpperCase();
    if (code === 'ALL' || code === 'ALL_MODULES') {
      if (entitled.size > 0) {
        return Array.from(entitled);
      }
      if (isSystemAdminUser(authContextOrModules)) {
        return Object.values(CANONICAL_MODULES);
      }
      return [];
    }
  }

  // If no entitled modules found from raw modules list, inspect permissions and user/membership roles
  if (entitled.size === 0) {
    for (const p of permissions) {
      const explicitMod = typeof p === 'object' ? (p.moduleName || p.module) : null;
      if (explicitMod) {
        const canonical = normalizeModuleName(explicitMod);
        if (canonical && canonical !== CANONICAL_MODULES.SSO && canonical !== CANONICAL_MODULES.CORE) {
          entitled.add(canonical);
        }
      }
    }

    const user = authContextOrModules?.user || authContextOrModules;
    const roleStr = String(user?.role || authContextOrModules?.role || authContextOrModules?.membership?.role || '').toUpperCase();
    if (roleStr.includes('ACCOUNTANT') || roleStr.includes('FINANCE')) {
      entitled.add(CANONICAL_MODULES.ACCOUNT);
    }
    if (roleStr.includes('INVENTORY') || roleStr.includes('WAREHOUSE')) {
      entitled.add(CANONICAL_MODULES.INVENTORY);
    }
    if (roleStr.includes('SALES') || roleStr.includes('CRM')) {
      entitled.add(CANONICAL_MODULES.CRM);
    }
  }

  return Array.from(entitled);
}

/**
 * Checks if the user is entitled to view a specific module.
 */
export function hasModule(authContext, moduleName) {
  if (!moduleName) return false;
  const canonical = normalizeModuleName(moduleName);
  if (!canonical) return false;

  const entitled = getEntitledModules(authContext);
  return entitled.includes(canonical) || entitled.includes('ALL_MODULES');
}

/**
 * Checks if the user has access to a feature.
 * If moduleName is provided, the feature must belong to that module AND user must have that module.
 */
export function hasFeature(authContext, featureName, moduleName) {
  if (!featureName) return false;
  if (isSystemAdminUser(authContext)) return true;
  if (moduleName && !hasModule(authContext, moduleName)) return false;

  const targetFeature = normalizeFeatureCode(String(featureName).trim().toUpperCase());
  const canonicalModule = moduleName ? normalizeModuleName(moduleName) : null;

  // 1. Check features list
  const features = authContext?.features || [];
  if (features.length > 0) {
    const matching = features.find((f) => {
      if (typeof f === 'string') {
        return normalizeFeatureCode(f.toUpperCase()) === targetFeature;
      }
      if (f && typeof f === 'object') {
        const code = normalizeFeatureCode(String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase());
        if (code !== targetFeature) return false;
        if (canonicalModule) {
          const mod = normalizeModuleName(f.moduleName);
          if (mod && mod !== canonicalModule) return false;
        }
        return f.active !== false;
      }
      return false;
    });

    if (matching) return true;
    return false;
  }

  // 2. Fallback: check permissions list for any allowed action on this feature
  const permissions = authContext?.permissions || [];
  return permissions.some((p) => {
    if (typeof p === 'string') {
      const parts = p.toUpperCase().split(':');
      const feat = normalizeFeatureCode(parts[0] || p.toUpperCase());
      return feat === targetFeature || p.toUpperCase() === 'ALL' || p.toUpperCase() === 'ALL_MODULES';
    }
    if (p && typeof p === 'object') {
      const feat = normalizeFeatureCode(String(p.featureCode || p.feature || '').trim().toUpperCase());
      const pCode = String(p.permissionCode || '').trim().toUpperCase();
      const pFeat = normalizeFeatureCode(pCode.includes(':') ? pCode.split(':')[0] : pCode);
      if (feat !== targetFeature && pFeat !== targetFeature) return false;
      if (canonicalModule) {
        const mod = normalizeModuleName(p.moduleName);
        if (mod && mod !== canonicalModule) return false;
      }
      return p.allowed !== false && p.active !== false;
    }
    return false;
  });
}

/**
 * Checks if the user has permission on a feature & action.
 * e.g. hasPermission(authContext, 'CUSTOMERS', 'READ', 'ACCOUNT')
 * or hasPermission(featureCode, action) when bound to authContext
 */
export function hasPermission(authContextOrFeature, featureNameOrAction, actionOrModule, maybeModule) {
  let authContext, featureName, action, moduleName;
  if (typeof authContextOrFeature === 'string') {
    featureName = authContextOrFeature;
    action = featureNameOrAction;
    moduleName = actionOrModule;
    authContext = null;
  } else {
    authContext = authContextOrFeature;
    featureName = featureNameOrAction;
    action = actionOrModule;
    moduleName = maybeModule;
  }

  // Support "FEATURE:ACTION" combined syntax in featureName (e.g. "CUSTOMERS:READ")
  if (typeof featureName === 'string' && featureName.includes(':') && !action) {
    const parts = featureName.split(':');
    featureName = parts[0];
    action = parts[1];
  }

  if (!featureName) return false;
  if (isSystemAdminUser(authContext)) return true;

  // Enforce accessMode restrictions
  const accessMode = authContext?.accessMode || authContext?.user?.accessMode;
  if (accessMode === 'BLOCKED') return false;

  const targetFeature = normalizeFeatureCode(String(featureName).trim().toUpperCase());
  let targetAction = action ? String(action).trim().toUpperCase() : null;
  if (targetAction === 'VIEW') targetAction = 'READ';
  if (targetAction === 'EDIT') targetAction = 'UPDATE';
  if (targetAction === 'NEW') targetAction = 'CREATE';

  if (accessMode === 'READ_ONLY' && targetAction) {
    const mutationActions = ['CREATE', 'UPDATE', 'WRITE', 'DELETE', 'APPROVE', 'POST', 'CANCEL', 'REVERSE', 'CLOSE', 'AWARD'];
    if (mutationActions.includes(targetAction)) {
      return false;
    }
  }

  if (moduleName && !hasModule(authContext, moduleName)) return false;

  const canonicalModule = moduleName ? normalizeModuleName(moduleName) : null;
  const permissions = Array.isArray(authContext)
    ? authContext
    : authContext?.permissions || authContext?.user?.permissions || [];

  // Determine candidate actions that satisfy the requested targetAction
  let candidateActions = null;
  if (targetAction) {
    if (targetAction === 'READ') {
      candidateActions = ['READ', 'VIEW'];
    } else if (targetAction === 'CREATE') {
      candidateActions = ['CREATE', 'WRITE'];
    } else if (targetAction === 'UPDATE') {
      candidateActions = ['UPDATE', 'EDIT', 'WRITE'];
    } else if (targetAction === 'DELETE') {
      candidateActions = ['DELETE'];
    } else if (targetAction === 'APPROVE') {
      candidateActions = ['APPROVE'];
    } else if (targetAction === 'EXPORT') {
      candidateActions = ['EXPORT', 'READ', 'VIEW'];
    } else if (targetAction === 'WRITE') {
      candidateActions = ['WRITE', 'CREATE', 'UPDATE'];
    } else {
      candidateActions = [targetAction];
    }
  }

  // Check if targetFeature has explicit permissions defined in the permission set
  // Check if targetFeature has explicit permissions defined in the permission set
  const hasExplicitFeaturePerm = permissions.some((p) => {
    if (typeof p === 'string') {
      const upper = p.trim().toUpperCase();
      let pFeat = upper;
      if (upper.includes(':')) {
        pFeat = upper.split(':')[0];
      } else if (upper.includes('_')) {
        const lastUnderscore = upper.lastIndexOf('_');
        const suffix = upper.slice(lastUnderscore + 1);
        if (['READ', 'VIEW', 'CREATE', 'WRITE', 'UPDATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'].includes(suffix)) {
          pFeat = upper.slice(0, lastUnderscore);
        }
      }
      return normalizeFeatureCode(pFeat) === targetFeature;
    }
    if (p && typeof p === 'object') {
      const feat = normalizeFeatureCode(String(p.featureCode || p.feature || '').trim().toUpperCase());
      const permCode = String(p.permissionCode || '').trim().toUpperCase();
      const pFeat = normalizeFeatureCode(permCode.includes(':') ? permCode.split(':')[0] : feat);
      return feat === targetFeature || pFeat === targetFeature;
    }
    return false;
  });

  const isDistinctCatalogFeature = SSO_FEATURE_CODES.includes(targetFeature) ||
    targetFeature === 'WORKFLOW_TASKS' ||
    targetFeature === 'WORKFLOW_DEFINITIONS' ||
    targetFeature === 'APPROVAL_REQUESTS' ||
    targetFeature === 'APPROVALS';
  const allowPrefixFallback = !hasExplicitFeaturePerm && !isDistinctCatalogFeature && targetFeature.includes('_');

  return permissions.some((p) => {
    if (typeof p === 'string') {
      const upper = p.trim().toUpperCase();
      if (upper === 'ALL' || upper === 'ALL_MODULES') return true;

      let pFeat = upper;
      let pAct = '';
      if (upper.includes(':')) {
        const parts = upper.split(':');
        pFeat = parts[0];
        pAct = parts[1] || '';
      } else if (upper.includes('_')) {
        const lastUnderscore = upper.lastIndexOf('_');
        const suffix = upper.slice(lastUnderscore + 1);
        if (['READ', 'VIEW', 'CREATE', 'WRITE', 'UPDATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'].includes(suffix)) {
          pFeat = upper.slice(0, lastUnderscore);
          pAct = suffix;
        }
      }

      pFeat = normalizeFeatureCode(pFeat);
      let normalizedPAct = pAct;
      if (normalizedPAct === 'VIEW') normalizedPAct = 'READ';
      if (normalizedPAct === 'EDIT') normalizedPAct = 'UPDATE';
      if (normalizedPAct === 'NEW') normalizedPAct = 'CREATE';

      if (targetAction) {
        if (pFeat === targetFeature) {
          if (candidateActions.includes(normalizedPAct)) return true;
          if (upper === `${targetFeature}:${targetAction}`) return true;
          if (upper === `${targetAction}_${targetFeature}`) return true;
          if (targetAction === 'READ' && (upper === `${targetFeature}_VIEW` || upper === `VIEW_${targetFeature}`)) return true;
          if (targetAction === 'APPROVE' && (upper === `${targetFeature}_APPROVE` || upper === `APPROVE_${targetFeature}`)) return true;
        }

        if (allowPrefixFallback) {
          const parentPrefix = targetFeature.split('_')[0];
          if (pFeat === parentPrefix && candidateActions.includes(normalizedPAct)) {
            return true;
          }
        }

        return false;
      }

      return pFeat === targetFeature || upper === targetFeature || upper.startsWith(`${targetFeature}:`);
    }

    if (p && typeof p === 'object') {
      // Must be allowed and active
      if (p.allowed === false || p.active === false || String(p.status || '').toUpperCase() === 'INACTIVE' || p.status === false) return false;

      const permCode = String(p.permissionCode || '').trim().toUpperCase();
      const feat = normalizeFeatureCode(String(p.featureCode || p.feature || '').trim().toUpperCase());
      if (permCode === 'ALL' || permCode === 'ALL_MODULES' || feat === 'ALL' || feat === 'ALL_MODULES') {
        return true;
      }

      // Module match if module specified
      if (canonicalModule) {
        const mod = normalizeModuleName(p.moduleName);
        if (mod && mod !== canonicalModule) return false;
      }

      let act = String(p.action || '').trim().toUpperCase();
      if (!act && permCode.includes(':')) {
        act = permCode.split(':')[1].toUpperCase();
      }
      if (act === 'VIEW') act = 'READ';
      if (act === 'EDIT') act = 'UPDATE';

      const pFeat = feat || normalizeFeatureCode(permCode.includes(':') ? permCode.split(':')[0] : permCode);

      if (targetAction) {
        const isActionMatch = candidateActions.includes(act) ||
          candidateActions.some(ca => permCode === `${targetFeature}:${ca}` || permCode === `${ca}_${targetFeature}`);

        if (pFeat === targetFeature) {
          return isActionMatch;
        }

        if (allowPrefixFallback) {
          const parentPrefix = targetFeature.split('_')[0];
          if (pFeat === parentPrefix && isActionMatch) {
            return true;
          }
        }

        return false;
      }

      return pFeat === targetFeature || permCode === targetFeature || permCode.startsWith(`${targetFeature}:`);
    }

    return false;
  });
}

/**
 * Convenience action checkers
 */
export function canRead(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'READ', moduleName);
}

export function canCreate(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'CREATE', moduleName);
}

export function canUpdate(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'UPDATE', moduleName);
}

export function canWrite(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'WRITE', moduleName) ||
    hasPermission(authContext, featureName, 'CREATE', moduleName) ||
    hasPermission(authContext, featureName, 'UPDATE', moduleName);
}

export function canDelete(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'DELETE', moduleName);
}

export function canApprove(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'APPROVE', moduleName);
}

/**
 * Evaluates whether a route/module/feature requirement is satisfied.
 * Used by ProtectedRoute and layout navigation.
 */
export function canViewModule(authContext, moduleOrFeature) {
  if (!moduleOrFeature) return false;
  if (isSystemAdminUser(authContext)) return true;

  const str = String(moduleOrFeature).trim();
  const lower = str.toLowerCase();
  const upper = str.toUpperCase();
  const normUpper = normalizeFeatureCode(upper);

  const TOP_LEVEL_MODULE_ALIASES = {
    account: CANONICAL_MODULES.ACCOUNT,
    accounts: CANONICAL_MODULES.ACCOUNT,
    finance: CANONICAL_MODULES.ACCOUNT,
    accounting: CANONICAL_MODULES.ACCOUNT,
    inventory: CANONICAL_MODULES.INVENTORY,
    inv: CANONICAL_MODULES.INVENTORY,
    crm: CANONICAL_MODULES.CRM,
    sales: CANONICAL_MODULES.CRM,
    'sales-crm': CANONICAL_MODULES.CRM,
    'sales_crm': CANONICAL_MODULES.CRM,
    salescrm: CANONICAL_MODULES.CRM,
    workflow: CANONICAL_MODULES.WORKFLOW,
    workflows: CANONICAL_MODULES.WORKFLOW,
    wf: CANONICAL_MODULES.WORKFLOW,
    hr: CANONICAL_MODULES.HR,
    manufacturing: CANONICAL_MODULES.MANUFACTURING,
    mfg: CANONICAL_MODULES.MANUFACTURING,
    purchases: CANONICAL_MODULES.PURCHASES,
    purchase: CANONICAL_MODULES.PURCHASES,
    procurement: CANONICAL_MODULES.PURCHASES,
    core: CANONICAL_MODULES.CORE,
    sso: CANONICAL_MODULES.SSO,
    auth: CANONICAL_MODULES.SSO,
    admin: CANONICAL_MODULES.SSO,
  };

  const entitled = getEntitledModules(authContext);
  const isTopModule = Boolean(TOP_LEVEL_MODULE_ALIASES[lower] || Object.values(CANONICAL_MODULES).includes(upper));

  // 1. Target is a top-level module (e.g. 'ACCOUNT', 'INVENTORY', 'CRM', 'SSO')
  if (isTopModule) {
    const canonical = TOP_LEVEL_MODULE_ALIASES[lower] || upper;
    if (entitled.includes(canonical)) {
      return true;
    }
    // Fallback: If SSO module, check if user has active SSO feature permissions
    if (canonical === CANONICAL_MODULES.SSO) {
      const permissions = authContext?.permissions || [];
      const SSO_ADMIN_FEATS = ['USER', 'ROLE', 'PERMISSION', 'FEATURE', 'MODULE', 'MODULE_ROUTE', 'PORTAL_ACCESS', 'SESSION', 'ORGANIZATION', 'COMPANY', 'SUBSCRIPTION', 'PLATFORM_ADMIN'];
      return SSO_ADMIN_FEATS.some((featCode) =>
        permissions.some((p) => {
          if (typeof p === 'string') {
            return p.toUpperCase() === featCode || p.toUpperCase().startsWith(`${featCode}:`);
          }
          const fc = normalizeFeatureCode(String(p.featureCode || p.feature || '').toUpperCase());
          return fc === featCode && p.allowed !== false && p.active !== false;
        })
      );
    }
    return false;
  }

  // 2. Target is a feature (e.g. 'CUSTOMERS', 'PRODUCTS', 'ACCOUNT_GROUPS', etc.)
  if (upper === 'DASHBOARD' || upper.endsWith('_DASHBOARD') || normUpper === 'DASHBOARD') {
    return entitled.length > 0;
  }

  const features = authContext?.features || [];

  // If features list is provided in session, feature must exist and be active
  if (features.length > 0) {
    const matchingFeat = features.find((f) => {
      if (typeof f === 'string') return normalizeFeatureCode(f.toUpperCase()) === normUpper || f.toUpperCase() === upper;
      const code = normalizeFeatureCode(String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase());
      const rawCode = String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase();
      return (code === normUpper || rawCode === upper) && f.active !== false;
    });

    if (matchingFeat) {
      const parentMod = typeof matchingFeat === 'object' ? normalizeModuleName(matchingFeat.moduleName) : null;
      if (parentMod && !entitled.includes(parentMod)) {
        return false;
      }
    } else {
      // Feature not in features list — check if permission explicitly authorizes it
      const hasExplicit = hasPermission(authContext, normUpper, 'READ') || hasPermission(authContext, upper, 'READ');
      if (!hasExplicit) return false;
    }
  }

  // 3. User MUST have active READ permission (or wildcard ALL/ALL_MODULES)
  let allowed = hasPermission(authContext, normUpper, 'READ') || hasPermission(authContext, upper, 'READ');
  if (!allowed && (normUpper === 'QUOTATIONS' || upper === 'QUOTATIONS')) {
    allowed = hasPermission(authContext, 'SALES_INVOICES', 'READ') || hasPermission(authContext, 'SALES', 'READ');
  }
  if (!allowed && (normUpper === 'PURCHASE_REQUISITIONS' || upper === 'PURCHASE_REQUISITIONS')) {
    allowed = hasPermission(authContext, 'PURCHASE_INVOICES', 'READ') || hasPermission(authContext, 'PURCHASE', 'READ');
  }
  if (!allowed && (normUpper === 'PURCHASE_INVOICES' || upper === 'PURCHASE_INVOICES')) {
    allowed = hasPermission(authContext, 'PURCHASE_REQUISITIONS', 'READ') || hasPermission(authContext, 'PURCHASE', 'READ');
  }
  if (!allowed && (normUpper === 'EXPENSE_REQUESTS' || upper === 'EXPENSE_REQUESTS')) {
    allowed = hasPermission(authContext, 'EXPENSES', 'READ') || hasPermission(authContext, 'EXPENSE', 'READ');
  }
  if (!allowed && (normUpper === 'EXPENSES' || upper === 'EXPENSES')) {
    allowed = hasPermission(authContext, 'EXPENSE_REQUESTS', 'READ') || hasPermission(authContext, 'EXPENSE', 'READ');
  }
    if (!allowed && (normUpper === 'WORKFLOW_DEFINITIONS' || upper === 'WORKFLOW_DEFINITIONS')) {
    allowed = hasPermission(authContext, 'WORKFLOW', 'READ') || hasPermission(authContext, 'WORKFLOW_APPROVALS', 'READ');
  }
  if (!allowed && (normUpper === 'WORKFLOW_TASKS' || upper === 'APPROVAL_REQUESTS' || upper === 'APPROVALS')) {
    allowed = hasPermission(authContext, 'APPROVAL_REQUESTS', 'READ') ||
      hasPermission(authContext, 'APPROVALS', 'READ') ||
      hasPermission(authContext, 'WORKFLOW_TASKS', 'APPROVE') ||
      hasPermission(authContext, 'WORKFLOW_APPROVE', 'APPROVE');
  }
  return allowed;
}
