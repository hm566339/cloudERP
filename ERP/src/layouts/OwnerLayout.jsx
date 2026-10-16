import React, { useMemo, createContext, useContext, Suspense, useEffect } from 'react';
import { Outlet, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectAuthContext } from '../features/auth/authSlice';
import { selectSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice';
import { useAccessMode } from '../hooks/useAccessMode';
import { getEntitledModules, normalizeModuleName } from '../utils/moduleNormalization';
import DashboardLayout from './DashboardLayout';
import SubscriptionNoticeBanner from '../components/common/SubscriptionNoticeBanner';
import { ToastNotification } from './AuthLayout';
import OwnerSidebar from './OwnerSidebar';
import OwnerTopHeader from './OwnerTopHeader';
import { useRBAC } from '../utils/rbac';
import ErrorBoundary from '../components/common/ErrorBoundary';
import RouteLoading from '../routes/RouteLoading';
import { useSidebar } from './SidebarContext';

export const OwnerLayoutContext = createContext(false);

export function useIsOwnerLayout() {
  return useContext(OwnerLayoutContext);
}

/**
 * Standard Layout wrapper for the Owner Workspace & Dashboard.
 * Reuses and composes the project's DashboardLayout shell:
 * <DashboardLayout sidebar={<OwnerSidebar />} header={<OwnerTopHeader />} banner={<SubscriptionNoticeBanner />}>
 *   <PageContent />
 * </DashboardLayout>
 */
export default function OwnerLayout({ children }) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const location = useLocation();
  const authContext = useAppSelector(selectAuthContext);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  const {
    organization,
    currentCompany,
    companies = [],
    membership,
    subscription,
    user,
  } = authContext;

  const urlCompanyId = params.companyId || location.pathname.match(/\/company\/([^/]+)/)?.[1] || null;

  const activeCompanyId =
    urlCompanyId ||
    selectedCompany?.id ||
    currentCompany?.id ||
    (companies.length > 0 ? companies[0].id : null);

  const matchedCompany =
    (companies || []).find((c) => c.id === activeCompanyId) || selectedCompany || currentCompany;

  const activeCompanyCode =
    matchedCompany?.code || (companies.length > 0 ? companies[0].code : '');
  const activeCompanyName =
    matchedCompany?.name ||
    matchedCompany?.legalName ||
    (companies.length > 0 ? companies[0].name : 'Primary Company');

  useEffect(() => {
    if (urlCompanyId && selectedCompany?.id !== urlCompanyId) {
      const found = (companies || []).find((c) => c.id === urlCompanyId);
      dispatch(
        setSelectedCompany({
          id: urlCompanyId,
          code: found?.code || '',
          name: found?.name || found?.legalName || '',
        })
      );
    }
  }, [urlCompanyId, selectedCompany?.id, companies, dispatch]);

  const {
    isTrial,
    isActive,
    isReadOnly,
    isBlocked,
    daysRemaining,
  } = useAccessMode();

  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen } = useSidebar();

  // Owner Authorization Guard
  const { isOwner: rbacIsOwner, isSuperAdmin } = useRBAC();
  const rawRole = (authContext?.user?.role || authContext?.role || '').toLowerCase();
  const memberType = (authContext?.membership?.memberType || authContext?.user?.membership?.memberType || '').toUpperCase();
  const allRoles = [
    ...(Array.isArray(authContext?.user?.roles) ? authContext.user.roles : []),
    ...(Array.isArray(authContext?.roles) ? authContext.roles : [])
  ].map(r => (typeof r === 'string' ? r : r?.name || '').toUpperCase());

  const isOwner =
    rbacIsOwner ||
    isSuperAdmin ||
    memberType === 'OWNER' ||
    memberType === 'ADMIN' ||
    rawRole.includes('owner') ||
    rawRole.includes('admin') ||
    allRoles.some(r => r.includes('OWNER') || r.includes('ADMIN'));

  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  const entitledModules = useMemo(() => {
    if (Array.isArray(authContext?.modules) && authContext.modules.length > 0) {
      return authContext.modules
        .filter((m) => m.active !== false)
        .map((m) => m.canonical || normalizeModuleName(m.name || m.code))
        .filter(Boolean);
    }
    return getEntitledModules(authContext);
  }, [authContext]);

  return (
    <OwnerLayoutContext.Provider value={true}>
      <DashboardLayout
        isCollapsed={isCollapsed}
        sidebar={
          <OwnerSidebar
            organization={organization}
            membership={membership}
            user={user}
            entitledModules={entitledModules}
            activeCompanyId={activeCompanyId}
            companies={companies}
            isTrial={isTrial}
            daysRemaining={daysRemaining}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
        }
        header={
          <OwnerTopHeader
            organization={organization}
            user={user}
            companies={companies}
            activeCompanyId={activeCompanyId}
            activeCompanyCode={activeCompanyCode}
            activeCompanyName={activeCompanyName}
            isTrial={isTrial}
            isActive={isActive}
            isReadOnly={isReadOnly}
            daysRemaining={daysRemaining}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onMobileOpen={() => setMobileOpen(true)}
          />
        }
        banner={<SubscriptionNoticeBanner />}
      >
        <ToastNotification />
        <ErrorBoundary>
          <Suspense fallback={<RouteLoading />}>
            {children || <Outlet context={{ accessibleModuleKeys: entitledModules, accessLoading: false, authContext, isOwner: true }} />}
          </Suspense>
        </ErrorBoundary>
      </DashboardLayout>
    </OwnerLayoutContext.Provider>
  );
}
