import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectAuthContext, selectSessionStatus, selectIsAuthenticated } from '../features/auth/authSlice';
import { getEntitledModules } from '../utils/moduleNormalization';
import NoModuleAccessView from '../components/common/NoModuleAccessView';
import CommonWorkspaceView from '../features/dashboard/pages/CommonWorkspaceView';

/**
 * Dynamically resolves the landing destination for /workspace based on
 * the canonical SSO /api/sso/auth/me authorization context.
 *
 * Rules:
 * 1. Waiting/Loading: Return loading spinner.
 *    Protects against temporary empty membership on reload -> wrong module route.
 * 2. Unauthenticated: Redirect to /login
 * 3. Super Admin: /super-admin/dashboard
 * 4. Customer OWNER: /owner/dashboard
 * 5. Non-owner members:
 *    - 0 modules: NoModuleAccessView
 *    - 1 module: Navigate to that module's dashboard (e.g. ACCOUNT -> /accounts/dashboard)
 *    - 2+ modules: CommonWorkspaceView
 */
export default function WorkspaceLandingRedirect() {
  const authContext = useAppSelector(selectAuthContext);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const authenticated = useAppSelector(selectIsAuthenticated);

  // Protect against routing before /me has loaded on hard reload or initial navigation
  const isAuthLoading =
    sessionStatus === 'idle' ||
    sessionStatus === 'checking' ||
    (authenticated && !authContext?.organization && !authContext?.membership && !authContext?.user);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated
  if (sessionStatus === 'unauthenticated' && !authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Priority 0: Super Administrator detection
  const isSuperAdmin =
    authContext?.user?.role === 'super_admin' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => {
        const name = (typeof r === 'string' ? r : r?.name)?.toUpperCase();
        return name === 'SUPER_ADMIN' || name === 'SYSTEM_ADMIN';
      })) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => {
        const name = (typeof r === 'string' ? r : r?.name)?.toUpperCase();
        return name === 'SUPER_ADMIN' || name === 'SYSTEM_ADMIN';
      }));

  if (isSuperAdmin) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // Priority 1: Customer Organization Owner detection
  // OWNER is an organization-level membership role. Regardless of business module entitlements,
  // an authenticated OWNER always lands on the Organization Control Center (/owner/dashboard).
  const membershipType =
    authContext?.membership?.memberType ??
    authContext?.member?.memberType ??
    authContext?.user?.membership?.memberType ??
    (authContext?.user?.role === 'owner' ? 'OWNER' : null);

  if (membershipType?.toUpperCase() === 'OWNER') {
    return <Navigate to="/owner/dashboard" replace />;
  }

  // Priority 2: Non-owner customer members derive destination from entitled business modules
  const entitledModules = getEntitledModules(authContext);

  // 0 modules: NoModuleAccessView
  if (entitledModules.length === 0) {
    return <NoModuleAccessView />;
  }

  // Exactly 1 module: open that module dashboard
  if (entitledModules.length === 1) {
    const single = entitledModules[0];
    if (single === 'INVENTORY') {
      return <Navigate to="/inventory/dashboard" replace />;
    }
    if (single === 'CRM') {
      return <Navigate to="/crm/dashboard" replace />;
    }
    if (single === 'ACCOUNT') {
      return <Navigate to="/accounts/dashboard" replace />;
    }
    return <NoModuleAccessView />;
  }

  // 2+ modules: render CommonWorkspaceView with authorized modules directly at /workspace
  return <CommonWorkspaceView />;
}
