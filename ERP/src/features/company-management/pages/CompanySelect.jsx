import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Search, ShieldCheck, ChevronRight, LogOut, Loader2, Sparkles, Shield, Zap } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { setSelectedCompany } from '../../company-management/companySlice'
import { useGetCompaniesQuery } from '../../../api/sso'
import { useGetOpenCompaniesQuery } from '../../../api/sso/company.api'
import { persistor, resetStore } from '../../../app/store'
import { baseApi } from '../../../api/common/baseApi'
import { getCookie, removeCookie } from '../../../utils/cookieHelper'
import { parseJwt, extractRoleFromToken } from '../../../utils/rbac'
import { setCredentials } from '../../auth/authSlice'
import { addAlert } from '../../notifications/notificationSlice'
import { useLogoutApiMutation } from '../../auth/services/authApi'
import { useRoutePath } from "../../../hooks/useRoutePath";
import MarkLogo from '../../../components/common/MarkLogo';

export default function CompanySelect() {
  const { buildPath } = useRoutePath();

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const moduleCode = searchParams.get('module')
  const dispatch = useAppDispatch()
  const reduxCompanyList = useAppSelector((state) => state.company.companyList)
  const currentUser = useAppSelector((state) => state.auth?.user ?? null)
  const [searchTerm, setSearchTerm] = useState('')
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role?.toLowerCase().includes('super')

  const { data: companiesData, isLoading: isAuthLoading } = useGetCompaniesQuery({ page: 0, pageSize: 200 }, {
    skip: !isSuperAdmin
  })
  const { data: openCompanies = [], isLoading: isOpenLoading } = useGetOpenCompaniesQuery(undefined, {
    skip: !!currentUser
  })

  const apiCompanies = companiesData?.companies || []

  const isLoading = isSuperAdmin ? isAuthLoading : (!currentUser ? isOpenLoading : false)

  let companyList = [];
  if (reduxCompanyList && reduxCompanyList.length > 0) {
    companyList = reduxCompanyList;
  } else if (!currentUser) {
    companyList = openCompanies;
  } else if (isSuperAdmin) {
    companyList = apiCompanies.length > 0 ? apiCompanies : reduxCompanyList;
  } else if (currentUser) {
    // For regular users, fall back to their assigned company from their profile session
    companyList = [
      {
        id: currentUser.companyId || currentUser.companyCode || 'unknown',
        name: currentUser.companyName || 'Assigned Company',
        code: currentUser.companyCode || 'unknown',
        active: true
      }
    ];
  }

  const filteredCompanies = companyList.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )


  const handleSelect = async (company) => {
    let activeUser = currentUser;
    if (!activeUser) {
      const cookieToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token');
      if (cookieToken) {
        const decoded = parseJwt(cookieToken);
        if (decoded) {
          const role = extractRoleFromToken(cookieToken, decoded);
          activeUser = { ...decoded, role };
          dispatch(setCredentials({
            user: activeUser,
            permissions: decoded.permissions || decoded.modules || (decoded.moduleName ? [decoded.moduleName] : []) || (role === 'super_admin' ? ['all'] : [])
          }));
        }
      }
    }

    if (!activeUser) {
      const targetModule = (moduleCode === 'accounts' || !moduleCode) ? 'account' : moduleCode;
      // Direct navigation to let the browser handle the 302 redirect natively, avoiding CORS
      window.location.href = `/api/${targetModule}/auth/login?companyCode=${company.code || company.id}`;
      return;
    }

    dispatch(baseApi.util.resetApiState())
    dispatch(setSelectedCompany(company))

    if (moduleCode) {
      const pathMap = {
        accounts: '/account/dashboard',
        crm: '/account/sales-crm',
        sales: '/account/sales-crm',
        inventory: '/account/inventory',
        purchase: '/account/purchases',
        hr: '/account/hr',
        manufacturing: '/account/manufacturing',
      };
      navigate(pathMap[moduleCode] || '/account/dashboard', { replace: true });
    } else {
      dispatch(baseApi.util.resetApiState())
      dispatch(setSelectedCompany(company))

      const userModule = activeUser?.moduleName;
      const userRole = activeUser?.role || (activeUser?.roles && activeUser?.roles[0]);

      if (!isSuperAdmin && userRole !== 'SystemAdmin' && userModule) {
        const modName = userModule.toLowerCase();
        let targetPath = 'dashboard';

        if (modName.includes('account') || modName.includes('finance')) targetPath = 'account/dashboard';
        else if (modName.includes('hr')) targetPath = 'hr/dashboard';
        else if (modName.includes('inventory')) targetPath = 'inventory/dashboard';
        else if (modName.includes('sales') || modName.includes('crm')) targetPath = 'sales-crm/dashboard';
        else if (modName.includes('purchase')) targetPath = 'purchases/dashboard';
        else if (modName.includes('manufacturing')) targetPath = 'manufacturing/dashboard';

        navigate(`/${targetPath}`);
      } else {
        navigate(`/company/${company.id}`);
      }
    }
  }

  const [logoutApi] = useLogoutApiMutation();

  const handleLogout = async () => {
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
    sessionStorage.clear()

    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-white selection:bg-primary-500/30 overflow-hidden">

      {/* ── LEFT PANEL (Branding/Visual) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-zinc-950 flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary-600/20 blur-[96px] mix-blend-screen animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[96px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950"></div>
        </div>

        {/* Logo Area */}
        <div className="relative z-10 mb-2 lg:mb-4">
          <MarkLogo variant="dark" className="w-48 lg:w-[280px] h-auto object-contain object-left" />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg mb-auto mt-auto py-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs lg:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles size={14} className="text-white" />
            <span>Enterprise Resource Planning</span>
          </div>
          <h1 className="text-2xl lg:text-4xl xl:text-5xl font-display font-bold leading-tight tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            The intelligent platform for modern businesses.
          </h1>
          <p className="text-sm lg:text-base text-zinc-400 leading-relaxed mb-6">
            Streamline your operations, manage finances, and empower your workforce with our scalable multi-tenant architecture designed for growth.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Shield size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm lg:text-base mb-0.5">Enterprise-Grade Security</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Your data is protected with industry-leading encryption and role-based access controls across all tenants.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Zap size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm lg:text-base mb-0.5">Lightning Fast Performance</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Built on a modern technology stack to ensure seamless operations and immediate insights even at scale.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-xs text-zinc-500 font-medium pt-2 pb-6">
          © {new Date().getFullYear()} Mark2. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT PANEL (Selection Interface) ── */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col relative overflow-y-auto bg-white">

        {/* Top Bar for Mobile & Logout */}
        <div className="flex items-center justify-between p-6 lg:p-8 shrink-0">
          <div className="lg:hidden">
            <MarkLogo variant="light" className="w-40 h-auto object-contain object-left" />
          </div>

          <div className="ml-auto">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-[11.2px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all duration-300"
              >
                <LogOut size={16} />
                Log Out
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center max-w-lg w-full mx-auto px-6 py-8 sm:px-12 sm:py-12 animate-fade-in-up">

          <div className="space-y-2 mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-zinc-900">
              Select Workspace
            </h2>
            <p className="text-[12px] sm:text-base text-zinc-500 font-medium">
              {currentUser ? `Welcome back, ${currentUser.name}. Choose an enterprise to continue.` : 'Choose an enterprise workspace to log in.'}
            </p>
          </div>

          <div className="relative min-h-[280px] flex flex-col">
            <div className="relative group mb-6">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-zinc-400 group-focus-within:text-primary-600 transition-colors pointer-events-none z-10">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Search workspaces by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-4 bg-zinc-50/80 hover:bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-[12px] font-semibold text-zinc-900 placeholder:text-zinc-400 transition-all duration-300 outline-none shadow-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] space-y-3 pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company)}
                    className="w-full flex items-center justify-between p-4 bg-white border border-zinc-200/80 rounded-2xl hover:border-primary-500/40 hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-all duration-300 group active:scale-[0.98] text-left relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold shrink-0 text-lg border border-primary-100/50 group-hover:bg-primary-100/50 transition-colors">
                        {company?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="truncate">
                        <p className="text-[12.8px] font-bold text-zinc-900 group-hover:text-primary-600 transition-colors truncate">
                          {company.name}
                        </p>
                        <p className="text-[10.4px] font-semibold text-zinc-500 uppercase tracking-wider truncate mt-0.5">
                          Code: {company.code || company.id}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                      <ChevronRight size={18} className="text-zinc-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-16 px-4 flex flex-col items-center justify-center bg-zinc-50/50 rounded-3xl border border-zinc-200/80 border-dashed">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-center mb-5 text-zinc-400">
                    <Search size={26} />
                  </div>
                  <h3 className="text-[12.8px] font-bold text-zinc-900 mb-1.5">No Workspaces Found</h3>
                  <p className="text-zinc-500 text-[11.2px] font-medium max-w-[160px]">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}
            </div>

            {/* Super Admin Console Link */}
            {isSuperAdmin && (
              <div className="mt-8 pt-6 border-t border-zinc-100">
                <button
                  onClick={() => navigate(buildPath('/super-admin/dashboard'))}
                  className="w-full flex justify-center items-center gap-2.5 px-4 py-4 bg-zinc-950 hover:bg-zinc-900 text-white text-[12px] font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-zinc-900/20"
                >
                  <ShieldCheck size={18} />
                  <span>Global Super Admin Console</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
