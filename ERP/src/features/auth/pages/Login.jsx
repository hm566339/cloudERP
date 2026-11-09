import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams, useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowRight,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import { useLoginMutation, useAdminLoginMutation, useLazyGetMeQuery, useLazySsoGetMeQuery, useGetOrganizationQuery } from '../services/authApi';
import { useGetOpenCompaniesQuery } from '../../../api/sso/company.api';
import { setCredentials, selectIsAuthenticated, selectCurrentUser } from '../authSlice';
import { setSelectedCompany, setCompanyList } from '../../company-management/companySlice';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';
import { extractRoleFromToken, parseJwt } from '../../../utils/rbac';
import { getCookie, clearLegacyAuthCookies } from '../../../utils/cookieHelper';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { getSafeErrorMessage } from '../../../utils/apiErrorHelper';
import { normalizeModuleName } from '../../../utils/moduleNormalization';
import { resolveSafeRedirectDestination } from '../../../utils/redirectHelper';

const getModuleName = (code) => {
  if (!code) return 'Portal';
  const map = {
    accounts: 'Accounts',
    crm: 'CRM',
    sales: 'Sales',
    inventory: 'Inventory',
    purchase: 'Purchase',
    hr: 'HR & Payroll',
    manufacturing: 'Manufacturing',
  };
  return map[code] || 'Portal';
};

export default function Login() {
  const { moduleCode, organizationCode, companyCode: routeCompanyCode } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const isOrgMode = Boolean(organizationCode);
  const isCompanyMode = Boolean(routeCompanyCode);

  // Standalone /login is removed. If accessed without organization or company context, redirect to ERP root
  if (!isOrgMode && !isCompanyMode) {
    return <Navigate to="/" replace />;
  }


  // Query organization lookup if in organization mode
  const {
    data: orgLookupData,
    isLoading: isOrgLoading,
    isError: isOrgError,
    error: orgError,
  } = useGetOrganizationQuery(organizationCode, {
    skip: !isOrgMode,
  });

  const orgData = orgLookupData?.data || orgLookupData;
  const isOrgNotFound = isOrgMode && (isOrgError || (orgLookupData && orgLookupData.success === false));

  const [searchParams] = useSearchParams();

  const gotoUrl = searchParams.get('goto');
  const queryCompanyCode = searchParams.get('companyCode');

  const [companyCode, setCompanyCode] = useState(routeCompanyCode || queryCompanyCode || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const dispatch = useDispatch();
  const location = useLocation();

  const getDestination = (defaultPath) => {
    return resolveSafeRedirectDestination({
      searchParams,
      sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : null,
      locationStateFrom: location.state?.from,
      defaultPath,
    });
  };

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const { data: openCompanies = [], isLoading: companiesLoading } = useGetOpenCompaniesQuery(undefined, {
    skip: isAuthenticated || isOrgMode,
  });

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [adminLogin, { isLoading: isAdminLoginLoading }] = useAdminLoginMutation();
  const [triggerGetMe, { isLoading: isGetMeLoading }] = useLazyGetMeQuery();
  const [triggerSsoGetMe] = useLazySsoGetMeQuery();

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const isOwner =
        currentUser.role === 'owner' ||
        currentUser.membership?.memberType?.toUpperCase() === 'OWNER' ||
        currentUser.memberType?.toUpperCase() === 'OWNER';

      const isSuperAdmin =
        currentUser.role === 'super_admin' ||
        currentUser.roles?.some(r => {
          const name = (typeof r === 'string' ? r : r?.name)?.toUpperCase();
          return name === 'SYSTEM_ADMIN' || name === 'SUPER_ADMIN';
        });

      const isAccountant =
        currentUser.role?.toUpperCase() === 'ACCOUNTANT' ||
        currentUser.membership?.role?.toUpperCase() === 'ACCOUNTANT';

      if (isSuperAdmin) {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (isOwner) {
        navigate(getDestination('/owner/dashboard'), { replace: true });
      } else if (isAccountant) {
        navigate(getDestination('/accounts/dashboard'), { replace: true });
      } else {
        navigate(getDestination('/workspace'), { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate, moduleCode]);

  useEffect(() => {
    if (!isOrgMode && openCompanies.length === 1 && !companyCode) {
      setCompanyCode(openCompanies[0].code);
    }
  }, [openCompanies, companyCode, isOrgMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!username || !password) {
        setFormError('Please enter username/email and password.');
        dispatch(addAlert({ type: 'warning', message: 'Please enter username and password' }));
        return;
      }

      // Store intended destination in sessionStorage for AuthCallback to use later
      let destinationUrl = moduleCode ? '/' + moduleCode : '/workspace';
      if (gotoUrl) {
        try {
          const parsed = new URL(gotoUrl);
          destinationUrl = parsed.pathname + parsed.search + parsed.hash;
        } catch {
          destinationUrl = gotoUrl.startsWith('/') ? gotoUrl : '/workspace';
        }
      }
      destinationUrl = destinationUrl.replace(/^(\/erp)+/i, '') || '/workspace';
      sessionStorage.setItem('auth_redirect', destinationUrl);

      // Build payload matching backend LoginRequest contract
      // Global ERP login sends generic ERP frontend host, NOT module-specific backend API
      const genericErpHost = window.location.origin + '/erp';
      const effectiveCompanyCode = (routeCompanyCode || queryCompanyCode || companyCode || '').trim();
      const loginPayload = {
        username: username.trim(),
        password,
        ...(moduleCode ? { moduleCode: normalizeModuleName(moduleCode) } : {}),
        ...(isOrgMode
          ? {
            organizationCode: (orgData?.code || organizationCode).toLowerCase(),
            email: username.trim().includes('@') ? username.trim().toLowerCase() : undefined,
            host: gotoUrl || genericErpHost,
          }
          : {
            companyCode: effectiveCompanyCode,
            host: gotoUrl || genericErpHost,
          }
        ),
      };

      let response = null;

      if (isOrgMode || effectiveCompanyCode) {
        response = await login(loginPayload).unwrap();
      } else {
        // No companyCode provided on global login page:
        // Try adminLogin first for Super Admin / System Admin
        try {
          response = await adminLogin({
            username: username.trim(),
            password,
          }).unwrap();
        } catch (adminErr) {
          // If admin login returned 401 (not authorized for admin login),
          // ask the user to provide their company code for company-level login
          if (adminErr?.status === 401 || adminErr?.data?.message?.toLowerCase().includes('not authorized')) {
            setFormError('Please enter your Company Code to sign in to your workspace.');
            dispatch(addAlert({ type: 'warning', message: 'Please enter your Company Code' }));
            return;
          }
          throw adminErr;
        }
      }

      const loginData = response?.data || response;

      // Handle multi-company requirement from LoginResponse
      if (loginData?.requiresCompanySelection) {
        if (loginData.companies && loginData.companies.length > 0) {
          dispatch(setCompanyList(loginData.companies));
        }
        // Save org code and credentials for CompanySelect to use when calling POST /api/sso/auth/select-company
        const orgCode = loginData.organization?.code || loginData.organization?.id || organizationCode;
        if (orgCode) {
          sessionStorage.setItem('pending_org_code', String(orgCode).toLowerCase());
        }
        sessionStorage.setItem('pending_org_user', username.trim());
        sessionStorage.setItem('pending_org_pass', password);
        navigate('/company-select', { replace: true });
        return;
      }

      // 1. Extract tokens from response body or cookies and save to storage immediately
      let accessToken = loginData?.accessToken || loginData?.access_token || loginData?.token || null;
      let refreshTokenValue = loginData?.refreshToken || loginData?.refresh_token || null;

      if (!accessToken) {
        accessToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token') || null;
      }
      if (!refreshTokenValue) {
        refreshTokenValue = getCookie('ACCESS_TOKEN_REFRESH') || null;
      }

      try {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const secureAttr = isHttps ? '; Secure' : '';
        if (accessToken) {
          document.cookie = `ACCESS_TOKEN=${accessToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
          clearLegacyAuthCookies();
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ACCESS_TOKEN', accessToken);
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('access_token');
            } catch (_) {}
          }
        }
        if (refreshTokenValue) {
          document.cookie = `ACCESS_TOKEN_REFRESH=${refreshTokenValue}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ACCESS_TOKEN_REFRESH', refreshTokenValue);
          }
        }
      } catch (cookieErr) {
        console.error('[Login] Failed to set auth cookies:', cookieErr);
      }

      // 2. Handle redirectUrl (OAuth code flow from backend)
      if (loginData?.redirectUrl) {
        try {
          const urlObj = new URL(loginData.redirectUrl.startsWith('http') ? loginData.redirectUrl : `http://${loginData.redirectUrl}`);
          let targetPath = urlObj.pathname.replace(/^(\/erp)+/i, '') || '/';
          // Never forward generic ERP login flow to module backend endpoints (e.g. /api/account/auth/callback)
          if (targetPath.startsWith('/api/')) {
            console.warn('[Login] Normalizing backend callback path to generic SPA callback:', targetPath);
            targetPath = '/auth/callback';
          }
          navigate(targetPath + urlObj.search + urlObj.hash, { replace: true });
        } catch {
          const codeQuery = loginData.redirectUrl.includes('?') ? loginData.redirectUrl.substring(loginData.redirectUrl.indexOf('?')) : '';
          navigate(`/auth/callback${codeQuery}`, { replace: true });
        }
        return;
      }

      // 3. Fallback: direct session setup if backend returned tokens without redirect
      let finalUser = loginData?.user || {};
      let userRole = 'viewer';
      let mappedPermissions = [];
      let ssoData = null;

      try {
        const meResult = await triggerSsoGetMe().unwrap();
        ssoData = meResult?.data || meResult;
        finalUser = { ...finalUser, ...(ssoData?.user || {}), ...ssoData };
      } catch (meErr) {
        console.warn('Could not fetch SSO profile after login, falling back', meErr);
        try {
          const legacyMe = await triggerGetMe().unwrap();
          finalUser = { ...finalUser, ...(legacyMe?.data || legacyMe) };
        } catch (legacyErr) {}
      }

      const activeToken = accessToken || getCookie('ACCESS_TOKEN') || getCookie('auth_token');
      if (activeToken) {
        const decoded = parseJwt(activeToken);
        if (decoded) {
          finalUser = { ...finalUser, ...decoded };
          userRole = extractRoleFromToken(activeToken, finalUser) || 'viewer';
          mappedPermissions = ssoData?.permissions || decoded.permissions || decoded.modules || finalUser.permissions || (userRole === 'super_admin' ? ['all'] : ['dashboard', moduleCode].filter(Boolean));
        }
      } else {
        userRole = extractRoleFromToken(null, finalUser) || 'viewer';
        mappedPermissions = ssoData?.permissions || finalUser.permissions || (userRole === 'super_admin' ? ['all'] : ['dashboard', moduleCode].filter(Boolean));
      }

      const isSuperAdminRole =
        userRole === 'super_admin' ||
        ssoData?.roles?.some(r => {
          const name = (typeof r === 'string' ? r : r?.name)?.toUpperCase();
          return name === 'SYSTEM_ADMIN' || name === 'SUPER_ADMIN';
        }) ||
        finalUser?.roles?.some(r => {
          const name = (typeof r === 'string' ? r : r?.name)?.toUpperCase();
          return name === 'SYSTEM_ADMIN' || name === 'SUPER_ADMIN';
        });

      if (isSuperAdminRole) {
        userRole = 'super_admin';
      }

      const mergedUser = { ...finalUser, role: userRole };

      if (loginData?.subscription) {
        mergedUser.subscription = loginData.subscription;
      } else {
        const orgCode = mergedUser.organizationCode || orgData?.code || organizationCode;
        if (orgCode && !mergedUser.subscription) {
          try {
            const cachedSub = sessionStorage.getItem(`trial_sub_${orgCode.toLowerCase()}`);
            if (cachedSub) {
              mergedUser.subscription = JSON.parse(cachedSub);
            }
          } catch (e) { }
        }
      }

      dispatch(setCredentials({
        user: mergedUser,
        organization: ssoData?.organization || loginData?.organization,
        currentCompany: ssoData?.currentCompany,
        companies: ssoData?.companies,
        membership: ssoData?.membership,
        subscription: ssoData?.subscription || mergedUser.subscription,
        accessMode: ssoData?.accessMode,
        modules: ssoData?.modules,
        features: ssoData?.features,
        permissions: ssoData?.permissions || mappedPermissions,
      }));

      const resolvedCompId = mergedUser.companyId || ssoData?.currentCompany?.id || mergedUser.companyCode;
      const resolvedCompCode = mergedUser.companyCode || ssoData?.currentCompany?.code;
      const resolvedCompName = mergedUser.companyName || ssoData?.currentCompany?.name || ssoData?.currentCompany?.legalName || 'Assigned Company';

      if (resolvedCompId || resolvedCompCode) {
        dispatch(setSelectedCompany({
          id: resolvedCompId,
          name: resolvedCompName,
          code: resolvedCompCode,
        }));
      } else if (ssoData?.currentCompany) {
        dispatch(setSelectedCompany({
          id: ssoData.currentCompany.id || ssoData.currentCompany.code,
          name: ssoData.currentCompany.name || ssoData.currentCompany.legalName || 'Assigned Company',
          code: ssoData.currentCompany.code,
        }));
      } else if (ssoData?.companies && ssoData.companies.length === 1) {
        dispatch(setSelectedCompany({
          id: ssoData.companies[0].id || ssoData.companies[0].code,
          name: ssoData.companies[0].name || 'Assigned Company',
          code: ssoData.companies[0].code,
        }));
      }

      const isOwnerRole =
        userRole === 'owner' ||
        ssoData?.membership?.memberType?.toUpperCase() === 'OWNER' ||
        mergedUser?.membership?.memberType?.toUpperCase() === 'OWNER';

      const isAccountantRole =
        userRole?.toUpperCase() === 'ACCOUNTANT' ||
        ssoData?.membership?.role?.toUpperCase() === 'ACCOUNTANT' ||
        mergedUser?.membership?.role?.toUpperCase() === 'ACCOUNTANT';

      if (isSuperAdminRole || userRole === 'super_admin') {
        navigate('/super-admin/dashboard', { replace: true });
      } else if (isOwnerRole) {
        navigate(getDestination('/owner/dashboard'), { replace: true });
      } else if (isAccountantRole) {
        navigate(getDestination('/accounts/dashboard'), { replace: true });
      } else {
        navigate(getDestination('/workspace'), { replace: true });
      }

    } catch (err) {
      console.error('Login failed', err);
      let errorMsg = 'Invalid email or password.';

      if (err?.status === 401 || err?.data?.message === 'Invalid credentials') {
        errorMsg = 'Invalid email or password.';
      } else if (err?.status === 403 || err?.data?.message?.toLowerCase().includes('access') || err?.data?.message?.toLowerCase().includes('membership')) {
        errorMsg = "You don't have access to this organization.";
      } else if (err?.status === 404 || err?.data?.message?.toLowerCase().includes('not found')) {
        errorMsg = isCompanyMode ? 'Company not found.' : 'Organization not found.';
      } else {
        errorMsg = getSafeErrorMessage(err, 'Something went wrong. Please try again.');
      }

      setFormError(errorMsg);
      dispatch(addAlert({ type: 'error', message: errorMsg }));
    }
  };

  const moduleName = getModuleName(moduleCode);
  const isLoading = isLoginLoading || isAdminLoginLoading || isGetMeLoading;

  // ── Render: Loading Organization Resolution ──
  if (isOrgMode && isOrgLoading) {
    return (
      <div className="w-full max-w-[368px] mx-auto animate-fade-in-up">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 sm:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-700 dark:text-zinc-300 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Resolving Organization</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Checking organization workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Organization Not Found State ──
  if (isOrgMode && isOrgNotFound) {
    return (
      <div className="w-full max-w-[368px] mx-auto animate-fade-in-up">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-none border border-zinc-100 dark:border-zinc-800 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center mx-auto shadow-sm">
            <Building2 size={26} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Organization Not Found
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              The organization login link is invalid or the organization is no longer available.
            </p>
          </div>
          <div className="pt-2 space-y-2.5">
            <Link
              to="/"
              className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              Back to Home
            </Link>
            <Link
              to="/try-free"
              className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors"
            >
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Start Free Trial</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orgDisplayName = orgData?.name || organizationCode;
  const orgDisplayCode = orgData?.code || organizationCode;

  return (
    <div className="w-full max-w-[368px] mx-auto animate-fade-in-up">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-none border border-zinc-100 dark:border-zinc-800">

        {/* Back Link */}
        <Link
          to={isOrgMode ? buildPath('/try-free') : buildPath('/')}
          title={isOrgMode ? 'Back to Signup' : 'Back to Home'}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
        >
          <ChevronLeft size={20} />
        </Link>

        {/* Title Header */}
        <div className="space-y-3 mb-8">
          {isOrgMode && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-100 dark:border-emerald-800 mb-1">
              <Building2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Organization Owner Portal</span>
            </div>
          )}
          {isCompanyMode && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold border border-indigo-100 dark:border-indigo-800 mb-1">
              <Building2 size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>Company Portal: {routeCompanyCode}</span>
            </div>
          )}
          <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isOrgMode ? 'Owner Sign In' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {isOrgMode ? (
              <>Sign in to organization <span className="text-zinc-900 dark:text-zinc-100 font-bold capitalize">{orgDisplayName}</span> control center</>
            ) : isCompanyMode ? (
              <>Sign in to your account at <span className="text-zinc-900 dark:text-zinc-100 font-bold uppercase">{routeCompanyCode}</span></>
            ) : (
              `Please enter your details to sign in to ${moduleName}.`
            )}
          </p>
        </div>

        {/* In-form error display */}
        {formError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-slide-up">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>

          {/* Email or Username */}
          <div className="space-y-1.5">
            <label className="text-[11.2px] font-bold text-zinc-700 dark:text-zinc-300 block">
              {isOrgMode ? 'Email or Username' : 'Username'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 focus:border-primary focus:ring-primary/20 rounded-2xl text-[12px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
              placeholder={isOrgMode ? 'Enter your email or username' : 'Enter your username'}
              autoComplete="username"
            />
          </div>

          {/* Optional Company Code (for company users on global login) */}
          {!isOrgMode && !isCompanyMode && (
            <div className="space-y-1.5">
              <label className="text-[11.2px] font-bold text-zinc-700 dark:text-zinc-300 block">
                Company Code <span className="text-zinc-400 dark:text-zinc-500 font-normal">(Optional for Admin)</span>
              </label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3.5 bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 focus:border-primary focus:ring-primary/20 rounded-2xl text-[12px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all uppercase placeholder:normal-case"
                placeholder="e.g. MOHIT, KASERA (leave blank for Admin)"
                autoComplete="organization"
              />
            </div>
          )}

          {/* Password with Visibility Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11.2px] font-bold text-zinc-700 dark:text-zinc-300 block">Password</label>
              <Link
                to={buildPath('/forgot-password')}
                className="text-[10.4px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-11 bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 focus:border-primary focus:ring-primary/20 rounded-2xl text-[12px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-4 py-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[12.8px] font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-xl shadow-zinc-900/20 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed group mt-7"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 dark:border-zinc-900/40 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Organization Information Badge */}
        {isOrgMode && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">Organization</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold capitalize">{orgDisplayName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
              <span>Code</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300 font-bold uppercase">{orgDisplayCode}</span>
            </div>
          </div>
        )}

        {/* Company Portal Information Badge */}
        {isCompanyMode && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">Company Workspace</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold uppercase">{routeCompanyCode}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
