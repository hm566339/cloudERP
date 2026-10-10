import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Mail,
  Phone,
  CheckCircle2,
  FileText,
  BarChart3,
  X,
  Zap,
  Users,
  Database,
  Lock,
  Copy,
  Check,
  Layers,
  RefreshCw,
  Calculator,
  Boxes,
  ShoppingCart,
  Activity,
  Briefcase,
  ChevronRight,
  Server,
  Headphones,
} from 'lucide-react';
import { useAccessMode } from '../../hooks/useAccessMode';
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans';
import { useAppSelector } from '../../app/hooks';
import { selectAuthContext } from '../../features/auth/authSlice';
import { createSubscriptionCheckout } from '../../api/sso/subscriptionPlan.api';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import OwnerLayout, { useIsOwnerLayout } from '../../layouts/OwnerLayout';

/**
 * Module metadata dictionary mapping backend module keys to human-friendly titles & icons.
 */
const MODULE_METADATA = {
  ACCOUNT: { label: 'Finance & Accounts', icon: Calculator },
  ACCOUNTS: { label: 'Finance & Accounts', icon: Calculator },
  INVENTORY: { label: 'Inventory Management', icon: Boxes },
  CRM: { label: 'Sales & CRM', icon: ShoppingCart },
  WORKFLOW: { label: 'Workflow & Automation', icon: Activity },
  PURCHASES: { label: 'Purchasing & Procurement', icon: Briefcase },
  PURCHASE: { label: 'Purchasing & Procurement', icon: Briefcase },
};

function formatModuleName(rawName) {
  if (!rawName) return 'Core Module';
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_METADATA[upper]?.label || upper.replace(/_/g, ' ');
}

function getModuleIcon(rawName) {
  if (!rawName) return Layers;
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_METADATA[upper]?.icon || Layers;
}

/**
 * Format plan price and billing cadence dynamically based on price, currency, and durationDays.
 */
function formatPlanPricing(price, currency = 'INR', durationDays = 30) {
  const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : `${currency} `);
  const numPrice = Number(price ?? 0);

  if (numPrice === 0) {
    return {
      priceDisplay: `${symbol}0`,
      durationDisplay: durationDays ? `/ ${durationDays} days` : '',
      isFree: true,
    };
  }

  const formattedNum = numPrice.toLocaleString('en-IN');
  let durationLabel = `${durationDays} days`;
  if (durationDays === 365 || durationDays === 366) {
    durationLabel = 'year';
  } else if (durationDays === 30) {
    durationLabel = '30 days';
  } else if (durationDays === 90) {
    durationLabel = 'quarter';
  }

  return {
    priceDisplay: `${symbol}${formattedNum}`,
    durationDisplay: `/ ${durationLabel}`,
    isFree: false,
  };
}

/**
 * Inner component rendering the subscription management content.
 */
function SubscriptionContent() {
  const authContext = useAppSelector(selectAuthContext);
  const {
    organization,
    subscription,
    companies = [],
  } = authContext;

  const {
    status,
    accessMode,
    isReadOnly,
    isBlocked,
    isTrial,
    isActive,
    trialEndsAt,
    daysRemaining,
    planName: currentAccessPlanName,
  } = useAccessMode();

  const {
    plans = [],
    loading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useSubscriptionPlans({ active: true });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();

  // Determine current active plan from authContext or accessMode
  const currentPlanCode = (
    subscription?.planCode ||
    subscription?.code ||
    (isTrial ? '30_DAY_FREE_TRIAL' : '')
  )?.toUpperCase();

  const isCurrentPlan = useCallback((plan) => {
    if (!plan) return false;
    if (subscription?.planId && plan.id === subscription.planId) return true;
    if (plan.code && currentPlanCode && plan.code.toUpperCase() === currentPlanCode) return true;
    if (isTrial && plan.isTrial) return true;
    if (!isTrial && plan.name && currentAccessPlanName && plan.name.toLowerCase() === currentAccessPlanName.toLowerCase()) return true;
    return false;
  }, [subscription?.planId, currentPlanCode, isTrial, currentAccessPlanName]);

  // Current plan object from the dynamic API plans list
  const activePlanObj = useMemo(() => {
    return plans.find(isCurrentPlan) || null;
  }, [plans, isCurrentPlan]);

  const activePlanName = activePlanObj?.name || subscription?.planCode?.replace(/_/g, ' ') || currentAccessPlanName || (isTrial ? '30-Day Free Trial' : 'Enterprise Plan');
  const activePlanDescription = activePlanObj?.description || 'Full platform access including accounting, inventory, CRM, and organization management.';

  // Format pricing of active plan
  const activePlanPricing = useMemo(() => {
    if (activePlanObj) {
      return formatPlanPricing(activePlanObj.price, activePlanObj.currency, activePlanObj.durationDays);
    }
    return formatPlanPricing(0, 'INR', 30);
  }, [activePlanObj]);

  const formattedTrialEndDate = useMemo(() => {
    if (!trialEndsAt) return '—';
    try {
      return new Date(trialEndsAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }, [trialEndsAt]);

  // Dynamic trial progress calculation
  const totalTrialDays = activePlanObj?.durationDays || 30;
  const trialDaysPassed = daysRemaining !== null ? Math.max(0, Math.min(totalTrialDays, totalTrialDays - daysRemaining)) : 0;
  const trialProgressPercent = Math.min(100, Math.round((trialDaysPassed / totalTrialDays) * 100));

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText?.(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenUpgrade = (plan = null) => {
    setSelectedPlanForUpgrade(plan || plans.find(p => !isCurrentPlan(p)) || plans[0] || null);
    setShowUpgradeModal(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async () => {
    const orgId = organization?.id;
    if (!orgId) {
      setCheckoutError('Organization context is missing. Please refresh and try again.');
      return;
    }
    if (!selectedPlanForUpgrade) {
      setCheckoutError('Please select a plan to proceed.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Unable to load Razorpay Checkout SDK. Please verify internet connectivity.');
      }

      const checkoutData = await createSubscriptionCheckout(orgId, {
        planId: selectedPlanForUpgrade.code || selectedPlanForUpgrade.id,
        totalCount: 1,
      });

      if (!checkoutData || !checkoutData.subscriptionId) {
        throw new Error('Server did not return a valid payment authorization ID.');
      }

      const keyId = checkoutData.keyId;
      if (!keyId || typeof keyId !== 'string' || !keyId.trim()) {
        throw new Error('Payment gateway configuration is missing (Razorpay Key ID not configured on the server). Please contact administrator.');
      }

      const options = {
        key: keyId.trim(),
        subscription_id: checkoutData.subscriptionId,
        name: 'Mark2 ERP',
        description: `${selectedPlanForUpgrade.name || 'ERP'} Subscription`,
        currency: checkoutData.currency || selectedPlanForUpgrade.currency || 'INR',
        amount: checkoutData.amount,
        handler: function () {
          setCheckoutSuccess(true);
          setShowUpgradeModal(false);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        prefill: {
          name: orgName,
        },
        theme: {
          color: '#18181b',
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setCheckoutError(resp.error?.description || 'Payment authorization cancelled or failed.');
      });
      rzpInstance.open();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment processing is not currently available for this tier.';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Keyboard shortcut Esc to dismiss modal
  useEffect(() => {
    if (!showUpgradeModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowUpgradeModal(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showUpgradeModal]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">

        {/* ── 1. Page Header (Matching Company Dashboard Style) ── */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <CreditCard size={14} className="text-sky-600" />
              <span>Subscription & Licensing</span>
              {orgCode && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="font-mono text-zinc-600 font-bold">{orgCode}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">
              Subscription & Plan Details
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Review your organization's subscription tier, usage quotas, and access permissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/owner/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Back to Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => handleOpenUpgrade()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Upgrade Plan</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* ── Read-Only or Blocked Notice (if applicable) ── */}
        {isReadOnly && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3.5 shadow-2xs">
            <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">Your free trial has expired</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                This account is currently in <strong>read-only mode</strong>. You can view existing reports and records, but creating or modifying business data requires an active subscription.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenUpgrade()}
              className="ml-auto px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shrink-0 whitespace-nowrap shadow-2xs"
            >
              Upgrade Now
            </button>
          </div>
        )}

        {isBlocked && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3.5 shadow-2xs">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-rose-900">Account Access Restricted</h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                Access to this organization has been paused by the system administrator. Please contact your account executive to restore active access.
              </p>
            </div>
          </div>
        )}

        {/* ── 2. Prominent Current Plan Card (Refined to match Mark2 Design System) ── */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          {/* Card Top Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white relative">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-zinc-300 text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                    Current Plan
                  </span>
                  <span className="text-xs text-zinc-400">
                    Organization: <strong className="text-white capitalize">{orgName}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
                    {activePlanName}
                  </h2>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isTrial
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isActive
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                    }`}
                  >
                    {isTrial ? 'Trial Active' : (status || 'Active')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activePlanDescription}
                </p>

                {/* Trial Countdown Bar */}
                {isTrial && (
                  <div className="pt-2 max-w-md space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-emerald-400" />
                        <span>Trial Validity</span>
                      </span>
                      <span className="font-bold text-white">
                        {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700/60 rounded-full h-2 overflow-hidden border border-zinc-600/40">
                      <div
                        className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, 100 - trialProgressPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10.5px] text-zinc-400">
                      <span>Total: {totalTrialDays} days</span>
                      <span>Valid until: {formattedTrialEndDate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Pricing & CTAs */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                <div className="text-left lg:text-right pb-1">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {activePlanPricing.priceDisplay}
                    <span className="text-xs text-zinc-400 font-sans font-medium ml-1">
                      {activePlanPricing.durationDisplay}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Status: <strong className="text-zinc-200 capitalize">{status.toLowerCase()}</strong> • Mode: <strong className="text-zinc-200">{accessMode}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenUpgrade()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap size={13} className="text-amber-500 fill-amber-500" />
                    <span>Change Plan</span>
                  </button>
                  <a
                    href={`mailto:sales@mark2erp.com?subject=Subscription%20Inquiry%20-%20${encodeURIComponent(orgName)}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail size={13} />
                    <span>Contact Sales</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="p-4 sm:p-5 bg-zinc-50/70 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Assigned Tier</span>
              <span className="font-bold text-zinc-900">{activePlanName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Billing Cadence</span>
              <span className="font-bold text-zinc-900">{activePlanObj?.durationDays ? `${activePlanObj.durationDays} Days` : 'Monthly'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Access Mode</span>
              <span className="inline-flex items-center gap-1 font-bold text-zinc-900">
                <Lock size={11} className={accessMode === 'FULL' ? 'text-emerald-600' : 'text-amber-600'} />
                <span>{accessMode}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Organization Code</span>
              <span className="font-mono font-bold text-zinc-900">{orgCode || 'ORG'}</span>
            </div>
          </div>
        </section>

        {/* ── 3. Usage & Allocation Quotas (Real data only, no fake metrics) ── */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-display font-bold text-zinc-900 tracking-tight">
              Resource Usage & Quotas
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live capacity metrics based on your organization's subscription allocation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Legal Companies (Real data from companies.length) */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Legal Companies</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">{companies.length}</span>
                  <span className="text-xs text-zinc-400 font-medium">Registered</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
                Primary: <strong className="text-zinc-700">{companies[0]?.name || orgName}</strong>
              </p>
            </div>

            {/* Card 2: User Seats (Real context or —) */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">User Seats</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Users size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">—</span>
                  <span className="text-xs text-zinc-400 font-medium">/ Allocated</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                Managed per company workspace
              </p>
            </div>

            {/* Card 3: Document Storage */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Document Storage</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Database size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">—</span>
                  <span className="text-xs text-zinc-400 font-medium">/ Available</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                Invoices, attachments & bills
              </p>
            </div>

            {/* Card 4: Monthly Transactions */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Transactions</span>
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <BarChart3 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-zinc-900">—</span>
                  <span className="text-xs text-zinc-400 font-medium">/ Monthly quota</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                Vouchers, journals & ledger entries
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Available Subscription Plans (100% Dynamic from API) ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-display font-bold text-zinc-900 tracking-tight">
                Available Subscription Plans
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Compare tiers and upgrade to unlock additional business modules and organizational limits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refetchPlans}
                disabled={plansLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
                title="Refresh plans from server"
              >
                <RefreshCw size={12} className={plansLoading ? 'animate-spin' : ''} />
                <span>Sync Plans</span>
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {plansLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-2xs space-y-4 animate-pulse">
                  <div className="h-6 bg-zinc-200/70 rounded-md w-3/4"></div>
                  <div className="h-4 bg-zinc-100 rounded-md w-full"></div>
                  <div className="h-8 bg-zinc-200/70 rounded-md w-1/2 my-3"></div>
                  <div className="space-y-2 pt-3 border-t border-zinc-100">
                    <div className="h-3.5 bg-zinc-100 rounded w-5/6"></div>
                    <div className="h-3.5 bg-zinc-100 rounded w-4/6"></div>
                    <div className="h-3.5 bg-zinc-100 rounded w-3/4"></div>
                  </div>
                  <div className="h-9 bg-zinc-200/70 rounded-xl w-full mt-4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {plansError && !plansLoading && (
            <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3 shadow-2xs">
              <AlertTriangle size={36} className="mx-auto text-rose-500" />
              <h3 className="text-sm font-bold text-rose-800">Unable to load subscription plans.</h3>
              <p className="text-xs text-rose-600 max-w-md mx-auto">
                {plansError}
              </p>
              <button
                type="button"
                onClick={refetchPlans}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!plansLoading && !plansError && plans.length === 0 && (
            <div className="p-8 bg-white rounded-2xl border border-zinc-200 text-center space-y-2 shadow-2xs">
              <Layers size={36} className="mx-auto text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-800">No subscription plans found</h3>
              <p className="text-xs text-zinc-500">
                There are currently no active public subscription plans configured in the system.
              </p>
            </div>
          )}

          {/* Dynamic Plans Grid */}
          {!plansLoading && !plansError && plans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((p) => {
                const current = isCurrentPlan(p);
                const pricing = formatPlanPricing(p.price, p.currency, p.durationDays);
                const modules = Array.isArray(p.modules) ? p.modules : [];

                // Dynamic CTA label based on plan and current subscription
                let ctaText = `Choose ${p.name}`;
                if (current) {
                  ctaText = 'Current Plan';
                } else if (p.isTrial) {
                  ctaText = 'Choose Trial';
                } else {
                  ctaText = `Upgrade to ${p.name}`;
                }

                return (
                  <div
                    key={p.id || p.code}
                    className={`bg-white rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md relative ${
                      current
                        ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                        : 'border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    {/* Current Plan Badge */}
                    {current && (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-emerald-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-full shadow-2xs flex items-center gap-1">
                        <Check size={10} />
                        <span>Current Plan</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Title & Description */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-zinc-900">
                            {p.name}
                          </h3>
                          {p.isTrial && !current && (
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                              Trial
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 min-h-[36px] line-clamp-2 leading-relaxed">
                          {p.description || 'Full platform capabilities and administrative tools.'}
                        </p>
                      </div>

                      {/* Pricing Display */}
                      <div className="pt-2 pb-2 border-y border-zinc-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono">
                            {pricing.priceDisplay}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {pricing.durationDisplay}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 mt-0.5">
                          {p.durationDays ? `${p.durationDays} days duration` : 'Standard cycle'}
                        </p>
                      </div>

                      {/* Plan Limits / Rules Quota */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                        <div>
                          <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block">Companies</span>
                          <span className="font-bold text-zinc-800">
                            {formatPlanLimit(p.maxCompanies, 'companies')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block">Users / Co.</span>
                          <span className="font-bold text-zinc-800">
                            {formatPlanLimit(p.maxUsersPerCompany, 'users')}
                          </span>
                        </div>
                      </div>

                      {/* Included Modules Section */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Included Modules ({modules.length})
                        </span>

                        {modules.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">All core features included</p>
                        ) : (
                          <ul className="space-y-1.5 text-xs text-zinc-700">
                            {modules.map((m, idx) => {
                              const Icon = getModuleIcon(m.moduleName);
                              return (
                                <li key={m.id || idx} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                                    <Icon size={12} />
                                  </div>
                                  <span className="truncate">{formatModuleName(m.moduleName)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA Action Button */}
                    <div className="pt-5 mt-4 border-t border-zinc-100">
                      {current ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-400 cursor-default flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Active Current Plan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenUpgrade(p)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs group"
                        >
                          <span>{ctaText}</span>
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 5. Enterprise Governance & Security Badges ── */}
        <section className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Enterprise Governance & Data Isolation
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Every Mark2 ERP subscription tier includes standard compliance safeguards.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Verified Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Multi-Tenant Data Isolation</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Requests strictly enforce organization and company tenancy boundaries across all databases.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold">
                <Server size={16} className="text-indigo-600" />
                <span>Automated Audit Redundancy</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Immutable financial voucher ledgers and continuous transaction logs ensure compliance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold">
                <Headphones size={16} className="text-sky-600" />
                <span>Executive SLA & Onboarding</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Direct access to accounting engineers for chart of accounts migration and tax configuration.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="border-t border-zinc-200/80 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Mark2 ERP. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Organization: <strong className="text-zinc-600 font-mono">{orgCode || 'ORG'}</strong></span>
            <span>•</span>
            <a href="mailto:support@mark2erp.com" className="hover:text-zinc-600 transition-colors">Enterprise Support</a>
          </div>
        </div>
      </footer>

      {/* ── 6. Upgrade Confirmation Modal (createPortal) ── */}
      {showUpgradeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Dismiss */}
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowUpgradeModal(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-zinc-100 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs">
                  <Sparkles size={18} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Change Subscription Plan</h3>
                  <p className="text-xs text-zinc-500">
                    Organization: <strong className="text-zinc-800 capitalize">{orgName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plan Picker from dynamic plans */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Select Subscription Tier
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlanForUpgrade?.id === p.id || selectedPlanForUpgrade?.code === p.code;
                  const pricing = formatPlanPricing(p.price, p.currency, p.durationDays);
                  return (
                    <div
                      key={p.id || p.code}
                      onClick={() => setSelectedPlanForUpgrade(p)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/10 shadow-2xs'
                          : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{p.name}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-zinc-900" />}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-black text-zinc-900 font-mono">{pricing.priceDisplay}</span>
                        <span className="text-[10px] text-zinc-400">{pricing.durationDisplay}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Plan Details Breakdown */}
            {selectedPlanForUpgrade && (
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="text-xs font-bold text-zinc-900">{selectedPlanForUpgrade.name}</span>
                  <span className="text-xs font-mono font-bold text-zinc-900">
                    {formatPlanPricing(selectedPlanForUpgrade.price, selectedPlanForUpgrade.currency, selectedPlanForUpgrade.durationDays).priceDisplay}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {selectedPlanForUpgrade.description || 'Full platform capabilities and administrative tools.'}
                </p>

                {Array.isArray(selectedPlanForUpgrade.modules) && selectedPlanForUpgrade.modules.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Included Modules
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlanForUpgrade.modules.map((m, idx) => (
                        <span
                          key={m.id || idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-semibold text-zinc-700"
                        >
                          {formatModuleName(m.moduleName)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Alerts */}
            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span className="font-medium">{checkoutError}</span>
              </div>
            )}

            {checkoutSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-medium">Subscription updated! Refreshing your workspace...</span>
              </div>
            )}

            {/* Sales & Assistance Contacts */}
            <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/60 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-600">Need a custom enterprise quote or GST invoice?</span>
              <a
                href="mailto:sales@mark2erp.com"
                className="text-zinc-900 font-bold hover:underline shrink-0"
              >
                sales@mark2erp.com
              </a>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkoutLoading || !selectedPlanForUpgrade}
                onClick={handleRazorpayCheckout}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs"
              >
                <CreditCard size={14} />
                <span>{checkoutLoading ? 'Processing...' : 'Continue to Checkout'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * Main SubscriptionPage export.
 * If user is an Owner and rendered outside OwnerLayout, wraps with OwnerLayout.
 * Otherwise renders content cleanly within the existing layout hierarchy.
 */
export default function SubscriptionPage() {
  const isInsideOwnerLayout = useIsOwnerLayout();
  const authContext = useAppSelector(selectAuthContext);

  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER'));

  if (!isInsideOwnerLayout && isOwner) {
    return (
      <OwnerLayout>
        <SubscriptionContent />
      </OwnerLayout>
    );
  }

  return <SubscriptionContent />;
}
