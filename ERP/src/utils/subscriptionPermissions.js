/**
 * @fileoverview Centralized Subscription and Plan Authorization Helpers.
 * Built directly from backend /api/sso/auth/me response structure and SsoAuthorizationService rules.
 * Never relies on fragile ad-hoc role string comparisons.
 */

/**
 * Checks if a role name represents a System Administrator.
 * Backend authority: SsoAuthorizationService.isSystemAdmin checks "SYSTEM_ADMIN" / "ROLE_SYSTEM_ADMIN".
 * @param {string} roleName
 * @returns {boolean}
 */
function isSystemAdminRoleString(roleName) {
  if (!roleName) return false;
  const clean = String(roleName).trim().toUpperCase().replace(/[\s_-]+/g, '');
  return clean === 'SYSTEMADMIN' || clean === 'ROLESYSTEMADMIN' || clean === 'SUPERADMIN' || clean === 'ROLESUPERADMIN';
}

/**
 * Checks if the user is a system/super administrator with full platform catalog privileges.
 * @param {Object} authContext - Auth context object or root state
 * @returns {boolean}
 */
export function isSystemAdmin(authContext) {
  if (!authContext) return false;
  const ctx = authContext.auth || authContext;
  const user = ctx.user;

  // 1. Check user.role
  if (isSystemAdminRoleString(user?.role)) return true;

  // 2. Check ctx.roles array from /api/sso/auth/me
  const rolesList = ctx.roles || user?.roles;
  if (Array.isArray(rolesList)) {
    for (const r of rolesList) {
      const name = typeof r === 'string' ? r : r?.name;
      if (isSystemAdminRoleString(name)) return true;
    }
  }

  // 3. Check granted authorities (if present)
  if (Array.isArray(user?.authorities)) {
    for (const a of user.authorities) {
      const authStr = typeof a === 'string' ? a : a?.authority;
      if (isSystemAdminRoleString(authStr)) return true;
    }
  }

  return false;
}

/**
 * Checks if the authenticated user is an Organization OWNER.
 * Backend authority: SubscriptionBillingServiceImpl.assertOrganizationManagementAccess
 * @param {Object} authContext
 * @returns {boolean}
 */
export function isOrganizationOwner(authContext) {
  if (!authContext) return false;
  const ctx = authContext.auth || authContext;
  const membership = ctx.membership || ctx.user?.membership;
  const user = ctx.user;

  // Check memberType
  if (membership?.memberType === 'OWNER') return true;

  // Check roles array
  const rolesList = ctx.roles || user?.roles;
  if (Array.isArray(rolesList)) {
    for (const r of rolesList) {
      const name = String(typeof r === 'string' ? r : r?.name || '').trim().toUpperCase();
      if (name === 'OWNER' || name === 'ROLE_OWNER') return true;
    }
  }

  if (String(user?.role || '').trim().toUpperCase() === 'OWNER') return true;

  return false;
}

/**
 * Checks if the authenticated user is an Organization ADMIN.
 * @param {Object} authContext
 * @returns {boolean}
 */
export function isOrganizationAdmin(authContext) {
  if (!authContext) return false;
  const ctx = authContext.auth || authContext;
  const membership = ctx.membership || ctx.user?.membership;
  const user = ctx.user;

  if (membership?.memberType === 'ADMIN') return true;

  const rolesList = ctx.roles || user?.roles;
  if (Array.isArray(rolesList)) {
    for (const r of rolesList) {
      const name = String(typeof r === 'string' ? r : r?.name || '').trim().toUpperCase();
      if (name === 'ADMIN' || name === 'ROLE_ADMIN' || name === 'ORG_ADMIN' || name === 'ORGANIZATION_ADMIN') return true;
    }
  }

  return false;
}

/**
 * Checks if the user has a specific DB permission code from /api/sso/auth/me permissions.
 * @param {Object} authContext
 * @param {string} permissionCode
 * @returns {boolean}
 */
export function hasDbPermission(authContext, permissionCode) {
  if (!authContext || !permissionCode) return false;
  const ctx = authContext.auth || authContext;
  const permissions = ctx.permissions || ctx.user?.permissions;
  if (!Array.isArray(permissions)) return false;

  const targetCode = permissionCode.trim().toUpperCase();

  return permissions.some((p) => {
    if (typeof p === 'string') {
      return p.trim().toUpperCase() === targetCode;
    }
    const code = p?.permissionCode || p?.name;
    const isAllowed = p?.allowed !== false;
    const isActive = p?.active !== false;
    return Boolean(code && code.trim().toUpperCase() === targetCode && isAllowed && isActive);
  });
}

/**
 * Only SYSTEM_ADMIN (or users with explicit SUBSCRIPTION_PLAN:CREATE/WRITE DB permissions)
 * can create, edit, activate/deactivate, assign modules to, and delete plans.
 * Backend authority: SsoAuthorizationService & SubscriptionPlanServiceImpl.
 * @param {Object} authContext
 * @returns {boolean}
 */
export function canManagePlans(authContext) {
  if (isSystemAdmin(authContext)) return true;
  return hasDbPermission(authContext, 'SUBSCRIPTION_PLAN:CREATE') ||
         hasDbPermission(authContext, 'SUBSCRIPTION_PLAN:WRITE') ||
         hasDbPermission(authContext, 'SUBSCRIPTION_PLAN:DELETE');
}

/**
 * Determines whether the user can buy, checkout, upgrade, or cancel organization subscriptions.
 * Backend authority: SubscriptionBillingServiceImpl.assertOrganizationManagementAccess (OWNER or ADMIN).
 * @param {Object} authContext
 * @returns {boolean}
 */
export function canBuySubscription(authContext) {
  if (isSystemAdmin(authContext)) return true;
  if (isOrganizationOwner(authContext) || isOrganizationAdmin(authContext)) return true;
  return hasDbPermission(authContext, 'SUBSCRIPTION:CREATE') || hasDbPermission(authContext, 'SUBSCRIPTION:WRITE');
}

/**
 * Explanatory reason when buying/upgrading a subscription is disabled.
 * @param {Object} authContext
 * @returns {string|null}
 */
export function getBuyDisabledReason(authContext) {
  if (canBuySubscription(authContext)) return null;
  return 'Only Organization Owners or Administrators have permission to purchase or upgrade subscriptions.';
}

/**
 * Determines whether the user has permission to view the plans catalog.
 * Backend authority: SsoAuthorizationService & authorization.yml.
 * The backend guards /api/sso/subscription-plans/** with module SUBSCRIPTION_PLAN (action: READ).
 * Only SYSTEM_ADMIN, accounts with explicit SUBSCRIPTION_PLAN:READ permission, or
 * Organization Owners/Admins (who manage organization billing) should query this catalog.
 * Tenant roles without plan-reading privileges (Accountant, Staff, Member) return false.
 *
 * @param {Object} authContext
 * @returns {boolean}
 */
export function canViewPlans(authContext) {
  if (!authContext) return false;
  if (isSystemAdmin(authContext)) return true;
  if (hasDbPermission(authContext, 'SUBSCRIPTION_PLAN:READ')) return true;
  if (isOrganizationOwner(authContext) || isOrganizationAdmin(authContext)) return true;
  return false;
}

