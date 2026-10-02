import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useLogoutApiMutation } from '../features/auth/services/authApi';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, PieChart,
  LogOut, Menu, X, ChevronDown, ChevronRight, User, Bell,
  ArrowLeftRight, BadgeCheck
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { clearSelectedCompany, setSelectedCompany } from '../features/company-management/companySlice'
import { persistor, resetStore } from '../app/store'
import { baseApi } from '../api/common/baseApi'
import { ToastNotification } from './AuthLayout'
import { removeCookie } from '../utils/cookieHelper'

import SidebarNavItem from './SidebarNavItem'
import { buildInventorySidebarLinks as buildSidebarLinks } from './InventorySidebarConfig'
import { useRBAC } from '../utils/rbac'
import { hasPermission } from '../utils/rbacUtils'
import WorkspaceCard from '../features/account/components/WorkspaceCard'
import CompanyDetailsPopup from '../features/account/components/CompanyDetailsPopup'
import { fetchAccountCompanies, selectAccountCompanies, clearAccountCompany } from '../features/account/store/accountCompanySlice'
export default function InventoryLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const reduxUser = useAppSelector((s) => s.auth?.user ?? null)
  const selectedCompany = useAppSelector((s) => s.company.selectedCompany)
  const accountCompanies = useAppSelector(selectAccountCompanies)

  const currentUser = reduxUser;
  const userRole = currentUser?.role || 'accountant'

  const [workspacePopupOpen, setWorkspacePopupOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const workspaceRef = useRef(null)

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
    if (!selectedCompany && currentUser) {
      const code = currentUser.companyCode || currentUser.companyId
      if (code) {
        dispatch(setSelectedCompany({ id: code, code, name: currentUser.companyName || 'Company' }))
      }
    }
  }, [currentUser, selectedCompany, dispatch])

  // Fetch account companies ONCE on mount
  useEffect(() => {
    if (currentUser && accountCompanies.length === 0) {
      dispatch(fetchAccountCompanies())
    }
  }, [currentUser, accountCompanies.length, dispatch])

  const { canViewModule } = useRBAC();
  const authState = useAppSelector((s) => s.auth);

  const canAccess = useCallback(
    (module, action) => {
      if (!canViewModule(module)) return false;
      if (!action) return true;
      return hasPermission({ auth: authState }, module, action);
    },
    [canViewModule, authState]
  );

  const sidebarLinks = buildSidebarLinks(userRole, canAccess)

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

    navigate('/login', { replace: true })
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
      if (seg === 'accounts') return null
      const url = '/' + segments.slice(0, i + 1).join('/')
      return { label: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), url }
    })
    .filter(Boolean)

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="h-[56px] px-6 flex items-center gap-3 shrink-0 bg-transparent border-b border-zinc-100/50">
        <div className="w-24 h-10 flex items-center justify-start transform transition-transform hover:scale-105">
          <img src="/ChatGPT Image Sep 11, 2026, 03_03_31 AM.png" alt="Mark Logo" className="w-full h-full object-contain object-left" />
        </div>
        <span className="ml-auto text-[8px] font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200/50 uppercase tracking-wider">
          Accountant
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {sidebarLinks.map((item) => (
          <SidebarNavItem key={item.id} item={item} location={location} onLinkClick={() => setMobileSidebarOpen(false)} />
        ))}
      </nav>

      {/* Workspace context footer */}
      {selectedCompany && (
        <div className="shrink-0 px-3 py-3 border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-sm">
          <div className="relative" ref={workspaceRef}>
            <WorkspaceCard onClick={() => setWorkspacePopupOpen(prev => !prev)} isOpen={workspacePopupOpen} />
            <CompanyDetailsPopup open={workspacePopupOpen} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {!(currentUser?.companyCode || currentUser?.companyId) && (
              <button
                onClick={handleSwitchCompany}
                className="w-full flex items-center justify-center gap-2 text-[9.6px] font-semibold py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-600 transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <ArrowLeftRight size={14} />
                Switch Tenant
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-transparent flex font-sans selection:bg-zinc-200 selection:text-zinc-900">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] fixed top-0 bottom-0 left-0 z-20 transition-all duration-300 ${desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-width)' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] animate-slide-in-right lg:hidden shadow-xl"
            style={{ width: 'var(--sidebar-width)' }}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main Shell ── */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${desktopSidebarOpen ? 'lg:pl-[var(--sidebar-width)]' : 'lg:pl-0'}`}>
        <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">

          {/* Top Header */}
          <header className="h-[56px] bg-white/80 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-300 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setDesktopSidebarOpen(!desktopSidebarOpen)
                  } else {
                    setMobileSidebarOpen(true)
                  }
                }}
                className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-colors"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-2 text-[10.4px] text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/60 shadow-sm text-zinc-700">
                  <LayoutDashboard size={14} className="text-zinc-400" />
                  {selectedCompany?.name || 'Workspace'}
                </span>
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

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors group border border-transparent hover:border-zinc-200">
                <Bell size={18} className="group-hover:animate-wiggle" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full shadow-sm" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 hover:shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white font-bold flex items-center justify-center text-[10.4px] shadow-sm group-hover:shadow transition-all">
                    {currentUser?.fullName?.charAt(0)?.toUpperCase() || currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10.4px] font-bold text-zinc-800 leading-none">{currentUser?.fullName || currentUser?.username || 'User'}</p>
                    <p className="text-[8px] font-medium text-zinc-400 leading-tight mt-0.5 capitalize">{userRole.replace(/_/g, ' ')}</p>
                  </div>
                  <ChevronDown size={14} className="text-zinc-400 hidden md:block ml-1 group-hover:text-zinc-600 transition-colors" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-[110%] w-72 bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-40 animate-slide-up origin-top-right">
                      <div className="px-4 py-3.5 border-b border-zinc-100/80 mb-2 bg-zinc-50/50 mx-2 rounded-xl space-y-1">
                        <p className="text-sm font-bold text-zinc-900 truncate">{currentUser?.fullName || currentUser?.username || 'User'}</p>
                        <p className="text-[8.8px] font-semibold text-zinc-500 capitalize truncate">{userRole.replace(/_/g, ' ')}</p>
                        <p className="text-[9.6px] font-medium text-zinc-400 truncate">{currentUser?.email}</p>
                      </div>

                      <div className="px-4 py-2.5 mx-2 rounded-xl bg-zinc-50/80 border border-zinc-100/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Company Code</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 font-mono">{currentUser?.companyCode || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Employee ID</span>
                          <span className="text-[9.6px] font-medium text-zinc-800 font-mono">{currentUser?.empId || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Status</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${currentUser?.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {currentUser?.accountStatus === 'ACTIVE' ? 'Active' : (currentUser?.accountStatus || '—')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.8px] font-semibold text-zinc-400 uppercase">Email</span>
                          <span className={`inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${currentUser?.emailStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {currentUser?.emailStatus === 'VERIFIED' ? 'Verified' : (currentUser?.emailStatus || '—')}
                          </span>
                        </div>
                      </div>

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

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1120px] mx-auto w-full">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="py-4 border-t border-[var(--color-border)] text-center text-[9.6px] font-medium text-zinc-400 bg-transparent">
            &copy; {new Date().getFullYear()} Mark
          </footer>
        </div>
      </div>

      <ToastNotification />
    </div>
  )
}

