import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { User, Mail, KeyRound, Eye, EyeOff, Building2, UserCircle, Briefcase, Hash, ArrowRight, ShieldAlert } from 'lucide-react'
import { addAlert } from '../../notifications/notificationSlice'
import { register as registerApi } from '../../../api/sso/auth'
import { useRoutePath } from "../../../hooks/useRoutePath";
import { selectIsAuthenticated, selectCurrentUser } from '../authSlice';
import { getPostLoginRedirectPath } from '../../../utils/moduleAccess';

const registerSchema = yup.object().shape({
  fullName: yup.string().required('Full Name is required'),
  empId: yup.string().required('Employee ID is required'),
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  companyCode: yup.string().required('Company Code is required'),
  role: yup.string().required('Role is required'),
  module: yup.string().optional(),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export default function Register() {
  const { buildPath } = useRoutePath();

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const destination = getPostLoginRedirectPath({ user: currentUser });
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const payload = { ...data, host: window.location.origin };
      await registerApi(payload)
      dispatch(addAlert({ type: 'success', message: 'Registration successful! You can now log in.' }))
      navigate(buildPath('/login'))
    } catch (error) {
      console.error("API Registration failed.", error)
      let errorMessage = error?.data?.message || error.message || 'Registration failed. Please check your details.';
      if (error?.data?.data && typeof error.data.data === 'object') {
        const validationErrors = Object.values(error.data.data).join(', ');
        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }
      dispatch(addAlert({ type: 'error', message: errorMessage }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-lg mx-auto animate-fade-in-up relative overflow-hidden my-8">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <div className="space-y-3 mb-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight leading-tight">
          Create Account
        </h2>
        <p className="text-[12px] text-zinc-500 font-medium">Enter your details to register.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
        
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-[10.4px] font-bold text-zinc-700 block">Full Name *</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <UserCircle size={18} />
            </span>
            <input
              type="text"
              {...register('fullName')}
              placeholder="John Doe"
              className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.fullName ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.fullName && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.fullName.message}</p>}
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[10.4px] font-bold text-zinc-700 block">Username *</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <User size={18} />
            </span>
            <input
              type="text"
              {...register('username')}
              placeholder="johndoe"
              className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.username ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.username && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.username.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[10.4px] font-bold text-zinc-700 block">Email Address *</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <Mail size={18} />
            </span>
            <input
              type="email"
              {...register('email')}
              placeholder="user@example.com"
              className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.email && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.email.message}</p>}
        </div>

        {/* Employee ID & Company Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10.4px] font-bold text-zinc-700 block">Employee ID *</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <Hash size={18} />
              </span>
              <input
                type="text"
                {...register('empId')}
                placeholder="EMP-01"
                className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.empId ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
              />
            </div>
            {errors.empId && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.empId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10.4px] font-bold text-zinc-700 block">Company Code *</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <Building2 size={18} />
              </span>
              <input
                type="text"
                {...register('companyCode')}
                placeholder="COMP1"
                className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.companyCode ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
              />
            </div>
            {errors.companyCode && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.companyCode.message}</p>}
          </div>
        </div>

        {/* Role & Module */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10.4px] font-bold text-zinc-700 block">Role *</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <ShieldAlert size={18} />
              </span>
              <input
                type="text"
                {...register('role')}
                placeholder="employee"
                className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border ${errors.role ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
              />
            </div>
            {errors.role && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.role.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10.4px] font-bold text-zinc-700 block">Module (Optional)</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <Briefcase size={18} />
              </span>
              <input
                type="text"
                {...register('module')}
                placeholder="Finance"
                className={`w-full pl-11 pr-4 py-3 bg-white/50 hover:bg-white border border-zinc-200/80 focus:border-primary focus:ring-primary/20 rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[10.4px] font-bold text-zinc-700 block">Password *</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <KeyRound size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className={`w-full pl-11 pr-11 py-3 bg-white/50 hover:bg-white border ${errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-xl text-[11.2px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-[9.6px] text-rose-500 font-medium mt-1 animate-fade-in">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 flex justify-center items-center gap-2 px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-bold rounded-xl transition-all duration-300 active:scale-[0.98] shadow-xl shadow-zinc-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-zinc-300 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Register Account</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
          <span className="text-[11.2px] text-zinc-500 font-medium">Already have an account? </span>
          <Link to={buildPath('/login')} className="text-[11.2px] font-bold text-primary hover:text-primary-hover transition-colors">
            Log in here
          </Link>
        </div>
      </form>
    </div>
  )
}
