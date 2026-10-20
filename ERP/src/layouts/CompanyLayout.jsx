import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react'
import { useLogoutApiMutation } from '../features/auth/services/authApi';
import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ShieldCheck, Layers, Activity, Globe,
  Settings, LineChart, IndianRupee, UserCheck, Package, ShoppingCart, Store,
  LogOut, Menu, X, ChevronDown, ChevronRight, User, Bell, Factory,
  FileText, CreditCard, BarChart3, Briefcase, Calendar, ClipboardList,
  Boxes, Warehouse, ArrowLeftRight, Tag, TrendingUp, UserPlus, Clock,
  BadgeCheck, Truck, ClipboardCheck, Cog, ScrollText, Search, Key, Target,
  Network, FolderTree, PieChart, BookOpen, PackageOpen, Sparkles, AlertTriangle, ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { clearSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice'
import { removeCookie } from '../utils/cookieHelper'
// removed useLogoutMutation
import { ToastNotification } from './AuthLayout'
import { addAlert } from '../features/notifications/notificationSlice'
import { persistor, resetStore } from '../app/store'
import { baseApi } from '../api/common/baseApi'
import { useGetCompanyModulesQuery } from '../api/sso'
import { MODULE_DEFINITIONS, getAccessibleModuleKeys, getFirstAccessibleDashboardPath, normalizeModuleKey, getPermissionModuleKeys } from '../utils/moduleAccess'
import MarkLogo from '../components/common/MarkLogo'

import { useRBAC } from '../utils/rbac'
import { useRoutePath } from '../hooks/useRoutePath'
import { useAccessMode } from '../hooks/useAccessMode'

import AccountantLayout from './AccountantLayout'
import OwnerLayout from './OwnerLayout'
import { selectAuthContext } from '../features/auth/authSlice'
import { useSidebar } from './SidebarContext'
import RouteLoading from '../routes/RouteLoading'

import SidebarNavItem from './SidebarNavItem'
import { buildDynamicSidebar } from './dynamicSidebarConfig'

import WorkspaceCard from '../features/account/components/WorkspaceCard'
import CompanyDetailsPopup from '../features/account/components/CompanyDetailsPopup'
import { fetchAccountCompanies, selectAccountCompanies, clearAccountCompany } from '../features/account/store/accountCompanySlice'
import SearchAccount from '../components/common/SearchAccount'
import { SettingsSidebar } from '../components/settings'
import SubscriptionNoticeBanner from '../components/common/SubscriptionNoticeBanner'
import ErrorBoundary from '../components/common/ErrorBoundary'

export default function CompanyLayout() {


  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isFullHeightPage = location.pathname.includes('create-from-order') ||
    location.pathname.includes('/users') ||
    location.pathname.includes('/roles') ||
    location.pathname.includes('/portal-access') ||
    location.pathname.includes('/workflows') ||
    location.pathname.includes('/workflow');
  const { companyId } = useParams()

  const currentUser = useAppSelector((s) => s.auth?.user ?? null)
  const permissions = useAppSelector((s) => s.auth?.permissions) || []
  const selectedCompany = useAppSelector((s) => s.company.selectedCompany)

  const effectiveUser = currentUser;

  const {
    isTrial,
    isActive,
    isReadOnly,
    isBlocked,
    daysRemaining,
    organization,
  } = useAccessMode();

  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const desktopSidebarOpen = !isCollapsed;
  const mobileSidebarOpen = mobileOpen;

  const [profileOpen, setProfileOpen] = useState(false)
  const [workspacePopupOpen, setWorkspacePopupOpen] = useState(false)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false)
  const [activeSetting, setActiveSetting] = useState('general')
  const workspaceRef = useRef(null)

  const accountCompanies = useAppSelector(selectAccountCompanies)

  const handleToggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      toggleCollapse();
    } else {
      setMobileOpen(true);
    }
  }, [toggleCollapse, setMobileOpen]);

  const closeMobileSidebar = useCallback(() => closeMobile(), [closeMobile]);

  useEffect(() => {
    if (!workspacePopupOpen) return
    function handle(e) {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target)) {
        setWorkspacePopupOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [workspacePopupOpen])

  const authContext = useAppSelector(selectAuthContext);
  const membership = authContext?.membership;
  const rawRole = effectiveUser?.role || 'employee';
  const userRole = String(Array.isArray(rawRole) ? (rawRole[0]?.name || rawRole[0]) : (rawRole?.name || rawRole)).toLowerCase();
  const isOwnerUser = membership?.memberType === 'OWNER' || userRole === 'owner' || membership?.membershipType === 'OWNER';
  const isSuperAdminGlobal = userRole === 'super_admin' && location.pathname.startsWith('/super-admin');
  const skipCompanyModules = isSuperAdminGlobal || !companyId || (userRole !== 'super_admin' && userRole !== 'company_admin' && !isOwnerUser);
  const {
    data: companyModulesData,
    isLoading: companyModulesLoading,
    isFetching: companyModulesFetching,
  } = useGetCompanyModulesQuery(
    { pageSize: 5000 },
    { skip: skipCompanyModules }
  )
  const accessLoading = !skipCompanyModules && !companyModulesData && (companyModulesLoading || companyModulesFetching)
  const { canViewModule } = useRBAC()
  const { buildPath } = useRoutePath()

  // Compute permission-derived module keys. If backend-provided permissions are empty,
  // fall back to RBAC checks (role + token) so we don't block navigation incorrectly.
  const permissionKeysFromState = getPermissionModuleKeys(permissions, userRole, membership?.memberType)
  const effectivePermissionKeys = (permissionKeysFromState && permissionKeysFromState.length > 0)
    ? permissionKeysFromState
    : MODULE_DEFINITIONS.map(m => m.key).filter(k => canViewModule(k))

  const accessibleModuleKeys = getAccessibleModuleKeys({
    userRole,
    memberType: membership?.memberType,
    permissions: effectivePermissionKeys,
    companyModulesData,
    companyId,
    authModules: authContext?.modules,
  })

  const sidebarLinks = useMemo(() => {
    return buildDynamicSidebar({
      authContext,
      userRole,
      companyId,
      isSuperAdminGlobal,
      permissions,
    });
  }, [authContext, userRole, companyId, isSuperAdminGlobal, permissions]);

  useEffect(() => {
    if (userRole === 'super_admin' && companyId === '000000' && !location.pathname.startsWith('/super-admin')) {
      navigate('/super-admin/dashboard', { replace: true });
      return;
    }

    if (companyId && selectedCompany?.id !== companyId) {
      dispatch(setSelectedCompany({ id: companyId }));
    }
  }, [companyId, selectedCompany?.id, dispatch, userRole, location.pathname, navigate]);

  useEffect(() => {
    if (effectiveUser && accountCompanies.length === 0 && !isSuperAdminGlobal) {
      dispatch(fetchAccountCompanies())
    }
  }, [effectiveUser, accountCompanies.length, dispatch, isSuperAdminGlobal])

  useEffect(() => {
    if (isSuperAdminGlobal || !companyId) return
    if (accessLoading) return

    // Super admins and Owners have global access — skip per-company module guard entirely
    if (userRole === 'super_admin' || isOwnerUser) return

    const pathSegments = location.pathname.split('/').filter(Boolean)
    if (pathSegments.length < 3) return

    const modulePathStr = pathSegments[2]

    const globalCompanyRoutes = [
      'dashboard', 'company-dashboard', 'settings', 'security', 'features', 'permissions', 'profile', 'modules', 'module-routes',
      'admin', 'users', 'roles', 'portal-access', 'sessions', 'reports', 'accounts',
      'sales-crm', 'workflows', 'workflow', 'approvals'
    ]
    if (globalCompanyRoutes.includes(modulePathStr)) return

    const currentModuleKey = normalizeModuleKey(modulePathStr)
    if (currentModuleKey && !accessibleModuleKeys.includes(currentModuleKey)) {
      console.warn(`[RBAC] Access Denied for module: ${currentModuleKey}. Allowed:`, accessibleModuleKeys)
      navigate('/403', { replace: true })
    }
  }, [accessLoading, accessibleModuleKeys, companyId, isSuperAdminGlobal, userRole, location.pathname, navigate])

  const [logoutApi] = useLogoutApiMutation()

  const handleLogout = useCallback(async () => {
    // 1) Call logout endpoint FIRST while we still have the auth token
    try {
      await logoutApi().unwrap()
    } catch (err) {
      // Ignore — local cleanup happens regardless
    }

    // 2) Strip credentials so no subsequent API call can carry a valid token
    removeCookie("auth_token");
    removeCookie("ACCESS_TOKEN");
    removeCookie("ACCESS_TOKEN_REFRESH");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_permissions");
    localStorage.removeItem("selected_company");

    // 3) Reset all client-side state
    dispatch(baseApi.util.resetApiState())
    dispatch(resetStore())

    if (persistor) {
      try {
        await persistor.flush()
        await persistor.purge()
      } catch (e) {
        // Ignore
      }
    }

    localStorage.removeItem("persist:root");
    localStorage.clear();
    sessionStorage.clear()

    navigate('/', { replace: true })
  }, [dispatch, userRole, logoutApi, navigate])

  const handleSwitchCompany = useCallback(() => {
    dispatch(clearSelectedCompany())
    navigate('/company-select')
  }, [dispatch, navigate])

  // Breadcrumbs
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments
    .map((seg, i) => {
      if (!isNaN(seg) || seg.length > 24) return null
      if (seg === 'company') return null
      if (isSuperAdminGlobal && seg === 'super-admin') return null
      const url = '/' + segments.slice(0, i + 1).join('/')
      let label = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      if (seg === 'requests' && segments.includes('expenses')) label = 'Expense Requests'
      return { label, url }
    })
    .filter(Boolean)

  const isAccountant = userRole?.toUpperCase() === 'ACCOUNTANT' ||
    (Array.isArray(effectiveUser?.roles) && effectiveUser.roles.some((r) => {
      const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
      return String(name).toUpperCase() === 'ACCOUNTANT' || String(name).toUpperCase() === 'ROLE_ACCOUNTANT';
    }));

  if (userRole === 'super_admin' && companyId === '000000' && !location.pathname.startsWith('/super-admin')) {
    return null; // Return null to prevent child components from mounting and firing bad API requests while the useEffect redirects.
  }

  if (isAccountant) {
    return <AccountantLayout />
  }

  const sidebarContent = useMemo(() => (
    <>
      {/* Brand */}
      <div className="h-[56px] px-6 flex items-center gap-3 shrink-0 bg-transparent border-b border-zinc-100/50">
        <div className="w-24 h-10 flex items-center justify-start transform transition-transform hover:scale-105">
          <MarkLogo variant="light" className="w-full h-full object-contain object-left" />
        </div>
        {selectedCompany && !isSuperAdminGlobal && (
          <span className="ml-auto text-[10px] font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200/50 uppercase tracking-wider">
            {(effectiveUser?.role || authContext?.user?.role || membership?.memberType || (isOwnerUser ? 'Owner' : 'Member')).toString().replace(/^ROLE_/i, '').replace(/_/g, ' ')}
          </span>
        )}
        {isSuperAdminGlobal && (
          <span className="ml-auto text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200/50 uppercase tracking-wider">
            Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto space-y-0.5 custom-scrollbar">
        {sidebarLinks.map((item) => (
          <SidebarNavItem key={item.id} item={item} location={location} onLinkClick={closeMobileSidebar} />
        ))}
      </nav>

      {/* Company context footer */}
      {selectedCompany && !isSuperAdminGlobal && (
        <div className="shrink-0 px-3 py-3 border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-sm">
          <div className="relative" ref={workspaceRef}>
            <WorkspaceCard onClick={() => setWorkspacePopupOpen(prev => !prev)} isOpen={workspacePopupOpen} />
            <CompanyDetailsPopup open={workspacePopupOpen} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {!(effectiveUser?.companyCode || effectiveUser?.companyId) && (
              <button
                onClick={handleSwitchCompany}
                className="w-full flex items-center justify-center gap-2 text-[9.6px] font-semibold py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-600 transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <ArrowLeftRight size={14} />
                Switch Tenant
              </button>
            )}
            {isOwnerUser && (
              <Link
                to="/owner/dashboard"
                className="w-full flex items-center justify-center gap-2 text-[9.6px] font-semibold py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <Building2 size={14} className="text-zinc-500" />
                Exit to Owner Console
              </Link>
            )}
            {userRole === 'super_admin' && !isSuperAdminGlobal && (
              <Link
                to="/super-admin/dashboard"
                className="w-full flex items-center justify-center gap-2 text-[9.6px] font-semibold py-2 rounded-xl border-none bg-zinc-800 hover:bg-zinc-700 text-white transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                <LogOut size={14} />
                Exit to Global Console
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  ), [selectedCompany, isSuperAdminGlobal, sidebarLinks, location, closeMobileSidebar, workspacePopupOpen, effectiveUser, handleSwitchCompany, userRole, isOwnerUser]);

  return (
    <div className="h-screen bg-transparent flex font-sans selection:bg-zinc-200 selection:text-zinc-900 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-[var(--color-sidebar-bg)] border-r border-black/[0.06] fixed top-0 bottom-0 left-0 z-20 transition-transform duration-large ease-move overscroll-contain ${desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-width)' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => closeMobile()}
          />
          <aside
            className="fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] animate-slide-in-right lg:hidden shadow-xl overscroll-contain max-w-[85vw]"
            style={{ width: 'var(--sidebar-width)' }}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => closeMobile()}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors duration-micro ease-enter"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main Shell ── */}
      <div className={`flex-1 flex flex-col h-screen min-w-0 transition-[padding] duration-large ease-move ${desktopSidebarOpen ? 'lg:pl-sidebar' : 'lg:pl-0'}`}>
        <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">

          {/* Top Header */}
          <header className="h-[56px] flex-none bg-white/80 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleSidebar}
                className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-colors"
                title="Toggle Sidebar"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-2 text-[10.4px] text-zinc-500 font-medium">
                <Link
                  to={isSuperAdminGlobal ? '/super-admin/dashboard' : (selectedCompany ? buildPath('dashboard') : '/super-admin/dashboard')}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/60 shadow-sm"
                >
                  <LayoutDashboard size={14} className="text-zinc-400" />
                  {isSuperAdminGlobal ? (
                    'Global Console'
                  ) : organization?.name ? (
                    <span className="flex items-center gap-1 truncate max-w-[200px] md:max-w-none">
                      <strong className="capitalize text-zinc-800">{organization.name}</strong>
                      <span className="text-zinc-300">/</span>
                      <span>{selectedCompany ? selectedCompany.name : 'Workspace'}</span>
                    </span>
                  ) : (
                    selectedCompany ? selectedCompany.name : 'Workspace'
                  )}
                </Link>
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.url}>
                    <ChevronRight size={14} className="text-zinc-300" />
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-zinc-900 font-bold bg-zinc-100/50 px-2 py-1 rounded-md">{bc.label}</span>
                    ) : (
                      <Link to={bc.url} className="hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-zinc-50">
                        {bc.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Global Account Search */}
            <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
              <SearchAccount className="w-full" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtle Trial / Subscription Status Indicator Badge */}
              {isTrial && (
                <Link
                  to="/subscription"
                  title="View Subscription Details"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shrink-0 shadow-sm"
                >
                  <Clock size={12} className="text-emerald-600" />
                  <span className="hidden sm:inline">Trial • {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}</span>
                  <span className="sm:hidden">Trial • {daysRemaining !== null ? `${daysRemaining}d` : 'Active'}</span>
                </Link>
              )}
              {isReadOnly && (
                <Link
                  to="/subscription"
                  title="Trial Expired • Read-Only Mode"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors shrink-0 shadow-sm"
                >
                  <AlertTriangle size={12} className="text-amber-600" />
                  <span className="hidden sm:inline">Trial Expired • Read-Only</span>
                  <span className="sm:hidden">Read-Only</span>
                </Link>
              )}
              {isBlocked && (
                <div
                  title="Account Access Restricted"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 shrink-0"
                >
                  <ShieldAlert size={12} className="text-rose-600" />
                  <span className="hidden sm:inline">Access Restricted</span>
                  <span className="sm:hidden">Restricted</span>
                </div>
              )}
              {isActive && !isTrial && !isSuperAdminGlobal && (
                <Link
                  to="/subscription"
                  title="Subscription Active — All Modules Enabled"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all shrink-0 shadow-xs"
                >
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Active Plan</span>
                </Link>
              )}

              {/* Notifications */}
              <button
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors group border border-transparent hover:border-zinc-200"
              >
                <Bell size={18} className="group-hover:animate-wiggle" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full shadow-sm" />
              </button>

              {/* Settings Drawer Trigger */}
              <button
                type="button"
                aria-label="Settings"
                title="Settings"
                onClick={() => setSettingsDrawerOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors group border border-transparent hover:border-zinc-200"
              >
                <Settings size={18} className="transition-transform duration-300 group-hover:rotate-45" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  aria-label="User menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 hover:shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white font-bold flex items-center justify-center text-[10.4px] shadow-sm group-hover:shadow transition-all">
                    {effectiveUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10.4px] font-bold text-zinc-800 leading-none">{effectiveUser?.name}</p>
                    <p className="text-[10px] font-medium text-zinc-400 leading-tight mt-0.5 capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown size={14} className="text-zinc-400 hidden md:block ml-1 group-hover:text-zinc-600 transition-colors" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-[110%] w-72 bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-40 animate-slide-up origin-top-right">
                      <div className="px-4 py-3.5 border-b border-zinc-100/80 mb-2 bg-zinc-50/50 mx-2 rounded-xl space-y-1">
                        <p className="text-sm font-bold text-zinc-900 truncate">{effectiveUser?.name || effectiveUser?.fullName || effectiveUser?.username || 'User'}</p>
                        <p className="text-[8.8px] font-semibold text-zinc-500 capitalize truncate">{userRole.replace(/_/g, ' ')}</p>
                        <p className="text-[9.6px] font-medium text-zinc-400 truncate">{effectiveUser?.email}</p>
                      </div>

                      <div className="px-4 py-2.5 mx-2 rounded-xl bg-zinc-50/80 border border-zinc-100/60 space-y-1.5 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Company Code</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 font-mono">{effectiveUser?.companyCode || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Employee ID</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 font-mono">{effectiveUser?.empId || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Status</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${effectiveUser?.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {effectiveUser?.accountStatus === 'ACTIVE' ? 'Active' : (effectiveUser?.accountStatus || '—')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Email</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${effectiveUser?.emailStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {effectiveUser?.emailStatus === 'VERIFIED' ? 'Verified' : (effectiveUser?.emailStatus || '—')}
                          </span>
                        </div>
                      </div>

                      {selectedCompany && (
                        <Link
                          to={buildPath('profile')}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-[10.4px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary transition-colors mx-1 rounded-lg"
                        >
                          <User size={15} />
                          My Profile
                        </Link>
                      )}

                      {selectedCompany && !(effectiveUser?.companyCode || effectiveUser?.companyId) && (
                        <button
                          onClick={() => { setProfileOpen(false); handleSwitchCompany() }}
                          className="w-[calc(100%-8px)] flex items-center gap-3 px-4 py-2 text-[10.4px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary transition-colors text-left mx-1 rounded-lg"
                        >
                          <Building2 size={15} />
                          Switch Tenant
                        </button>
                      )}

                      <Link
                        to="/subscription"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-[10.4px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-primary transition-colors mx-1 rounded-lg"
                      >
                        <CreditCard size={15} />
                        Subscription & Plan
                      </Link>

                      <div className="border-t border-zinc-100 mt-2 pt-2 px-1">
                        <button
                          onClick={handleLogout}
                          className="w-[calc(100%-8px)] flex items-center gap-3 px-3 py-2.5 text-[10.4px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left mx-1 rounded-lg"
                        >
                          <LogOut size={15} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <SubscriptionNoticeBanner />

          <main className={`flex-1 min-h-0 min-w-0 flex flex-col bg-zinc-50/30 overscroll-contain ${isFullHeightPage ? 'overflow-hidden p-0' : 'overflow-x-hidden overflow-y-auto'}`} >
            <div className={`w-full flex-1 flex flex-col min-h-0 min-w-0 ${isFullHeightPage ? 'h-full' : 'max-w-[2560px] 5xl:max-w-[3200px] mx-auto'}`}>
              <ErrorBoundary>
                <Suspense fallback={<RouteLoading />}>
                  <Outlet context={{ accessibleModuleKeys, accessLoading, companyModulesData, authContext, isOwner: isOwnerUser }} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>

          {/* Footer */}
          {!isFullHeightPage && (
            <footer className="flex-none py-4 border-t border-[var(--color-border)] text-center text-[9.6px] font-medium text-zinc-400 bg-transparent">
              © {new Date().getFullYear()} Mark
            </footer>
          )}
        </div>
      </div>

      <ToastNotification />

      {/* ── Right-Side Settings Sidebar Drawer ── */}
      <SettingsSidebar
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        activeSetting={activeSetting}
        onSettingSelect={(settingId) => {
          setActiveSetting(settingId)
        }}
      />
    </div>
  )
}

