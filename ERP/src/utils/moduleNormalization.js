/**
 * Centralized Module Normalization & Authorization Helper
 * Canonical SSO /api/sso/auth/me authorization context processor.
 */

export const CANONICAL_MODULES = {
  ACCOUNT: 'ACCOUNT',
  INVENTORY: 'INVENTORY',
  WORKFLOW: 'WORKFLOW',
  CRM: 'CRM',
  CORE: 'CORE',
  HR: 'HR',
  MANUFACTURING: 'MANUFACTURING',
  PURCHASES: 'PURCHASES',
};

/**
 * Normalizes any module identifier (string or object) to its canonical module name.
 * e.g.:
 *   'accountDev', 'account', 'accounts', 'finance', 'accounting' -> 'ACCOUNT'
 *   'inventory', 'inv' -> 'INVENTORY'
 *   'crm', 'sales-crm', 'salescrm', 'sales' -> 'CRM'
 *   'core' -> 'CORE'
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
  if (lower.startsWith('workflow') || lower === 'wf') {
    return CANONICAL_MODULES.WORKFLOW;
  }
  if (lower === 'crm' || lower.includes('salescrm') || lower === 'sales') {
    return CANONICAL_MODULES.CRM;
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
  return rawModules.map((m) => {
    if (typeof m === 'string') {
      const canonical = normalizeModuleName(m);
      return { id: m, name: m, code: m.toLowerCase(), canonical, active: true };
    }
    const canonical = normalizeModuleName(m.canonical || m.name || m.code);
    return {
      ...m,
      canonical,
      active: m.active !== false,
    };
  });
}

export function normalizeFeaturesList(rawFeatures) {
  if (!Array.isArray(rawFeatures)) return [];
  return rawFeatures.map((f) => {
    if (typeof f === 'string') {
      return {
        featureCode: f.toUpperCase(),
        featureName: f,
        moduleName: '',
        active: true,
      };
    }
    return {
      ...f,
      featureCode: String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase(),
      featureName: f.featureName || f.featureCode,
      moduleName: normalizeModuleName(f.moduleName),
      active: f.active !== false,
    };
  });
}

export function normalizePermissionsList(rawPermissions) {
  if (!Array.isArray(rawPermissions)) return [];
  return rawPermissions.map((p) => {
    if (typeof p === 'string') {
      const upper = p.trim().toUpperCase();
      const parts = upper.split(':');
      return {
        featureCode: parts[0] || upper,
        action: parts[1] || '',
        permissionCode: upper,
        moduleName: '',
        active: true,
        allowed: true,
      };
    }
    const feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
    const act = String(p.action || '').trim().toUpperCase();
    const permCode = String(p.permissionCode || (act ? `${feat}:${act}` : feat)).trim().toUpperCase();
    return {
      ...p,
      featureCode: feat,
      action: act,
      permissionCode: permCode,
      moduleName: normalizeModuleName(p.moduleName),
      active: p.active !== false,
      allowed: p.allowed !== false,
    };
  });
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

/**
 * Returns list of unique active canonical modules entitled to the user.
 * @param {object|Array} authContextOrModules
 * @returns {string[]} e.g. ['ACCOUNT', 'INVENTORY', 'CRM']
 */
export function getEntitledModules(authContextOrModules) {
  if (!authContextOrModules) return [];

  // Super admin has all modules
  const user = authContextOrModules?.user;
  if (user?.role === 'super_admin') {
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
        const canonical = normalizeModuleName(m.canonical || m.name || m.code || m.moduleName);
        if (canonical) entitled.add(canonical);
      }
    }
  }

  // Check if any ALL or ALL_MODULES permission is present
  const permissions = authContextOrModules?.permissions || [];
  for (const p of permissions) {
    const code = typeof p === 'string' ? p.toUpperCase() : (p.permissionCode || p.featureCode || '').toUpperCase();
    if (code === 'ALL' || code === 'ALL_MODULES') {
      return Object.values(CANONICAL_MODULES);
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
  if (moduleName && !hasModule(authContext, moduleName)) return false;

  const user = authContext?.user;
  if (user?.role === 'super_admin') return true;

  const targetFeature = String(featureName).trim().toUpperCase();
  const canonicalModule = moduleName ? normalizeModuleName(moduleName) : null;

  // 1. Check features list
  const features = authContext?.features || [];
  const featureMatch = features.some((f) => {
    if (typeof f === 'string') {
      return f.toUpperCase() === targetFeature;
    }
    if (f && typeof f === 'object') {
      const code = String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase();
      if (code !== targetFeature) return false;
      if (canonicalModule) {
        const mod = normalizeModuleName(f.moduleName);
        if (mod && mod !== canonicalModule) return false;
      }
      return f.active !== false;
    }
    return false;
  });

  if (featureMatch) return true;

  // 2. Fallback: check permissions list for any allowed action on this feature
  const permissions = authContext?.permissions || [];
  return permissions.some((p) => {
    if (typeof p === 'string') {
      const parts = p.toUpperCase().split(':');
      return parts[0] === targetFeature || p.toUpperCase() === targetFeature || p.toUpperCase() === 'ALL';
    }
    if (p && typeof p === 'object') {
      const feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
      if (feat !== targetFeature) return false;
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
 */
export function hasPermission(authContext, featureName, action, moduleName) {
  if (!featureName) return false;
  if (moduleName && !hasModule(authContext, moduleName)) return false;

  const user = authContext?.user;
  if (user?.role === 'super_admin') return true;

  const targetFeature = String(featureName).trim().toUpperCase();
  const targetAction = action ? String(action).trim().toUpperCase() : null;
  const canonicalModule = moduleName ? normalizeModuleName(moduleName) : null;

  const permissions = authContext?.permissions || [];

  return permissions.some((p) => {
    if (typeof p === 'string') {
      const upper = p.trim().toUpperCase();
      if (upper === 'ALL' || upper === 'ALL_MODULES') return true;
      if (targetAction) {
        return upper === `${targetFeature}:${targetAction}` ||
               upper === `${targetAction}_${targetFeature}` ||
               upper === targetFeature;
      }
      return upper === targetFeature || upper.startsWith(`${targetFeature}:`);
    }

    if (p && typeof p === 'object') {
      // Must be allowed and active
      if (p.allowed === false || p.active === false) return false;

      // Module match if module specified
      if (canonicalModule) {
        const mod = normalizeModuleName(p.moduleName);
        if (mod && mod !== canonicalModule) return false;
      }

      const feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
      const act = String(p.action || '').trim().toUpperCase();
      const permCode = String(p.permissionCode || '').trim().toUpperCase();

      if (targetAction) {
        const isActionMatch = act === targetAction ||
                              permCode === `${targetFeature}:${targetAction}` ||
                              permCode === `${targetAction}_${targetFeature}`;
        const isFeatureMatch = feat === targetFeature || permCode.startsWith(`${targetFeature}:`);
        return isFeatureMatch && isActionMatch;
      }

      return feat === targetFeature || permCode === targetFeature || permCode.startsWith(`${targetFeature}:`);
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

export function canWrite(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'WRITE', moduleName) ||
         hasPermission(authContext, featureName, 'CREATE', moduleName) ||
         hasPermission(authContext, featureName, 'UPDATE', moduleName);
}

export function canDelete(authContext, featureName, moduleName) {
  return hasPermission(authContext, featureName, 'DELETE', moduleName);
}

/**
 * Evaluates whether a route/module/feature requirement is satisfied.
 * Used by ProtectedRoute and layout navigation.
 */
export function canViewModule(authContext, moduleOrFeature) {
  if (!moduleOrFeature) return false;

  const user = authContext?.user;
  if (user?.role === 'super_admin') return true;

  const str = String(moduleOrFeature).trim();
  const canonical = normalizeModuleName(str);

  // 1. Is it a canonical top-level module? (e.g. 'ACCOUNT', 'INVENTORY', 'CRM')
  const entitled = getEntitledModules(authContext);
  if (entitled.includes(canonical)) {
    return true;
  }

  // 2. Is it a feature/sub-module? (e.g. 'CUSTOMERS', 'BANK_ACCOUNTS', 'PRODUCTS', 'STOCK')
  const upper = str.toUpperCase();
  const features = authContext?.features || [];
  const permissions = authContext?.permissions || [];

  // Find if this feature exists in features/permissions and belongs to an entitled module
  const matchingPerm = permissions.find((p) => {
    if (typeof p === 'string') {
      const parts = p.toUpperCase().split(':');
      return (parts[0] === upper || p.toUpperCase() === upper) && p.toUpperCase() !== 'ALL';
    }
    const feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
    return feat === upper && p.allowed !== false && p.active !== false;
  });

  if (matchingPerm) {
    const parentMod = typeof matchingPerm === 'object' ? normalizeModuleName(matchingPerm.moduleName) : null;
    if (!parentMod || entitled.includes(parentMod)) {
      return true;
    }
  }

  const matchingFeat = features.find((f) => {
    if (typeof f === 'string') return f.toUpperCase() === upper;
    const code = String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase();
    return code === upper && f.active !== false;
  });

  if (matchingFeat) {
    const parentMod = typeof matchingFeat === 'object' ? normalizeModuleName(matchingFeat.moduleName) : null;
    if (!parentMod || entitled.includes(parentMod)) {
      return true;
    }
  }

  // 3. Fallback: aliases check for backward compatibility
  const moduleAliases = {
    accounts: ['ACCOUNT'],
    finance: ['ACCOUNT'],
    accounting: ['ACCOUNT'],
    inventory: ['INVENTORY'],
    crm: ['CRM'],
    sales: ['CRM'],
    banking: ['ACCOUNT'],
    expenses: ['ACCOUNT'],
  };
  const alias = moduleAliases[str.toLowerCase()];
  if (alias) {
    return alias.some((m) => entitled.includes(m));
  }

  return false;
}
