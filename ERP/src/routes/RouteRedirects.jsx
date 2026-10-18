import React, { lazy } from 'react';
import { Navigate, useSearchParams, useParams, useOutletContext } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectIsAuthenticated, selectCurrentUser, selectAuthContext } from '../features/auth/authSlice';
import { getCookie } from '../utils/cookieHelper';
import { getPostLoginRedirectPath } from '../utils/moduleAccess';
import { getEntitledModules } from '../utils/moduleNormalization';
import RouteLoading from './RouteLoading';

const LandingPage = lazy(() => import('../pages/public/LandingPage'));

export function RootIndexHandler() {
  const [searchParams] = useSearchParams();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const cookieToken =
    getCookie('ACCESS_TOKEN') ||
    getCookie('auth_token') ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('auth_token')
      : null);

  const urlToken = searchParams.get('token') || searchParams.get('accessToken');
  if (urlToken) {
    return <Navigate to={`/accounts/dashboard?token=${encodeURIComponent(urlToken)}`} replace />;
  }

  if (authenticated && user) {
    return <Navigate to={getPostLoginRedirectPath({ user })} replace />;
  }

  if (cookieToken && user) {
    return <Navigate to={getPostLoginRedirectPath({ user })} replace />;
  }

  return <LandingPage />;
}

export function SmartRedirect() {
  const [searchParams] = useSearchParams();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  const urlToken = searchParams.get('token') || searchParams.get('accessToken');
  if (urlToken) {
    return <Navigate to={`/accounts/dashboard?token=${encodeURIComponent(urlToken)}`} replace />;
  }

  if (authenticated && user) {
    return <Navigate to={getPostLoginRedirectPath({ user })} replace />;
  }

  return <Navigate to="/" replace />;
}

export function CompanyEntryRedirect() {
  const { companyId } = useParams();
  const { accessLoading = false } = useOutletContext() || {};
  const authContext = useAppSelector(selectAuthContext);
  const user = authContext.user;

  if (accessLoading) {
    return <RouteLoading />;
  }

  const isOwner = authContext?.membership?.memberType === 'OWNER' || user?.role === 'owner';
  const isAdmin = user?.role === 'super_admin';

  const effectiveCompanyId =
    (companyId && companyId !== 'undefined')
      ? companyId
      : (authContext?.currentCompany?.id || authContext?.currentCompany?.code || user?.companyId || user?.companyCode);

  // Admins and Owners get the general overview dashboard with all accessible company modules
  if (isAdmin || isOwner) {
    if (effectiveCompanyId) {
      return <Navigate to={`/company/${encodeURIComponent(effectiveCompanyId)}/dashboard`} replace />;
    }
    return <Navigate to="/company-select" replace />;
  }

  // Regular users get redirected to the first canonical entitled module
  const entitledModules = getEntitledModules(authContext);

  if (entitledModules.includes('ACCOUNT')) {
    return <Navigate to="/accounts/dashboard" replace />;
  }
  if (entitledModules.includes('INVENTORY')) {
    return <Navigate to="/inventory/dashboard" replace />;
  }
  if (entitledModules.includes('CRM')) {
    return <Navigate to="/crm/dashboard" replace />;
  }

  // Fallback if no modules matched
  if (effectiveCompanyId) {
    return <Navigate to={`/company/${encodeURIComponent(effectiveCompanyId)}/dashboard`} replace />;
  }
  return <Navigate to="/company-select" replace />;
}
