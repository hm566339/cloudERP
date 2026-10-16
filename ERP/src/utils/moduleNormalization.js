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
      const upper = f.toUpperCase();
      const defaultMod = SSO_FEATURE_CODES.includes(upper) ? CANONICAL_MODULES.SSO : '';
      return {
        featureCode: upper,
        featureName: f,
        moduleName: defaultMod,
        active: true,
      };
    }
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
  });
}

export function normalizeFeatureCode(input) {
  if (!input) return '';
  const clean = String(input).trim().toUpperCase().replace(/[-\s]/g, '_');
  if (clean === 'ROLES') return 'ROLE';
  if (clean === 'USERS') return 'USER';
  if (clean === 'PERMISSIONS') return 'PERMISSION';
  if (clean === 'FEATURES') return 'FEATURE';
  if (clean === 'MODULES') return 'MODULE';
  if (clean === 'SESSIONS') return 'SESSION';
  if (clean === 'PORTAL_ACCESS' || clean === 'PORTALACCESS') return 'PORTAL_ACCESS';
  return clean;
}

export function normalizePermissionsList(rawPermissions) {
  if (!Array.isArray(rawPermissions)) return [];
  return rawPermissions.map((p) => {
    if (typeof p === 'string') {
      const upper = p.trim().toUpperCase();
      const parts = upper.split(':');
      const feat = parts[0] || upper;
      const defaultMod = SSO_FEATURE_CODES.includes(feat) ? CANONICAL_MODULES.SSO : '';
      return {
        featureCode: feat,
        action: parts[1] || '',
        permissionCode: upper,
        moduleName: defaultMod,
        active: true,
        allowed: true,
      };
    }
    let feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
    let act = String(p.action || '').trim().toUpperCase();
    const permCode = String(p.permissionCode || (act ? `${feat}:${act}` : feat)).trim().toUpperCase();
    if (!feat && permCode.includes(':')) {
      const parts = permCode.split(':');
      feat = parts[0] || '';
      if (!act) act = parts[1] || '';
    }
    const explicitMod = normalizeModuleName(p.moduleName);
    const resolvedMod = explicitMod || (SSO_FEATURE_CODES.includes(feat) ? CANONICAL_MODULES.SSO : '');
    return {
      ...p,
      featureCode: feat,
      action: act,
      permissionCode: permCode,
      moduleName: resolvedMod,
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

function isOwnerOrSuperAdmin(authContextOrUser) {
  if (!authContextOrUser) return false;
  const user = authContextOrUser?.user || authContextOrUser;
  const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';
  const memberType = String(
    authContextOrUser?.membership?.memberType ||
    authContextOrUser?.membership?.membershipType ||
    user?.membership?.memberType ||
    user?.memberType ||
    ''
  ).toUpperCase();

  const isRoleOwner = role === 'owner' || role.includes('owner');
  const isRoleSuper = role === 'super_admin' || role.includes('superadmin') || role === 'system_admin';
  const isMemberOwner = memberType === 'OWNER';

  const hasRoleOwner = (Array.isArray(user?.roles) && user.roles.some((r) => {
    const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
    return String(name).toUpperCase() === 'OWNER' || String(name).toUpperCase() === 'ROLE_OWNER';
  })) || (Array.isArray(authContextOrUser?.roles) && authContextOrUser.roles.some((r) => {
    const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
    return String(name).toUpperCase() === 'OWNER' || String(name).toUpperCase() === 'ROLE_OWNER';
  }));

  return isRoleSuper || isRoleOwner || isMemberOwner || hasRoleOwner;
}

/**
 * Returns list of unique active canonical modules entitled to the user.
 * @param {object|Array} authContextOrModules
 * @returns {string[]} e.g. ['ACCOUNT', 'INVENTORY', 'CRM']
 */
export function getEntitledModules(authContextOrModules) {
  if (!authContextOrModules) return [];

  // Super admin and Owners have all canonical modules
  if (isOwnerOrSuperAdmin(authContextOrModules)) {
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
      if (entitled.size > 0) {
        return Array.from(entitled);
      }
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
  if (isOwnerOrSuperAdmin(authContext)) return true;
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
  if (isOwnerOrSuperAdmin(authContext)) return true;
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
  if (isOwnerOrSuperAdmin(authContext)) return true;

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
  const normUpper = normalizeFeatureCode(upper);
  const features = authContext?.features || [];
  const permissions = authContext?.permissions || [];

  // Find if this feature exists in features/permissions and belongs to an entitled module
  const matchingPerm = permissions.find((p) => {
    if (typeof p === 'string') {
      const parts = p.toUpperCase().split(':');
      const pFeat = parts[0] || p.toUpperCase();
      return (pFeat === upper || pFeat === normUpper || p.toUpperCase() === upper) && p.toUpperCase() !== 'ALL';
    }
    const feat = String(p.featureCode || p.feature || '').trim().toUpperCase();
    const pCode = String(p.permissionCode || '').trim().toUpperCase();
    const pFeat = pCode.includes(':') ? pCode.split(':')[0] : feat;
    return (feat === upper || feat === normUpper || pFeat === upper || pFeat === normUpper) && p.allowed !== false && p.active !== false;
  });

  if (matchingPerm) {
    const parentMod = typeof matchingPerm === 'object' ? normalizeModuleName(matchingPerm.moduleName) : null;
    if (!parentMod || parentMod === CANONICAL_MODULES.SSO || entitled.includes(parentMod)) {
      return true;
    }
  }

  const matchingFeat = features.find((f) => {
    if (typeof f === 'string') return f.toUpperCase() === upper || f.toUpperCase() === normUpper;
    const code = String(f.featureCode || f.featureName || f.code || '').trim().toUpperCase();
    return (code === upper || code === normUpper) && f.active !== false;
  });

  if (matchingFeat) {
    const parentMod = typeof matchingFeat === 'object' ? normalizeModuleName(matchingFeat.moduleName) : null;
    if (!parentMod || parentMod === CANONICAL_MODULES.SSO || entitled.includes(parentMod)) {
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
    workflow: ['WORKFLOW'],
    workflows: ['WORKFLOW'],
    banking: ['ACCOUNT'],
    expenses: ['ACCOUNT'],
    sso: ['SSO'],
    admin: ['SSO'],
    auth: ['SSO'],
    super_admin: ['SSO'],
  };
  const alias = moduleAliases[str.toLowerCase()];
  if (alias) {
    return alias.some((m) => entitled.includes(m));
  }

  // 4. If target is SSO and user is Owner or has any active SSO feature permissions
  if (canonical === CANONICAL_MODULES.SSO) {
    const isOwner =
      authContext?.membership?.memberType === 'OWNER' ||
      authContext?.user?.role === 'owner' ||
      authContext?.user?.membership?.memberType === 'OWNER';
    if (isOwner && authContext?.accessMode !== 'BLOCKED') {
      return true;
    }

    return SSO_FEATURE_CODES.some((featCode) =>
      permissions.some((p) => {
        if (typeof p === 'string') {
          return p.toUpperCase() === featCode || p.toUpperCase().startsWith(`${featCode}:`);
        }
        const fc = String(p.featureCode || p.feature || '').toUpperCase();
        return fc === featCode && p.allowed !== false && p.active !== false;
      })
    );
  }

  return false;
}
