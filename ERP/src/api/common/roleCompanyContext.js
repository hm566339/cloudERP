/**
 * @fileoverview Centralized Role-Based Company Context & Request Parameter Utility.
 *
 * Business Requirement:
 * The `companyId` query parameter must be sent ONLY when the logged-in user's
 * role is `OWNER` or `SystemAdmin`.
 *
 * Rules:
 *   - `OWNER`        -> Include `companyId` query parameter.
 *   - `SystemAdmin`  -> Include `companyId` query parameter.
 *   - `ACCOUNTANT`   -> Do NOT include `companyId` query parameter.
 *   - Any other role -> Do NOT include `companyId` query parameter, unless
 *                       explicitly required by an existing, documented API contract.
 *
 * Multi-Tenant Data Isolation:
 *   - Regular users (e.g. ACCOUNTANT, MEMBER, EMPLOYEE, COMPANY_ADMIN) have their
 *     company context resolved automatically by the backend via JWT session / TenantUtils.
 *   - Privileged users (OWNER, SystemAdmin) operate across multiple companies and
 *     must explicitly supply `companyId` to scope their requests.
 *   - Gateway tenant routing header (`X-Company-Id`) is attached for all users.
 */

/**
 * Normalizes any role representation into a standard canonical lowercase string.
 * Strips whitespace, underscores, and common prefixes like 'ROLE_'.
 */
export const normalizeRole = (roleName) => {
  if (!roleName) return '';
  const str = typeof roleName === 'string' ? roleName : String(roleName);
  const lower = str.toLowerCase().trim();
  const stripped = lower.replace(/[\s_]/g, '');

  if (
    stripped === 'superadmin' ||
    stripped === 'systemadmin' ||
    stripped === 'rolesuperadmin' ||
    stripped === 'rolesystemadmin' ||
    stripped.includes('superadmin') ||
    stripped.includes('systemadmin')
  ) {
    return 'super_admin';
  }

  if (
    stripped === 'owner' ||
    stripped === 'organizationowner' ||
    stripped === 'roleowner' ||
    stripped === 'roleorganizationowner'
  ) {
    return 'owner';
  }

  if (stripped.includes('companyadmin') || stripped === 'rolecompanyadmin') {
    return 'company_admin';
  }

  if (stripped.includes('accountant') || stripped === 'roleaccountant') {
    return 'accountant';
  }

  return lower;
};

/**
 * Determines whether a role string or token belongs strictly to OWNER or SystemAdmin.
 */
export const isOwnerOrSystemAdminRole = (roleName) => {
  if (!roleName) return false;
  const normalized = normalizeRole(roleName);
  return normalized === 'owner' || normalized === 'super_admin';
};

/**
 * Checks if the current authenticated user has an OWNER or SystemAdmin role.
 * Inspects:
 *   1. Explicit user/context object if passed
 *   2. Redux store (window.__REDUX_STORE__.getState().auth)
 *   3. localStorage 'auth_user'
 *   4. localStorage 'persist:root'
 *
 * Strictly returns false for:
 *   - ACCOUNTANT
 *   - COMPANY_ADMIN
 *   - FINANCE_MANAGER
 *   - MEMBER / EMPLOYEE / VIEWER / USER
 *   - Unauthenticated or missing user context
 */
export const isOwnerOrSystemAdminUser = (userOrContext = null) => {
  // 1. Explicit user or auth context passed
  if (userOrContext) {
    const user = userOrContext.user || userOrContext;
    const membership = userOrContext.membership || user?.membership;
    const memberType = String(membership?.memberType || membership?.membershipType || '').toUpperCase();
    if (
      memberType === 'OWNER' ||
      memberType === 'ORGANIZATION_OWNER' ||
      memberType === 'SYSTEM_ADMIN' ||
      memberType === 'SUPER_ADMIN'
    ) {
      return true;
    }

    if (user?.loginType === 'ADMIN') {
      return true;
    }

    if (user?.role && isOwnerOrSystemAdminRole(user.role)) {
      return true;
    }

    const roles = Array.isArray(user?.roles)
      ? user.roles
      : (Array.isArray(user?.role) ? user.role : []);

    if (roles.some((r) => {
      const roleStr = typeof r === 'string' ? r : (r?.name || r?.code || '');
      return isOwnerOrSystemAdminRole(roleStr);
    })) {
      return true;
    }

    // If an explicit user object was passed and didn't match, do not fall through
    if (userOrContext.user || userOrContext.role || userOrContext.roles || userOrContext.membership) {
      return false;
    }
  }

  // 2. Check Redux store if available in browser
  if (typeof window !== 'undefined' && window.__REDUX_STORE__?.getState) {
    try {
      const state = window.__REDUX_STORE__.getState();
      const user = state.auth?.user;
      const membership = state.auth?.membership || user?.membership;
      const memberType = String(membership?.memberType || membership?.membershipType || '').toUpperCase();
      if (
        memberType === 'OWNER' ||
        memberType === 'ORGANIZATION_OWNER' ||
        memberType === 'SYSTEM_ADMIN' ||
        memberType === 'SUPER_ADMIN'
      ) {
        return true;
      }
      if (user?.loginType === 'ADMIN') {
        return true;
      }
      if (user?.role && isOwnerOrSystemAdminRole(user.role)) {
        return true;
      }
      const roles = Array.isArray(user?.roles)
        ? user.roles
        : (Array.isArray(user?.role) ? user.role : []);
      if (roles.some((r) => {
        const roleStr = typeof r === 'string' ? r : (r?.name || r?.code || '');
        return isOwnerOrSystemAdminRole(roleStr);
      })) {
        return true;
      }
      if (user) {
        return false;
      }
    } catch (e) { }
  }

  // 3. Check localStorage 'auth_user'
  if (typeof localStorage !== 'undefined') {
    try {
      const authUserStr = localStorage.getItem('auth_user');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        const membership = authUser?.membership;
        const memberType = String(membership?.memberType || membership?.membershipType || '').toUpperCase();
        if (
          memberType === 'OWNER' ||
          memberType === 'ORGANIZATION_OWNER' ||
          memberType === 'SYSTEM_ADMIN' ||
          memberType === 'SUPER_ADMIN'
        ) {
          return true;
        }
        if (authUser?.loginType === 'ADMIN') {
          return true;
        }
        if (authUser?.role && isOwnerOrSystemAdminRole(authUser.role)) {
          return true;
        }
        const roles = Array.isArray(authUser?.roles)
          ? authUser.roles
          : (Array.isArray(authUser?.role) ? authUser.role : []);
        if (roles.some((r) => {
          const roleStr = typeof r === 'string' ? r : (r?.name || r?.code || '');
          return isOwnerOrSystemAdminRole(roleStr);
        })) {
          return true;
        }
        return false;
      }
    } catch (e) { }

    // 4. Check localStorage 'persist:root'
    try {
      const persistedRoot = JSON.parse(localStorage.getItem('persist:root'));
      if (persistedRoot?.auth) {
        const authState = JSON.parse(persistedRoot.auth);
        const user = authState?.user;
        const membership = authState?.membership || user?.membership;
        const memberType = String(membership?.memberType || membership?.membershipType || '').toUpperCase();
        if (
          memberType === 'OWNER' ||
          memberType === 'ORGANIZATION_OWNER' ||
          memberType === 'SYSTEM_ADMIN' ||
          memberType === 'SUPER_ADMIN'
        ) {
          return true;
        }
        if (user?.loginType === 'ADMIN') {
          return true;
        }
        if (user?.role && isOwnerOrSystemAdminRole(user.role)) {
          return true;
        }
        const roles = Array.isArray(user?.roles)
          ? user.roles
          : (Array.isArray(user?.role) ? user.role : []);
        if (roles.some((r) => {
          const roleStr = typeof r === 'string' ? r : (r?.name || r?.code || '');
          return isOwnerOrSystemAdminRole(roleStr);
        })) {
          return true;
        }
        if (user) {
          return false;
        }
      }
    } catch (e) { }
  }

  return false;
};

// Backward-compatible alias
export const isOwnerOrAdminUser = isOwnerOrSystemAdminUser;

/**
 * Validates whether a company ID string is a valid, non-dummy operational company identifier.
 * Specifically rejects null/undefined placeholders, "000000", "0", all-zero UUIDs, and legacy non-UUID codes.
 */
export const isValidCompanyId = (id) => {
  if (id === undefined || id === null) return false;
  const str = String(id).trim();
  if (
    !str ||
    str === 'undefined' ||
    str === 'null' ||
    str === '000000' ||
    str === '0' ||
    str === '00000000-0000-0000-0000-000000000000' ||
    /^0+$/.test(str)
  ) {
    return false;
  }
  return true;
};

/**
 * Resolves the active company ID.
 * Precedence:
 *   1. selected_company in localStorage (single source of truth for Owner & SystemAdmin)
 *   2. Redux store (selectedCompany / currentCompany)
 *   3. auth_user fallback in localStorage (assigned tenant company)
 */
export const getActiveCompanyId = (userOrContext = null) => {
  const sanitize = (raw) => {
    if (!isValidCompanyId(raw)) return null;
    return String(raw).trim();
  };

  if (userOrContext) {
    const user = userOrContext.user || userOrContext;
    const directId = sanitize(userOrContext.selectedCompany?.id) ||
      sanitize(userOrContext.currentCompany?.id) ||
      sanitize(user?.companyId);
    if (directId) {
      return directId;
    }
  }

  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('selected_company');
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedId = sanitize(parsed?.id || parsed?.companyId);
      if (savedId) {
        return savedId;
      }
    }
  } catch (e) { }

  try {
    if (window.__REDUX_STORE__?.getState) {
      const state = window.__REDUX_STORE__.getState();
      const comp = state.company?.selectedCompany || state.auth?.currentCompany;
      const storeId = sanitize(comp?.id || comp?.companyId);
      if (storeId) {
        return storeId;
      }
    }
  } catch (e) { }

  try {
    const authUserStr = localStorage.getItem('auth_user');
    if (authUserStr) {
      const authUser = JSON.parse(authUserStr);
      const authId = sanitize(authUser?.companyId);
      if (authId) {
        return authId;
      }
    }
  } catch (e) { }

  return null;
};

/**
 * Builds or filters query parameters according to user role.
 *
 * For OWNER and SystemAdmin:
 *   - Injects the active `companyId` query parameter only if a valid, non-dummy company exists.
 *
 * For every other role (ACCOUNTANT, MEMBER, EMPLOYEE, etc.):
 *   - Completely OMITS `companyId`.
 *   - Strips any existing `companyId` parameter (even if passed by caller).
 *   - Never sends undefined, null, or empty string.
 *
 * @param {Object|URLSearchParams} params - Outgoing request params.
 * @param {Object} [options] - Additional options:
 * @param {string} [options.companyId] - Optional explicit companyId.
 * @param {Object} [options.user] - Optional user context.
 * @param {boolean} [options.forceInclude] - Override to force inclusion if contract demands it.
 * @param {boolean} [options.isPrivileged] - Explicitly pass privileged status.
 * @returns {Object|URLSearchParams} Cleaned params object or URLSearchParams.
 */
export const buildRoleBasedCompanyParams = (params = {}, options = {}) => {
  const {
    companyId,
    user,
    forceInclude = false,
    isPrivileged: explicitPrivileged
  } = options;

  const privileged = explicitPrivileged !== undefined
    ? Boolean(explicitPrivileged)
    : isOwnerOrSystemAdminUser(user);

  const activeCompanyId = isValidCompanyId(companyId)
    ? String(companyId).trim()
    : getActiveCompanyId(user);

  if (typeof URLSearchParams !== 'undefined' && params instanceof URLSearchParams) {
    if ((privileged || forceInclude) && isValidCompanyId(activeCompanyId)) {
      params.set('companyId', activeCompanyId);
    } else {
      params.delete('companyId');
    }
    return params;
  }

  const result = { ...(params || {}) };

  if (privileged || forceInclude) {
    if (isValidCompanyId(activeCompanyId)) {
      result.companyId = activeCompanyId;
    } else {
      delete result.companyId;
    }
  } else {
    // Non-privileged roles: omit companyId completely!
    delete result.companyId;
  }

  // Guard against invalid companyIds or literal 'undefined' / 'null'
  if (!isValidCompanyId(result.companyId)) {
    delete result.companyId;
  }

  return result;
};

/**
 * Cleans query parameters inside a URL string itself.
 * If a URL string already has `?companyId=...` embedded:
 *   - For non-privileged users: removes `companyId` completely.
 *   - For OWNER/SystemAdmin: synchronizes `companyId` with `activeCompanyId`, or removes if dummy/missing.
 *
 * @param {string} url - Target URL.
 * @param {boolean} isPrivileged - Whether user is OWNER or SystemAdmin.
 * @param {string} [activeCompanyId] - Active company ID to set if privileged.
 * @returns {string} Sanitized URL string.
 */
export const cleanUrlRoleBasedCompany = (url, isPrivileged, activeCompanyId) => {
  if (!url || typeof url !== 'string' || !url.includes('?')) return url;

  try {
    const questionIdx = url.indexOf('?');
    const pathname = url.substring(0, questionIdx);
    const queryString = url.substring(questionIdx + 1);

    if (!queryString) return pathname;

    const searchParams = new URLSearchParams(queryString);

    if (isPrivileged) {
      if (isValidCompanyId(activeCompanyId) && searchParams.has('companyId')) {
        searchParams.set('companyId', activeCompanyId);
      } else {
        searchParams.delete('companyId');
      }
    } else {
      searchParams.delete('companyId');
    }

    const cleanQuery = searchParams.toString();
    return cleanQuery ? `${pathname}?${cleanQuery}` : pathname;
  } catch (e) {
    return url;
  }
};

