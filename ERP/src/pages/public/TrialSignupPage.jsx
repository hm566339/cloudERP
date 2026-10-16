import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { organizationSignup } from '../../api/sso/auth';
import { getSafeErrorMessage } from '../../utils/apiErrorHelper';
import MarkLogo from '../../components/common/MarkLogo';

const signupSchema = yup.object().shape({
  fullName: yup
    .string()
    .trim()
    .required('Full Name is required')
    .max(255, 'Full Name must not exceed 255 characters'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  organizationName: yup
    .string()
    .trim()
    .required('Organization / Business name is required')
    .max(255, 'Organization name must not exceed 255 characters'),
  companyName: yup
    .string()
    .trim()
    .required('Company name is required')
    .max(255, 'Company name must not exceed 255 characters'),
  companyCode: yup
    .string()
    .trim()
    .required('Company code is required')
    .matches(/^[A-Za-z0-9_-]+$/, 'Company code must contain only uppercase alphanumeric characters, hyphens or underscores')
    .max(100, 'Company code must not exceed 100 characters'),
  baseCurrency: yup
    .string()
    .trim()
    .required('Base currency is required')
    .max(3, 'Base currency must be 3 letters (e.g. INR)'),
  // Optional company fields
  legalName: yup.string().trim().max(255).optional(),
  gstin: yup.string().trim().max(15).optional(),
  pan: yup.string().trim().max(10).optional(),
  phone: yup
    .string()
    .trim()
    .test('phone-format', 'Phone number must contain 10 to 15 digits', (val) => {
      if (!val) return true;
      return /^[0-9]{10,15}$/.test(val);
    })
    .optional(),
  city: yup.string().trim().max(100).optional(),
  state: yup.string().trim().max(100).optional(),
  country: yup.string().trim().max(100).optional(),
});

export default function TrialSignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [signupSuccessData, setSignupSuccessData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLoginUrl, setCopiedLoginUrl] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
      companyName: '',
      companyCode: '',
      baseCurrency: 'INR',
      legalName: '',
      gstin: '',
      pan: '',
      phone: '',
      city: '',
      state: '',
      country: 'India',
    },
  });

  const watchCompanyName = watch('companyName');
  const watchCompanyCode = watch('companyCode');

  // Auto-generate company code suggestion if companyCode is empty or follows previous auto-suggestion
  const handleCompanyNameChange = (e) => {
    const val = e.target.value;
    setValue('companyName', val, { shouldValidate: true });

    // Derive uppercase alphanumeric candidate
    const codeCandidate = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const prevCandidate = watchCompanyName?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

    if (!watchCompanyCode || watchCompanyCode === prevCandidate) {
      setValue('companyCode', codeCandidate, { shouldValidate: false });
    }
  };

  const onSubmit = async (formData) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        organizationName: formData.organizationName.trim(),
        company: {
          companyName: formData.companyName.trim(),
          companyCode: formData.companyCode.trim().toUpperCase(),
          baseCurrency: formData.baseCurrency.trim().toUpperCase(),
          ...(formData.legalName ? { legalName: formData.legalName.trim() } : {}),
          ...(formData.gstin ? { gstin: formData.gstin.trim().toUpperCase() } : {}),
          ...(formData.pan ? { pan: formData.pan.trim().toUpperCase() } : {}),
          ...(formData.phone ? { phone: formData.phone.trim() } : {}),
          ...(formData.city ? { city: formData.city.trim() } : {}),
          ...(formData.state ? { state: formData.state.trim() } : {}),
          ...(formData.country ? { country: formData.country.trim() } : {}),
          active: true,
        },
      };

      const response = await organizationSignup(payload);
      if (response?.success && response?.data) {
        const sub = response.data.subscription;
        const orgCode = response.data.organization?.organizationCode;
        if (sub && orgCode) {
          try {
            sessionStorage.setItem(`trial_sub_${orgCode.toLowerCase()}`, JSON.stringify(sub));
          } catch (e) {}
        }
        setSignupSuccessData(response.data);
      } else if (response?.data) {
        const sub = response.data.subscription;
        const orgCode = response.data.organization?.organizationCode;
        if (sub && orgCode) {
          try {
            sessionStorage.setItem(`trial_sub_${orgCode.toLowerCase()}`, JSON.stringify(sub));
          } catch (e) {}
        }
        setSignupSuccessData(response.data);
      } else {
        setServerError(response?.message || 'Signup completed, but response was unexpected.');
      }
    } catch (err) {
      console.error('Trial signup error:', err);
      const safeMsg = getSafeErrorMessage(err, 'Failed to complete signup. Please verify your details.');
      setServerError(safeMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text, type = 'code') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLoginUrl(true);
        setTimeout(() => setCopiedLoginUrl(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 relative flex flex-col justify-between font-sans selection:bg-primary/20 selection:text-zinc-900 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/5 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <MarkLogo
              variant="light"
              alt="Mark2 ERP"
              className="h-9 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-zinc-500 border-l border-zinc-200 pl-3">
              30-Day Free Trial
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:inline">Already have an account?</span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {signupSuccessData ? (
            /* ── Success Screen ── */
            <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_12px_40px_rgb(0,0,0,0.06)] rounded-3xl p-8 sm:p-12 animate-fade-in-up">
              <div className="text-center space-y-3 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 tracking-tight">
                  Your Account is Ready!
                </h1>
                <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Your 30-day free trial has been created. Your enterprise organization and primary company are active and ready.
                </p>
              </div>

              {/* Account Provisioning Summary (from real OrganizationSignupResponse) */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-6 space-y-4 mb-8">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 text-xs">
                  <span className="text-zinc-500 font-medium">Trial Plan Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full uppercase text-[10px] tracking-wide">
                    <Sparkles size={11} /> {signupSuccessData?.subscription?.status || 'TRIALING'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block font-medium mb-1">Organization</span>
                    <span className="text-zinc-900 font-bold text-sm block">
                      {signupSuccessData?.organization?.name || 'Your Organization'}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      Code: {signupSuccessData?.organization?.code || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block font-medium mb-1">Primary Company</span>
                    <span className="text-zinc-900 font-bold text-sm block">
                      {signupSuccessData?.company?.name || 'Your Company'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-zinc-500 font-mono text-[11px]">
                        Code: {signupSuccessData?.company?.code || '—'}
                      </span>
                      {signupSuccessData?.company?.code && (
                        <button
                          type="button"
                          onClick={() => handleCopy(signupSuccessData?.company?.code, 'code')}
                          title="Copy Company Code"
                          aria-label="Copy Company Code"
                          className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        >
                          {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {signupSuccessData?.subscription?.trialEndsAt && (
                  <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Trial Expiration Date:</span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(signupSuccessData.subscription.trialEndsAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {/* Organization-specific login URL if provided by backend */}
                {signupSuccessData?.login?.url && (
                  <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500 space-y-1">
                    <span className="text-zinc-400 block font-medium">Organization Login Portal:</span>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200">
                      <span className="font-mono text-zinc-800 text-[10px] truncate max-w-[280px]">
                        {signupSuccessData.login.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(signupSuccessData.login.url, 'url')}
                        aria-label="Copy Login URL"
                        className="text-zinc-400 hover:text-zinc-700 p-0.5 ml-2"
                      >
                        {copiedLoginUrl ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = signupSuccessData?.login?.url;
                    if (loginUrl) {
                      try {
                        const parsed = new URL(loginUrl.startsWith('http') ? loginUrl : `${window.location.origin}${loginUrl}`);
                        navigate(parsed.pathname + parsed.search + parsed.hash);
                        return;
                      } catch {
                        if (loginUrl.startsWith('/')) {
                          navigate(loginUrl);
                          return;
                        }
                      }
                    }
                    if (signupSuccessData?.organization?.code) {
                      navigate(`/o/${signupSuccessData.organization.code}/login`);
                      return;
                    }
                    navigate('/login');
                  }}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm group"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-zinc-400">
                  Sign in with your credentials to access your organization workspace and company ({signupSuccessData?.company?.code || 'primary company'}).
                </p>
              </div>
            </div>
          ) : (
            /* ── Trial Signup Form ── */
            <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_12px_40px_rgb(0,0,0,0.06)] rounded-3xl p-6 sm:p-10 animate-fade-in-up">
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold mb-1">
                  <Sparkles size={13} className="text-emerald-600" />
                  <span>30-Day Free Trial • Instant Organization Setup</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 tracking-tight">
                  Start Your 30-Day Free Trial
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                  Set up your organization and first company in seconds. No credit card required to get started.
                </p>
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-slide-up"
                >
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{serverError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* ── SECTION 1: Your Account ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <User size={16} className="text-zinc-700" />
                    <h2 className="text-sm font-bold text-zinc-900">1. Your Administrator Account</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label htmlFor="signup-fullName" className="text-xs font-semibold text-zinc-700 block">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                          <User size={15} />
                        </span>
                        <input
                          id="signup-fullName"
                          type="text"
                          {...register('fullName')}
                          disabled={isSubmitting}
                          placeholder="e.g. Rahul Sharma"
                          aria-invalid={!!errors.fullName}
                          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                          className={`w-full pl-9 pr-3 py-2 bg-white border ${errors.fullName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                        />
                      </div>
                      {errors.fullName && (
                        <p id="fullName-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label htmlFor="signup-email" className="text-xs font-semibold text-zinc-700 block">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                          <Mail size={15} />
                        </span>
                        <input
                          id="signup-email"
                          type="email"
                          {...register('email')}
                          disabled={isSubmitting}
                          placeholder="you@company.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          className={`w-full pl-9 pr-3 py-2 bg-white border ${errors.email ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                        />
                      </div>
                      {errors.email && (
                        <p id="email-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div className="space-y-1">
                      <label htmlFor="signup-password" className="text-xs font-semibold text-zinc-700 block">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                          <Lock size={15} />
                        </span>
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          disabled={isSubmitting}
                          placeholder="Min. 8 characters"
                          aria-invalid={!!errors.password}
                          aria-describedby={errors.password ? 'password-error' : undefined}
                          className={`w-full pl-9 pr-9 py-2 bg-white border ${errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p id="password-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label htmlFor="signup-confirmPassword" className="text-xs font-semibold text-zinc-700 block">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                          <Lock size={15} />
                        </span>
                        <input
                          id="signup-confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          disabled={isSubmitting}
                          placeholder="Re-enter password"
                          aria-invalid={!!errors.confirmPassword}
                          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                          className={`w-full pl-9 pr-9 py-2 bg-white border ${errors.confirmPassword ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle confirm password visibility"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p id="confirmPassword-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: Organization / Business ── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <Building2 size={16} className="text-zinc-700" />
                    <h2 className="text-sm font-bold text-zinc-900">2. Organization & Business Details</h2>
                  </div>

                  {/* Organization Name */}
                  <div className="space-y-1">
                    <label htmlFor="signup-organizationName" className="text-xs font-semibold text-zinc-700 block">
                      Organization / Business Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                        <Building2 size={15} />
                      </span>
                      <input
                        id="signup-organizationName"
                        type="text"
                        {...register('organizationName')}
                        disabled={isSubmitting}
                        placeholder="e.g. Apex Global Enterprises"
                        aria-invalid={!!errors.organizationName}
                        aria-describedby={errors.organizationName ? 'orgName-error' : undefined}
                        className={`w-full pl-9 pr-3 py-2 bg-white border ${errors.organizationName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                      />
                    </div>
                    {errors.organizationName ? (
                      <p id="orgName-error" className="text-[11px] text-rose-600 font-medium">
                        {errors.organizationName.message}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400">
                        Top-level enterprise tenant that holds your companies and user accounts.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── SECTION 3: First Company ── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <Briefcase size={16} className="text-zinc-700" />
                    <h2 className="text-sm font-bold text-zinc-900">3. Primary Company Unit</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-1">
                      <label htmlFor="signup-companyName" className="text-xs font-semibold text-zinc-700 block">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="signup-companyName"
                        type="text"
                        {...register('companyName')}
                        onChange={handleCompanyNameChange}
                        disabled={isSubmitting}
                        placeholder="e.g. Apex India Pvt Ltd"
                        aria-invalid={!!errors.companyName}
                        aria-describedby={errors.companyName ? 'compName-error' : undefined}
                        className={`w-full px-3 py-2 bg-white border ${errors.companyName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                      />
                      {errors.companyName && (
                        <p id="compName-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>

                    {/* Company Code */}
                    <div className="space-y-1">
                      <label htmlFor="signup-companyCode" className="text-xs font-semibold text-zinc-700 block">
                        Company Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="signup-companyCode"
                        type="text"
                        {...register('companyCode')}
                        disabled={isSubmitting}
                        placeholder="e.g. APEX01"
                        aria-invalid={!!errors.companyCode}
                        aria-describedby={errors.companyCode ? 'compCode-error' : undefined}
                        className={`w-full px-3 py-2 bg-white font-mono uppercase border ${errors.companyCode ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'} rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all`}
                      />
                      {errors.companyCode ? (
                        <p id="compCode-error" className="text-[11px] text-rose-600 font-medium">
                          {errors.companyCode.message}
                        </p>
                      ) : (
                        <p className="text-[10px] text-zinc-400">Used for tenant login and company identification.</p>
                      )}
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="signup-baseCurrency" className="text-xs font-semibold text-zinc-700 block">
                        Base Currency <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="signup-baseCurrency"
                          {...register('baseCurrency')}
                          disabled={isSubmitting}
                          aria-invalid={!!errors.baseCurrency}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                        >
                          <option value="INR">INR — Indian Rupee (₹)</option>
                          <option value="USD">USD — US Dollar ($)</option>
                          <option value="EUR">EUR — Euro (€)</option>
                          <option value="GBP">GBP — British Pound (£)</option>
                          <option value="AED">AED — UAE Dirham</option>
                          <option value="SGD">SGD — Singapore Dollar</option>
                        </select>
                      </div>
                      {errors.baseCurrency && (
                        <p className="text-[11px] text-rose-600 font-medium">{errors.baseCurrency.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="signup-legalName" className="text-xs font-semibold text-zinc-700 block">
                        Legal Business Name <span className="text-zinc-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="signup-legalName"
                        type="text"
                        {...register('legalName')}
                        disabled={isSubmitting}
                        placeholder="Registered legal entity name"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                      />
                    </div>
                  </div>

                  {/* Optional Details Collapsible Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      {showOptionalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{showOptionalDetails ? 'Hide' : 'Add'} Tax & Location Details (Optional)</span>
                    </button>

                    {showOptionalDetails && (
                      <div className="mt-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="signup-gstin" className="text-[11px] font-semibold text-zinc-700 block">
                              GSTIN
                            </label>
                            <input
                              id="signup-gstin"
                              type="text"
                              {...register('gstin')}
                              disabled={isSubmitting}
                              placeholder="22AAAAA0000A1Z5"
                              className="w-full px-3 py-1.5 bg-white font-mono uppercase border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="signup-pan" className="text-[11px] font-semibold text-zinc-700 block">
                              PAN
                            </label>
                            <input
                              id="signup-pan"
                              type="text"
                              {...register('pan')}
                              disabled={isSubmitting}
                              placeholder="AAAAA0000A"
                              className="w-full px-3 py-1.5 bg-white font-mono uppercase border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="signup-phone" className="text-[11px] font-semibold text-zinc-700 block">
                              Phone
                            </label>
                            <input
                              id="signup-phone"
                              type="text"
                              {...register('phone')}
                              disabled={isSubmitting}
                              placeholder="10-15 digits"
                              aria-invalid={!!errors.phone}
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                            {errors.phone && (
                              <p className="text-[10px] text-rose-600 font-medium">{errors.phone.message}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="signup-city" className="text-[11px] font-semibold text-zinc-700 block">
                              City
                            </label>
                            <input
                              id="signup-city"
                              type="text"
                              {...register('city')}
                              disabled={isSubmitting}
                              placeholder="e.g. Mumbai"
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="signup-state" className="text-[11px] font-semibold text-zinc-700 block">
                              State
                            </label>
                            <input
                              id="signup-state"
                              type="text"
                              {...register('state')}
                              disabled={isSubmitting}
                              placeholder="e.g. Maharashtra"
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all shadow-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Start 30-Day Free Trial</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-600" /> Enterprise-grade security
                    </span>
                    <span>•</span>
                    <span>No credit card required to get started</span>
                    <span>•</span>
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-200/80 bg-white/60 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Mark2 ERP Platform. All rights reserved.
      </footer>
    </div>
  );
}
