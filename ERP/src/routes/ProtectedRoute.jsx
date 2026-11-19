import React, { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice';
import { selectIsAuthenticated, selectCurrentUser, selectSessionStatus, selectAuthContext, setCredentials } from '../features/auth/authSlice';
import { getCookie, clearLegacyAuthCookies } from '../utils/cookieHelper';
import { parseJwt, extractRoleFromToken, useRBAC, normalizeModuleName, canAccess } from '../utils/rbac';
import { isOwnerUser as checkIsOwnerUser } from '../utils/moduleNormalization';

export default function ProtectedRoute({
  children,
  requireCompany = true,
  module,
  allowedRoles = [],
  requiredPermissions = null,
}) {
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const authContext = useAppSelector(selectAuthContext);

  const location = useLocation();
  const { companyId } = useParams();
  const dispatch = useAppDispatch();
  const { canViewModule, isSuperAdmin, isOwner } = useRBAC();

  const isTenantLocked = !!user?.companyCode || !!user?.companyId;
  const lockedCompanyId = user?.companyCode || user?.companyId;

  const rawRole = user?.role || authContext?.user?.role || '';
  const userRole = typeof rawRole === 'object' ? (rawRole.name || '') : String(rawRole);
  const normalizedUserRole = userRole.toLowerCase().replace(/[\s_]/g, '');
  const effectiveIsOwner = Boolean(
    isOwner ||
    checkIsOwnerUser(authContext) ||
    checkIsOwnerUser(user) ||
    user?.membership?.memberType === 'OWNER' ||
    authContext?.membership?.memberType === 'OWNER' ||
    normalizedUserRole === 'owner' ||
    (authContext?.companies && authContext.companies.some(c => c?.membership?.memberType === 'OWNER'))
  );
  const isOwnerUser = effectiveIsOwner;
  const isSuperAdminUser = isSuperAdmin || normalizedUserRole === 'superadmin' || normalizedUserRole === 'systemadmin';

  // Specific routes that bypass company requirements
  const isAccountsRoute = location.pathname === '/accounts' || location.pathname.startsWith('/accounts/') || location.pathname === '/account' || location.pathname.startsWith('/account/');
  const isProcurementRoute = [
    '/purchase-requisitions', '/rfqs', '/supplier-quotes', '/supplier-quotations', '/purchase-orders',
    '/goods-receipts', '/purchase-invoices', '/payments'
  ].some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const shouldRequireCompany = requireCompany && !isAccountsRoute && !isProcurementRoute;

  // Auto-sync company context from URL, SSO authContext, or tenant lock
  useEffect(() => {
    if (companyId && (!selectedCompany || selectedCompany?.id?.toString() !== companyId.toString())) {
      let candidate = null;
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('selected_company') || 'null');
          if (stored && (stored.id?.toString() === companyId.toString() || stored.code?.toString() === companyId.toString())) {
            candidate = stored;
          }
        } catch (e) { }
      }
      if (isSuperAdminUser || !isTenantLocked || lockedCompanyId?.toString() === companyId.toString()) {
        dispatch(setSelectedCompany(candidate || {
          id: companyId,
          code: candidate?.code || companyId,
          name: candidate?.name || 'Active Company',
        }));
        return;
      }
    }
    if (authContext.currentCompany && !selectedCompany) {
      dispatch(setSelectedCompany({
        id: authContext.currentCompany.id || authContext.currentCompany.code,
        name: authContext.currentCompany.name || authContext.currentCompany.legalName || 'Assigned Company',
        code: authContext.currentCompany.code,
      }));
    } else if (!selectedCompany && authContext?.companies?.length === 1) {
      const single = authContext.companies[0];
      dispatch(setSelectedCompany({
        id: single.id || single.code,
        name: single.name || single.legalName || 'Assigned Company',
        code: single.code,
      }));
    } else if (shouldRequireCompany && !selectedCompany && isTenantLocked) {
      dispatch(setSelectedCompany({
        id: lockedCompanyId,
        name: user?.companyName || 'Assigned Company',
        code: user?.companyCode
      }));
    }
  }, [companyId, authContext.currentCompany, shouldRequireCompany, selectedCompany, isTenantLocked, lockedCompanyId, user, isSuperAdminUser, dispatch]);

  // While checking session or fetching initial authorization context, show loader
  // NEVER redirect to /403 while auth initialization is in progress
  const isAuthInitializing = sessionStatus === 'idle' || sessionStatus === 'checking';
  if (isAuthInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0F1117]">
        <div className="w-8 h-8 border-4 border-primary dark:border-[#4C8DFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated? Check if token exists in query string or cookies before redirecting
  if (!authenticated) {
    const searchParams = new URLSearchParams(location.search);
    const queryToken = searchParams.get('token') || searchParams.get('accessToken') || searchParams.get('access_token') || searchParams.get('jwt');
    const cookieToken = queryToken || getCookie('ACCESS_TOKEN') || getCookie('auth_token') || getCookie('access_token') || (typeof localStorage !== 'undefined' ? (localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('auth_token')) : null);

    if (cookieToken) {
      const decoded = parseJwt(cookieToken);
      if (decoded) {
        const role = extractRoleFromToken(cookieToken, decoded);
        const userObj = { ...decoded, role };
        dispatch(setCredentials({
          user: userObj,
          permissions: decoded.permissions || decoded.modules || (role === 'super_admin' ? ['all'] : [])
        }));
        if (decoded.companyCode || decoded.companyId) {
          dispatch(setSelectedCompany({
            id: decoded.companyCode || decoded.companyId,
            name: decoded.companyName || 'Assigned Company',
            code: decoded.companyCode || decoded.companyId
          }));
        }
        if (queryToken) {
          const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const secureAttr = isHttps ? '; Secure' : '';
          document.cookie = `ACCESS_TOKEN=${queryToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
          clearLegacyAuthCookies();
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ACCESS_TOKEN', queryToken);
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('access_token');
            } catch (_) { }
          }
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            try {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete('token');
              cleanUrl.searchParams.delete('accessToken');
              cleanUrl.searchParams.delete('access_token');
              cleanUrl.searchParams.delete('jwt');
              window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
            } catch (e) {
              // Ignore URL parsing errors
            }
          }
        }
        // Still wait for auth context check
        return (
          <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0F1117]">
            <div className="w-8 h-8 border-4 border-primary dark:border-[#4C8DFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      }
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Super admins have cross-company access, regular users are locked
  if (isTenantLocked && !requireCompany && location.pathname === '/company-select') {
    return <Navigate to={`/company/${lockedCompanyId}`} replace />;
  }

  // Check company context: Ensure company is initialized before route evaluation
  if (shouldRequireCompany && !selectedCompany && !authContext.currentCompany) {
    if (authContext?.companies?.length === 1) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0F1117]">
          <div className="w-8 h-8 border-4 border-primary dark:border-[#4C8DFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (isTenantLocked) {
      if (!companyId || companyId !== lockedCompanyId) {
        return <Navigate to={`/company/${lockedCompanyId}`} replace />;
      }
    } else {
      return <Navigate to="/company-select" replace />;
    }
  }

  // Path requires company but no companyId present in URL
  if (shouldRequireCompany && companyId === 'undefined') {
    return <Navigate to="/company-select" replace />;
  }

  // URL mismatch with selected company
  if (shouldRequireCompany && companyId && selectedCompany?.id?.toString() !== companyId.toString()) {
    if (isSuperAdminUser || !isTenantLocked || lockedCompanyId?.toString() === companyId.toString()) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0F1117]">
          <div className="w-8 h-8 border-4 border-primary dark:border-[#4C8DFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    return <Navigate to="/company-select" replace />;
  }

  // Allowed roles check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!isSuperAdminUser) {
      const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase().replace(/[\s_]/g, ''));
      const isAllowed = normalizedAllowed.includes(normalizedUserRole) || (isOwnerUser && (normalizedAllowed.includes('owner') || normalizedAllowed.includes('companyadmin')));
      if (!isAllowed) {
        return <Navigate to="/403" replace />;
      }
    }
  }

  // Required permissions check
  if (requiredPermissions && !isSuperAdminUser && !effectiveIsOwner) {
    const permsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    for (const perm of permsToCheck) {
      if (!canViewModule(perm)) {
        return <Navigate to="/403" replace />;
      }
    }
  }

  // Module access check: block access if user lacks the required module or feature
  if (module && !isSuperAdmin && !effectiveIsOwner && !canViewModule(module)) {
    const normalizedModule = normalizeModuleName(module);
    const canAccessValue = canAccess(authContext, module);
    console.warn('[ProtectedRoute 403 Redirect]', {
      pathname: location.pathname,
      requiredModule: module,
      normalizedModule,
      authLoading: sessionStatus === 'checking' || sessionStatus === 'idle',
      organization: authContext.organization,
      currentCompany: authContext.currentCompany || selectedCompany,
      role: user?.role,
      authorizedModules: authContext.modules,
      features: authContext.features,
      permissions: authContext.permissions,
      canViewModule: canViewModule(module),
      canAccess: canAccessValue,
      isSuperAdmin
    });
    return <Navigate to="/403" replace />;
  }

  return children;
}
