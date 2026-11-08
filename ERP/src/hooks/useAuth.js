import { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionStatus,
  selectAuthContext,
} from '../features/auth/authSlice';
import { selectSelectedCompany } from '../features/company-management/companySlice';
import { hasModuleAccess, hasPermission as checkRbacPermission } from '../utils/rbacUtils';
import { normalizeModuleName, getEntitledModules } from '../utils/moduleNormalization';
import { dispatchLogout } from '../api/common/logout';
import { isSystemAdmin, isOrganizationOwner, canManagePlans } from '../utils/subscriptionPermissions';

/**
 * Normalizes role string for resilient comparisons
 */
const normalizeRole = (r) => String(r || '').toLowerCase().replace(/[\s_]/g, '');

/**
 * Centralized authentication and authorization hook.
 * Single source of truth for user identity, role, and permissions.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const authContext = useAppSelector(selectAuthContext);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  const rawRole = user?.role || authContext?.user?.role || 'viewer';
  const role = typeof rawRole === 'object' ? (rawRole.name || 'viewer') : String(rawRole);
  const memberType = authContext?.membership?.memberType || user?.membership?.memberType || null;
  const isOwner = isOrganizationOwner(authContext) || memberType === 'OWNER' || normalizeRole(role) === 'owner';
  const isSuperAdmin = isSystemAdmin(authContext) || normalizeRole(role) === 'superadmin' || normalizeRole(role) === 'systemadmin';

  const permissions = useMemo(() => {
    return authContext?.permissions || user?.permissions || [];
  }, [authContext?.permissions, user?.permissions]);

  const entitledModules = useMemo(() => {
    return getEntitledModules(authContext);
  }, [authContext]);

  /**
   * Check if user matches any of the provided roles
   * @param {...string} roles - Role names to test
   * @returns {boolean}
   */
  const hasRole = useCallback((...roles) => {
    if (!roles || roles.length === 0) return true;
    if (isSuperAdmin) return true;

    const currentNormalized = normalizeRole(role);
    const targetRoles = roles.flat().map(normalizeRole);

    if (isOwner && (targetRoles.includes('owner') || targetRoles.includes('companyadmin'))) {
      return true;
    }

    return targetRoles.includes(currentNormalized);
  }, [role, isSuperAdmin, isOwner]);

  const effectiveAccessMode = authContext?.accessMode || user?.accessMode || 'FULL';
  const isReadOnly = effectiveAccessMode === 'READ_ONLY';
  const isBlocked = effectiveAccessMode === 'BLOCKED';

  /**
   * Check if user has specific permission/action
   * @param {string} permission - Module or permission code (e.g. "CUSTOMERS" or "CUSTOMERS:CREATE")
   * @param {string} [action] - Action (CREATE, READ, UPDATE, DELETE, APPROVE, EXPORT, PRINT)
   * @returns {boolean}
   */
  const can = useCallback((permission, action = null) => {
    if (isBlocked) return false;
    if (!permission) return true;

    let targetPerm = permission;
    let targetAction = action;

    // Handle "MODULE:ACTION" combined syntax
    if (typeof permission === 'string' && permission.includes(':') && !targetAction) {
      const parts = permission.split(':');
      targetPerm = parts[0];
      targetAction = parts[1];
    }

    // In READ_ONLY mode, all business mutations are strictly forbidden
    if (isReadOnly && targetAction) {
      const mutationActions = ['CREATE', 'UPDATE', 'WRITE', 'DELETE', 'POST', 'APPROVE', 'CANCEL', 'REVERSE', 'CLOSE', 'AWARD'];
      if (mutationActions.includes(targetAction.toUpperCase())) {
        return false;
      }
    }

    // Subscription plan management is strictly reserved for SYSTEM_ADMIN (or explicit SUBSCRIPTION_PLAN permission)
    if (String(targetPerm).toUpperCase() === 'SUBSCRIPTION_PLAN' && targetAction) {
      const planMutations = ['CREATE', 'UPDATE', 'WRITE', 'DELETE'];
      if (planMutations.includes(targetAction.toUpperCase())) {
        return canManagePlans(authContext);
      }
    }

    if (isSuperAdmin || isOwner) return true;

    // Check against authContext / Redux permissions state
    if (targetAction) {
      return checkRbacPermission({ auth: { ...authContext, user } }, targetPerm, targetAction);
    }
    return hasModuleAccess({ auth: { ...authContext, user } }, targetPerm);
  }, [isBlocked, isReadOnly, isSuperAdmin, isOwner, authContext, user]);

  /**
   * Check if user can access a specific module
   * @param {string} moduleName
   * @returns {boolean}
   */
  const canAccessModule = useCallback((moduleName) => {
    if (isBlocked) return false;
    if (isSuperAdmin || isOwner) return true;
    const normalized = normalizeModuleName(moduleName);
    return entitledModules.includes(normalized) || hasModuleAccess({ auth: { ...authContext, user } }, moduleName);
  }, [isBlocked, isSuperAdmin, isOwner, entitledModules, authContext, user]);

  /**
   * Trigger clean logout
   */
  const logout = useCallback((options) => {
    dispatchLogout(options);
  }, []);

  return {
    user,
    role,
    memberType,
    isOwner,
    isSuperAdmin,
    isAuthenticated,
    isLoading: sessionStatus === 'idle' || sessionStatus === 'checking',
    sessionStatus,
    organization: authContext?.organization || null,
    activeOrganizationId: authContext?.activeOrganizationId || authContext?.organization?.id || null,
    activeCompanyId: authContext?.activeCompanyId || authContext?.currentCompany?.id || selectedCompany?.id || null,
    currentCompany: authContext?.currentCompany || selectedCompany || null,
    companies: authContext?.companies || [],
    subscription: authContext?.subscription || null,
    accessMode: effectiveAccessMode,
    isReadOnly,
    isBlocked,
    permissions,
    entitledModules,
    hasRole,
    can,
    canAccessModule,
    logout,
  };
}

export default useAuth;
