import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { KeyRound, Mail, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react'

import { useAdminLoginMutation, useLazySsoGetMeQuery } from '../services/authApi'
import { setCredentials, selectIsAuthenticated, selectCurrentUser } from '../authSlice'
import { addAlert } from '../../notifications/notificationSlice'
import { extractRoleFromToken } from '../../../utils/rbac'
import { clearSelectedCompany } from '../../company-management/companySlice'
import { useRoutePath } from "../../../hooks/useRoutePath";

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

export default function AdminLogin() {
  const { buildPath } = useRoutePath();

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)

  const [adminLogin, { isLoading }] = useAdminLoginMutation()
  const [triggerSsoGetMe, { isLoading: isGetMeLoading }] = useLazySsoGetMeQuery()

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'super_admin') {
        navigate('/super-admin/dashboard', { replace: true })
      } else if (currentUser.companyCode || currentUser.companyId) {
        navigate(`/company/${currentUser.companyCode || currentUser.companyId}`, { replace: true })
      } else {
        navigate('/company-select', { replace: true })
      }
    }
  }, [isAuthenticated, currentUser, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (formData) => {
    try {
      // Backend expects { data: { username, password } } per SSOapi
      // authApi.js automatically wraps this in { data: credentials }
      const response = await adminLogin({
        username: formData.username,
        password: formData.password,
      }).unwrap();

      const accessToken = response?.accessToken || response?.access_token || response?.token || null;
      const refreshTokenValue = response?.refreshToken || response?.refresh_token || null;

      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secureAttr = isHttps ? '; Secure' : '';
      if (accessToken) {
        document.cookie = `ACCESS_TOKEN=${accessToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
        document.cookie = `auth_token=${accessToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ACCESS_TOKEN', accessToken);
          localStorage.setItem('auth_token', accessToken);
        }
      }
      if (refreshTokenValue) {
        document.cookie = `ACCESS_TOKEN_REFRESH=${refreshTokenValue}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ACCESS_TOKEN_REFRESH', refreshTokenValue);
        }
      }

      // If mid-chain SSO
      if (response?.redirectUrl) {
        let finalRedirect = response.redirectUrl;
        if (finalRedirect.startsWith(window.location.origin)) {
          finalRedirect = finalRedirect.replace(window.location.origin, '');
        }
        finalRedirect = finalRedirect.replace(/^(\/erp)+/i, '') || '/';
        navigate(finalRedirect, { replace: true });
        return;
      }

      let finalUser = null;
      try {
        const meResult = await triggerSsoGetMe().unwrap();
        finalUser = meResult?.data || meResult;
      } catch (meErr) {
        // Fallback to credentials / response payload if /me query fails
      }

      if (!finalUser) {
        finalUser = response?.user || response?.data || { username: formData.username, email: formData.username, role: 'super_admin' };
      }

      const userRole = extractRoleFromToken(accessToken, finalUser) || finalUser.role || 'super_admin';
      const mappedPermissions = finalUser.permissions || (userRole === 'super_admin' ? ['all'] : ['dashboard']);

      const mergedUser = { ...finalUser, role: userRole };

      // Ensure no company is selected from previous logins
      dispatch(clearSelectedCompany());

      dispatch(setCredentials({
        user: mergedUser,
        permissions: mappedPermissions
      }));

      dispatch(addAlert({ type: 'success', message: `Welcome back, Super Admin!` }))
      navigate('/super-admin/dashboard', { replace: true });

    } catch (error) {
      console.error("API Admin Login failed.", error)
      dispatch(addAlert({ type: 'error', message: error?.data?.message || error.message || 'Login failed. Please check credentials.' }))
    }
  }

  const loading = isLoading || isGetMeLoading;

  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-lg mx-auto animate-fade-in-up relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="space-y-3 mb-10 text-center relative z-10 mt-2">
        <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 rounded-2xl mb-2">
          <ShieldAlert size={24} className="text-rose-600" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight leading-tight pt-1">
          Super Admin
        </h2>
        <p className="text-[12px] text-zinc-500 font-medium">Sign in to the administration console.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
        {/* Username Field */}
        <div className="space-y-2">
          <label className="text-[11.2px] font-bold text-zinc-700 block">Username</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-rose-500 transition-colors pointer-events-none z-10">
              <Mail size={20} />
            </span>
            <input
              type="text"
              {...register('username')}
              placeholder="superadmin"
              className={`w-full pl-12 pr-4 py-4 bg-white/50 hover:bg-white border ${errors.username ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-rose-500 focus:ring-rose-500/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.username && <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in flex items-center gap-1.5"><ShieldAlert size={14} />{errors.username.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11.2px] font-bold text-zinc-700 block">Password</label>
          </div>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-rose-500 transition-colors pointer-events-none z-10">
              <KeyRound size={20} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-4 bg-white/50 hover:bg-white border ${errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-rose-500 focus:ring-rose-500/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors z-10"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in flex items-center gap-1.5"><ShieldAlert size={14} />{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-10 flex justify-center items-center gap-2 px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-[12.8px] font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-xl shadow-zinc-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Sign in as Admin</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <Link to={buildPath('/login')} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[11.2px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200/50">
            Return to Standard Login
          </Link>
        </div>
      </form>
    </div>
  )
}
