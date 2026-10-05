import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectAuthContext, selectSessionStatus } from '../features/auth/authSlice';
import { getEntitledModules } from '../utils/moduleNormalization';
import NoModuleAccessView from '../components/common/NoModuleAccessView';

/**
 * Dynamically resolves the landing destination for /workspace based on
 * the canonical SSO /api/sso/auth/me authorization context.
 *
 * Rules:
 * - 0 modules: Render NoModuleAccessView
 * - 1 module: Open that module inside the common shell
 * - Multiple modules: Open primary authorized module inside the common ERP shell
 */
export default function WorkspaceLandingRedirect() {
  const authContext = useAppSelector(selectAuthContext);
  const sessionStatus = useAppSelector(selectSessionStatus);

  if (sessionStatus === 'idle' || sessionStatus === 'checking') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Priority 0: Super Administrator detection
  const isSuperAdmin =
    authContext?.user?.role === 'super_admin' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'SUPER_ADMIN')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'SUPER_ADMIN'));

  if (isSuperAdmin) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // Priority 1: Organization Owner detection
  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER'));

  if (isOwner) {
    return <Navigate to="/owner/dashboard" replace />;
  }

  const entitledModules = getEntitledModules(authContext);

  if (entitledModules.length === 0) {
    return <NoModuleAccessView />;
  }

  // Exactly 1 module: open that module
  if (entitledModules.length === 1) {
    const single = entitledModules[0];
    if (single === 'INVENTORY') {
      return <Navigate to="/inventory/dashboard" replace />;
    }
    if (single === 'CRM') {
      return <Navigate to="/crm/dashboard" replace />;
    }
    return <Navigate to="/accounts/dashboard" replace />;
  }

  // Multiple modules exist: render common ERP shell by navigating to the first authorized module
  if (entitledModules.includes('ACCOUNT')) {
    return <Navigate to="/accounts/dashboard" replace />;
  }
  if (entitledModules.includes('INVENTORY')) {
    return <Navigate to="/inventory/dashboard" replace />;
  }
  if (entitledModules.includes('CRM')) {
    return <Navigate to="/crm/dashboard" replace />;
  }

  return <Navigate to="/accounts/dashboard" replace />;
}
