import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectAuthContext } from '../features/auth/authSlice';
import { selectSelectedCompany } from '../features/company-management/companySlice';
import { useAccessMode } from '../hooks/useAccessMode';
import { getEntitledModules } from '../utils/moduleNormalization';
import DashboardLayout from './DashboardLayout';
import SubscriptionNoticeBanner from '../components/common/SubscriptionNoticeBanner';
import OwnerSidebar from './OwnerSidebar';
import OwnerTopHeader from './OwnerTopHeader';

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

  const activeCompanyId =
    selectedCompany?.id || currentCompany?.id || (companies.length > 0 ? companies[0].id : null);
  const activeCompanyCode =
    selectedCompany?.code || currentCompany?.code || (companies.length > 0 ? companies[0].code : '');
  const activeCompanyName =
    selectedCompany?.name ||
    currentCompany?.name ||
    (companies.length > 0 ? companies[0].name : 'Primary Company');

  const {
    isTrial,
    isActive,
    isReadOnly,
    isBlocked,
    daysRemaining,
  } = useAccessMode();

  // Desktop sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('owner_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('owner_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  // Owner Authorization Guard
  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    authContext?.user?.role === 'super_admin';

  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  const entitledModules = useMemo(() => getEntitledModules(authContext), [authContext]);

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
        {children || <Outlet />}
      </DashboardLayout>
    </OwnerLayoutContext.Provider>
  );
}
