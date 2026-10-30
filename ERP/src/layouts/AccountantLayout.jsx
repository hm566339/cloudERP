import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react'
import { useLogoutApiMutation } from '../features/auth/services/authApi';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, PieChart,
  LogOut, Menu, X, ChevronDown, ChevronRight, User, Bell,
  ArrowLeftRight, BadgeCheck, Settings, Clock, AlertTriangle, ShieldAlert, Sparkles, CreditCard, ShieldCheck
} from 'lucide-react'
import { SettingsSidebar } from '../components/settings'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { clearSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice'
import { persistor, resetStore } from '../app/store'
import { baseApi } from '../api/common/baseApi'
import { ToastNotification } from './AuthLayout'
import { removeCookie } from '../utils/cookieHelper'

import SidebarNavItem from './SidebarNavItem'
import { buildDynamicSidebar } from './dynamicSidebarConfig'
import { useRBAC } from '../utils/rbac'
import { hasPermission } from '../utils/rbacUtils'
import { useAccessMode } from '../hooks/useAccessMode'
import WorkspaceCard from '../features/account/components/WorkspaceCard'
import CompanyDetailsPopup from '../features/account/components/CompanyDetailsPopup'
import SwitchTenantPopup from '../features/account/components/SwitchTenantPopup'
import MarkLogo from '../components/common/MarkLogo'
import { fetchAccountCompanies, selectAccountCompanies, clearAccountCompany } from '../features/account/store/accountCompanySlice'
import SearchAccount from '../components/common/SearchAccount'
import SubscriptionNoticeBanner from '../components/common/SubscriptionNoticeBanner'
import { selectAuthContext } from '../features/auth/authSlice'
import { getEntitledModules } from '../utils/moduleNormalization'
import NoModuleAccessView from '../components/common/NoModuleAccessView'
import ErrorBoundary from '../components/common/ErrorBoundary'
import RouteLoading from '../routes/RouteLoading'
import OwnerLayout from './OwnerLayout'
import { useSidebar } from './SidebarContext'
import ThemeToggle from '../components/common/ThemeToggle'

export default function AccountantLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isFullHeightPage = location.pathname.includes('create-from-order') ||
    location.pathname.includes('/users') ||
    location.pathname.includes('/roles') ||
    location.pathname.includes('/portal-access') ||
    location.pathname.includes('/workflows') ||
    location.pathname.includes('/workflow');

  const reduxUser = useAppSelector((s) => s.auth?.user ?? null)
  const selectedCompany = useAppSelector((s) => s.company.selectedCompany)
  const accountCompanies = useAppSelector(selectAccountCompanies)

  const currentUser = reduxUser;
  const userRole = currentUser?.role || 'accountant'

  const authContext = useAppSelector(selectAuthContext);
  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER'));

  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const desktopSidebarOpen = !isCollapsed;
  const mobileSidebarOpen = mobileOpen;

  const {
    isTrial,
    isActive,
    isReadOnly,
    isBlocked,
    daysRemaining,
    organization,
  } = useAccessMode();

  const [workspacePopupOpen, setWorkspacePopupOpen] = useState(false)
  const [switchTenantPopupOpen, setSwitchTenantPopupOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false)
  const [activeSetting, setActiveSetting] = useState('general')
  const workspaceRef = useRef(null)

  const handleToggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1024) {
      toggleCollapse()
    } else {
      setMobileOpen(true)
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

  // Auto-select first company if none selected
  useEffect(() => {
    if (!selectedCompany) {
      const company = authContext?.currentCompany || (authContext?.companies?.length === 1 ? authContext.companies[0] : null);
      if (company) {
        dispatch(setSelectedCompany({
          id: company.id || company.code,
          code: company.code || company.id,
          name: company.name || company.legalName || 'Company',
        }));
      } else if (currentUser) {
        const code = currentUser.companyCode || currentUser.companyId;
        if (code) {
          dispatch(setSelectedCompany({ id: code, code, name: currentUser.companyName || 'Company' }));
        }
      }
    }
  }, [currentUser, selectedCompany, authContext, dispatch]);

  // Fetch account companies ONCE on mount
  useEffect(() => {
    if (currentUser && accountCompanies.length === 0) {
      dispatch(fetchAccountCompanies())
    }
  }, [currentUser, accountCompanies.length, dispatch])

  const { canViewModule, hasModule } = useRBAC();

  const canAccess = useCallback(
    (feature, action, mod) => {
      if (!action) {
        return canViewModule(feature);
      }
      return hasPermission({ auth: authContext }, feature, action);
    },
    [canViewModule, authContext]
  );

  const sidebarLinks = useMemo(() => {
    return buildDynamicSidebar({
      authContext,
      userRole,
      companyId: selectedCompany?.id || currentUser?.companyCode || null,
      isSuperAdminGlobal: false,
    });
  }, [authContext, userRole, selectedCompany, currentUser]);

  const entitledModules = useMemo(() => getEntitledModules(authContext), [authContext]);

  const [logoutApi] = useLogoutApiMutation();

  const handleLogout = useCallback(async () => {
    // 1) Call logout endpoint FIRST while we still have the auth token
    try {
      await logoutApi().unwrap();
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
    sessionStorage.clear();

    navigate('/', { replace: true })
  }, [dispatch, logoutApi, navigate])

  const handleSwitchCompany = useCallback(() => {
    dispatch(clearAccountCompany())
    dispatch(clearSelectedCompany())
    navigate('/company-select')
  }, [dispatch, navigate])

  // Breadcrumbs
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments
    .map((seg, i) => {
      if (!isNaN(seg) || seg.length > 24) return null
      const url = '/' + segments.slice(0, i + 1).join('/')
      let label = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      if (seg === 'requests' && segments.includes('expenses')) label = 'Expense Requests'
      return { label, url }
    })
    .filter(Boolean)

  const sidebarContent = useMemo(() => (
    <>
      {/* Brand */}
      <div className="h-[56px] px-6 flex items-center gap-3 shrink-0 bg-transparent border-b border-zinc-100/50">
        <div className="w-24 h-10 flex items-center justify-start transform transition-transform hover:scale-105">
          <MarkLogo variant="auto" className="w-full h-full object-contain object-left" />
        </div>
        <span className="ml-auto text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 uppercase tracking-wider">
          {(currentUser?.role || authContext?.user?.role || 'Accountant').toString().replace(/^ROLE_/i, '').replace(/_/g, ' ')}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {sidebarLinks.map((item) => (
          <SidebarNavItem key={item.id} item={item} location={location} onLinkClick={closeMobileSidebar} />
        ))}
      </nav>

      {/* Workspace context footer */}
      {selectedCompany && (
        <div className="shrink-0 px-3 py-3 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922]/50 backdrop-blur-sm">
          <div className="relative" ref={workspaceRef}>
            <WorkspaceCard onClick={() => { setSwitchTenantPopupOpen(false); setWorkspacePopupOpen(prev => !prev); }} isOpen={workspacePopupOpen} />
            <CompanyDetailsPopup open={workspacePopupOpen} />
          </div>
          <div className="mt-3 flex flex-col gap-2 relative">
            <SwitchTenantPopup
              open={switchTenantPopupOpen}
              onClose={() => setSwitchTenantPopupOpen(false)}
            />
            <button
              type="button"
              onClick={() => { setWorkspacePopupOpen(false); setSwitchTenantPopupOpen(prev => !prev); }}
              className="w-full flex items-center justify-center gap-2 text-[9.6px] font-semibold py-2 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-[#3A4154] text-zinc-600 dark:text-[#E6E8EE] transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeftRight size={14} />
              Switch Tenant
            </button>
          </div>
        </div>
      )}
    </>
  ), [sidebarLinks, location, closeMobileSidebar, selectedCompany, workspacePopupOpen, switchTenantPopupOpen, currentUser, handleSwitchCompany]);

  const isOwnerWorkspace = location.pathname.startsWith('/owner') || location.pathname.startsWith('/organization');
  if (isOwner && isOwnerWorkspace) {
    return <OwnerLayout />;
  }

  if (entitledModules.length === 0 && authContext.user && (authContext.organization || authContext.currentCompany)) {
    return <NoModuleAccessView />;
  }

  return (
    <div className="h-screen bg-transparent flex font-sans selection:bg-zinc-200 selection:text-zinc-900 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-[var(--color-sidebar-bg)] border-r border-black/[0.06] dark:border-[#2A2F3D] fixed top-0 bottom-0 left-0 z-20 transition-transform duration-300 ease-in-out will-change-transform ${desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-width)' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => closeMobile()}
          />
          <aside
            className="fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] dark:border-[#2A2F3D] animate-slide-in-right lg:hidden shadow-xl will-change-transform"
            style={{ width: 'var(--sidebar-width)' }}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => closeMobile()}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
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
      <div className={`flex-1 flex flex-col h-screen min-w-0 transition-[padding] duration-300 ease-in-out ${desktopSidebarOpen ? 'lg:pl-sidebar' : 'lg:pl-0'}`}>
        <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">

          {/* Top Header */}
          <header className="h-[56px] flex-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleSidebar}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-2 text-[10.4px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm text-zinc-700 dark:text-zinc-300">
                  <LayoutDashboard size={14} className="text-zinc-400" />
                  {organization?.name ? (
                    <span className="flex items-center gap-1 truncate max-w-[200px] md:max-w-none">
                      <strong className="capitalize text-zinc-800 dark:text-zinc-200">{organization.name}</strong>
                      <span className="text-zinc-300 dark:text-zinc-600">/</span>
                      <span>{selectedCompany?.name || 'Workspace'}</span>
                    </span>
                  ) : (
                    selectedCompany?.name || 'Workspace'
                  )}
                </span>
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc.url}>
                    <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600" />
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md">{bc.label}</span>
                    ) : (
                      <Link to={bc.url} className="hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors shrink-0 shadow-sm"
                >
                  <Clock size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Trial • {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}</span>
                  <span className="sm:hidden">Trial • {daysRemaining !== null ? `${daysRemaining}d` : 'Active'}</span>
                </Link>
              )}
              {isReadOnly && (
                <Link
                  to="/subscription"
                  title="Trial Expired • Read-Only Mode"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-colors shrink-0 shadow-sm"
                >
                  <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Trial Expired • Read-Only</span>
                  <span className="sm:hidden">Read-Only</span>
                </Link>
              )}
              {isBlocked && (
                <div
                  title="Account Access Restricted"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0"
                >
                  <ShieldAlert size={12} className="text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Access Restricted</span>
                  <span className="sm:hidden">Restricted</span>
                </div>
              )}
              {isActive && !isTrial && (
                <Link
                  to="/subscription"
                  title="Subscription Active"
                  className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors shrink-0"
                >
                  <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Active</span>
                </Link>
              )}

              {/* Notifications */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors group border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]">
                <Bell size={18} className="group-hover:animate-wiggle" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-[#161922] rounded-full shadow-sm" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Settings Drawer Trigger */}
              <button
                type="button"
                aria-label="Settings"
                title="Settings"
                onClick={() => setSettingsDrawerOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors group border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]"
              >
                <Settings size={18} className="transition-transform duration-300 group-hover:rotate-45" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-[#222736] rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D] hover:shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-blue-600 dark:to-indigo-600 text-white font-bold flex items-center justify-center text-[10.4px] shadow-sm group-hover:shadow transition-all">
                    {currentUser?.fullName?.charAt(0)?.toUpperCase() || currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] leading-none">{currentUser?.fullName || currentUser?.username || 'User'}</p>
                    <p className="text-[10px] font-medium text-zinc-400 dark:text-[#A0A6B5] leading-tight mt-0.5 capitalize">{userRole.replace(/_/g, ' ')}</p>
                  </div>
                  <ChevronDown size={14} className="text-zinc-400 dark:text-[#A0A6B5] hidden md:block ml-1 group-hover:text-zinc-600 dark:group-hover:text-[#E6E8EE] transition-colors" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-[110%] w-72 bg-white/90 dark:bg-[#161922]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-[#2A2F3D] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-40 animate-slide-up origin-top-right">
                      <div className="px-4 py-3.5 border-b border-zinc-100/80 dark:border-[#2A2F3D] mb-2 bg-zinc-50/50 dark:bg-[#1D212C] mx-2 rounded-xl space-y-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] truncate">{currentUser?.fullName || currentUser?.username || 'User'}</p>
                        <p className="text-[8.8px] font-semibold text-zinc-500 dark:text-[#A0A6B5] capitalize truncate">{userRole.replace(/_/g, ' ')}</p>
                        <p className="text-[9.6px] font-medium text-zinc-400 dark:text-[#6B7184] truncate">{currentUser?.email}</p>
                      </div>

                      <div className="px-4 py-2.5 mx-2 rounded-xl bg-zinc-50/80 dark:bg-[#1D212C] border border-zinc-100/60 dark:border-[#2A2F3D] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 dark:text-[#A0A6B5] uppercase">Company Code</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 dark:text-[#E6E8EE] font-mono">{currentUser?.companyCode || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 dark:text-[#A0A6B5] uppercase">Employee ID</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 dark:text-[#E6E8EE] font-mono">{currentUser?.empId || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 dark:text-[#A0A6B5] uppercase">Status</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${currentUser?.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            }`}>
                            {currentUser?.accountStatus === 'ACTIVE' ? 'Active' : (currentUser?.accountStatus || '—')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 dark:text-[#A0A6B5] uppercase">Email</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${currentUser?.emailStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                            {currentUser?.emailStatus === 'VERIFIED' ? 'Verified' : (currentUser?.emailStatus || '—')}
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/subscription"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-[10.4px] font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-primary transition-colors mx-1 rounded-lg"
                      >
                        <CreditCard size={15} />
                        Subscription & Plan
                      </Link>

                      {(authContext?.membership?.memberType === 'OWNER' || currentUser?.role === 'owner') && (
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-[10.4px] font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-primary transition-colors mx-1 rounded-lg"
                        >
                          <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                          Organization Control Center
                        </Link>
                      )}

                      <div className="border-t border-zinc-100 dark:border-[#2A2F3D] mt-2 pt-2 px-1">
                        <button
                          onClick={handleLogout}
                          className="w-[calc(100%-8px)] flex items-center gap-3 px-3 py-2.5 text-[10.4px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors text-left mx-1 rounded-lg"
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

          <main className={`flex-1 min-h-0 min-w-0 flex flex-col bg-zinc-50/30 dark:bg-[#0F1117] overscroll-contain ${isFullHeightPage ? 'overflow-hidden p-0' : 'overflow-x-hidden overflow-y-auto'}`}>
            <div className={`w-full flex-1 flex flex-col min-h-0 min-w-0 ${isFullHeightPage ? 'h-full' : 'max-w-[2560px] 5xl:max-w-[3200px] mx-auto'}`}>
              <ErrorBoundary>
                <Suspense fallback={<RouteLoading />}>
                  <Outlet context={{ accessibleModuleKeys: ['account', 'inventory', 'crm', 'purchases', 'workflow'], accessLoading: false, authContext, isOwner: false }} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>

          {/* Footer */}
          {!isFullHeightPage && (
            <footer className="flex-none py-4 border-t border-[var(--color-border)] text-center text-[9.6px] font-medium text-zinc-400 bg-transparent">
              &copy; {new Date().getFullYear()} Mark
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
