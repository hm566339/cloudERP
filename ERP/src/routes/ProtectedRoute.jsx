import React, { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice';
import { selectIsAuthenticated, selectCurrentUser, selectSessionStatus, selectAuthContext, setCredentials } from '../features/auth/authSlice';
import { getCookie } from '../utils/cookieHelper';
import { parseJwt, extractRoleFromToken, useRBAC, normalizeModuleName, canAccess } from '../utils/rbac';

export default function ProtectedRoute({ children, requireCompany = true, module }) {
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const authContext = useAppSelector(selectAuthContext);
  
  const location = useLocation();
  const { companyId } = useParams();
  const dispatch = useAppDispatch();
  const { canViewModule, isSuperAdmin } = useRBAC();

  const isTenantLocked = !!user?.companyCode || !!user?.companyId;
  const lockedCompanyId = user?.companyCode || user?.companyId;
  
  // Specific routes that bypass company requirements
  const isAccountsRoute = location.pathname === '/accounts' || location.pathname.startsWith('/accounts/') || location.pathname === '/account' || location.pathname.startsWith('/account/');
  const isProcurementRoute = [
    '/purchase-requisitions', '/rfqs', '/supplier-quotes', '/supplier-quotations', '/purchase-orders', 
    '/goods-receipts', '/purchase-invoices', '/payments'
  ].some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const shouldRequireCompany = requireCompany && !isAccountsRoute && !isProcurementRoute;

  // Auto-sync company context from SSO authContext if selectedCompany is missing
  useEffect(() => {
    if (authContext.currentCompany && !selectedCompany) {
      dispatch(setSelectedCompany({
        id: authContext.currentCompany.id || authContext.currentCompany.code,
        name: authContext.currentCompany.name || authContext.currentCompany.legalName || 'Assigned Company',
        code: authContext.currentCompany.code,
      }));
    } else if (shouldRequireCompany && !selectedCompany && isTenantLocked) {
      dispatch(setSelectedCompany({
        id: lockedCompanyId,
        name: user?.companyName || 'Assigned Company',
        code: user?.companyCode
      }));
    }
  }, [authContext.currentCompany, shouldRequireCompany, selectedCompany, isTenantLocked, lockedCompanyId, user, dispatch]);

  // While checking session or fetching initial authorization context, show loader
  // NEVER redirect to /403 while auth initialization is in progress
  const isAuthInitializing = sessionStatus === 'idle' || sessionStatus === 'checking';
  if (isAuthInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated? Check if token exists in query string or cookies before redirecting
  if (!authenticated) {
    const searchParams = new URLSearchParams(location.search);
    const queryToken = searchParams.get('token') || searchParams.get('accessToken') || searchParams.get('access_token') || searchParams.get('jwt');
    const cookieToken = queryToken || getCookie('ACCESS_TOKEN') || getCookie('auth_token');
    
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
          document.cookie = `ACCESS_TOKEN=${queryToken}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `auth_token=${queryToken}; path=/; max-age=86400; SameSite=Lax`;
        }
        // Still wait for auth context check
        return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      }
    }
    return <Navigate to="/modules" state={{ from: location }} replace />;
  }

  // Super admins have cross-company access, regular users are locked
  if (isTenantLocked && !requireCompany && location.pathname === '/company-select') {
    return <Navigate to={`/company/${lockedCompanyId}`} replace />;
  }

  // Check company context: Ensure company is initialized before route evaluation
  if (shouldRequireCompany && !selectedCompany && !authContext.currentCompany) {
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
    return <Navigate to="/company-select" replace />;
  }

  // Module access check: block access if user lacks the required module or feature
  if (module && !isSuperAdmin && !canViewModule(module)) {
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
