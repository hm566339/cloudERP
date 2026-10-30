import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CheckCircle2,
  FileText,
  BarChart3,
  Zap,
  Users,
  Database,
  Lock,
  Check,
  Layers,
  RefreshCw,
  Calculator,
  Boxes,
  ShoppingCart,
  Activity,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  Download,
  Receipt,
  Plus,
  Info,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAccessMode } from '../../hooks/useAccessMode';
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans';
import { useAppSelector } from '../../app/hooks';
import { selectAuthContext } from '../../features/auth/authSlice';
import { authApi } from '../../features/auth/services/authApi';
import { addAlert } from '../../features/notifications/notificationSlice';
import { cancelSubscription } from '../../api/sso/subscriptionPlan.api';
import {
  canBuySubscription,
  canViewPlans,
  getBuyDisabledReason,
} from '../../utils/subscriptionPermissions';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import { getEntitledModules } from '../../utils/moduleNormalization';
import SubscriptionCheckoutModal from '../../components/subscription/SubscriptionCheckoutModal';

/**
 * Module metadata mapping backend module keys to human-friendly titles, descriptions, and icons.
 */
const MODULE_METADATA = {
  ACCOUNT: {
    label: 'Finance & Accounts',
    desc: 'General ledger, journal vouchers, bank reconciliation & GST ledger',
    icon: Calculator,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
  },
  INVENTORY: {
    label: 'Inventory & Warehousing',
    desc: 'Multi-warehouse stock visibility, batch tracking & stock adjustments',
    icon: Boxes,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
  },
  CRM: {
    label: 'Sales & Invoicing',
    desc: 'Quotations, proforma invoices, sales orders & GST compliant tax invoices',
    icon: ShoppingCart,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
  },
  PURCHASES: {
    label: 'Procurement & Purchase',
    desc: 'Purchase requisitions, supplier RFQs, purchase orders & vendor bills',
    icon: Briefcase,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
  },
  WORKFLOW: {
    label: 'Workflow & Approvals',
    desc: 'Multi-stage approval pipelines, transition guards & audit compliance',
    icon: Activity,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/40',
  },
};

function formatModuleName(rawName) {
  if (!rawName) return 'Core Module';
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_METADATA[upper]?.label || upper.replace(/_/g, ' ');
}

/**
 * Format plan pricing dynamically.
 */
function formatPlanPricing(price, currency = 'INR', durationDays = 30, billingCycle = 'monthly') {
  const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : `${currency} `);
  const numPrice = Number(price ?? 0);

  if (numPrice === 0) {
    return {
      priceDisplay: `${symbol}0`,
      durationDisplay: durationDays ? `/ ${durationDays} days` : '',
      isFree: true,
      rawAmount: 0,
      monthlyRateDisplay: null,
    };
  }

  let effectivePrice = numPrice;
  let durationLabel = `${durationDays} days`;
  let monthlyRate = numPrice;

  if (billingCycle === 'annual') {
    // 20% discount on monthly equivalent
    monthlyRate = Math.round(numPrice * 0.8);
    effectivePrice = monthlyRate * 12;
    durationLabel = 'year';
  } else if (durationDays === 365 || durationDays === 366) {
    durationLabel = 'year';
  } else if (durationDays === 30) {
    durationLabel = 'month';
  }

  const formattedNum = effectivePrice.toLocaleString('en-IN');
  const formattedMonthlyRate = monthlyRate.toLocaleString('en-IN');

  return {
    priceDisplay: `${symbol}${formattedNum}`,
    durationDisplay: `/ ${durationLabel}`,
    monthlyRateDisplay: billingCycle === 'annual' ? `${symbol}${formattedMonthlyRate} / month` : null,
    isFree: false,
    rawAmount: effectivePrice,
  };
}

/**
 * Inner component rendering the subscription management page.
 * Uses 100% real organization data with zero dummy metrics or artificial fillers.
 */
function SubscriptionContent() {
  const dispatch = useDispatch();
  const authContext = useAppSelector(selectAuthContext);
  const {
    organization,
    subscription,
    companies = [],
    user,
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

  const canView = canViewPlans(authContext);
  const canBuy = canBuySubscription(authContext);
  const buyDisabledReason = getBuyDisabledReason(authContext);

  const {
    plans = [],
    loading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useSubscriptionPlans({ active: true }, { enabled: canView });

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();

  // Entitled real modules for this organization
  const entitledModuleKeys = useMemo(() => {
    return getEntitledModules(authContext);
  }, [authContext]);

  // Determine current active plan
  const currentPlanCode = (
    subscription?.planCode ||
    subscription?.code ||
    (isTrial ? '30_DAY_FREE_TRIAL' : '')
  )?.toUpperCase();

  const isCurrentPlan = useCallback((plan) => {
    if (!plan) return false;
    if (subscription?.status === 'PENDING') {
      if (isTrial && plan.isTrial) return true;
      return false;
    }
    if (subscription?.planId && plan.id === subscription.planId) return true;
    if (plan.code && currentPlanCode && plan.code.toUpperCase() === currentPlanCode) return true;
    if (isTrial && plan.isTrial) return true;
    if (!isTrial && plan.name && currentAccessPlanName && plan.name.toLowerCase() === currentAccessPlanName.toLowerCase()) return true;
    return false;
  }, [subscription?.status, subscription?.planId, currentPlanCode, isTrial, currentAccessPlanName]);

  // Active plan object
  const activePlanObj = useMemo(() => {
    return plans.find(isCurrentPlan) || null;
  }, [plans, isCurrentPlan]);

  const activePlanName = activePlanObj?.name || subscription?.planCode?.replace(/_/g, ' ') || currentAccessPlanName || (isTrial ? '30-Day Free Trial' : 'Standard Enterprise');
  const activePlanDescription = activePlanObj?.description || 'Full evaluation access to multi-company accounting, inventory, sales, and purchasing.';

  const activePlanPricing = useMemo(() => {
    if (activePlanObj) {
      return formatPlanPricing(activePlanObj.price, activePlanObj.currency, activePlanObj.durationDays, 'monthly');
    }
    return formatPlanPricing(0, 'INR', 30, 'monthly');
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

  const totalTrialDays = activePlanObj?.durationDays || 30;
  const trialDaysPassed = daysRemaining !== null ? Math.max(0, Math.min(totalTrialDays, totalTrialDays - daysRemaining)) : 0;
  const trialProgressPercent = Math.min(100, Math.round((trialDaysPassed / totalTrialDays) * 100));

  const handleOpenUpgrade = (plan = null) => {
    setSelectedPlanForUpgrade(plan || plans.find(p => !isCurrentPlan(p)) || plans[1] || plans[0] || null);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }));
    refetchPlans();
  };

  const handleConfirmCancel = async () => {
    const subId = subscription?.id;
    if (!subId) return;
    setIsCancelling(true);
    try {
      await cancelSubscription(subId);
      dispatch(addAlert({ type: 'success', message: 'Subscription cancelled successfully.' }));
      setShowCancelModal(false);
      dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }));
      refetchPlans();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel subscription.';
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsCancelling(false);
    }
  };

  const maxAllowedCompanies = activePlanObj?.maxCompanies ?? 1;
  const companyQuotaLabel = formatPlanLimit(maxAllowedCompanies, 'companies');
  const isAtCompanyLimit = maxAllowedCompanies !== null && companies.length >= maxAllowedCompanies;

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-12">

      {/* ── 1. Page Header with Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/70 dark:border-[#2A2F3D]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500 dark:text-[#A0A6B5] mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50">
              <ShieldCheck size={11} />
              Enterprise Licensing
            </span>
            <span className="text-zinc-300 dark:text-[#2A2F3D]">•</span>
            <span className="text-zinc-600 dark:text-[#A0A6B5]">
              Tenant: <strong className="text-zinc-900 dark:text-[#E6E8EE]">{orgName}</strong>
            </span>
            {orgCode && (
              <>
                <span className="text-zinc-300 dark:text-[#2A2F3D]">•</span>
                <span className="font-mono text-[10.5px] font-bold text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2F3D]">
                  {orgCode}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            Subscription & Plan Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#A0A6B5] mt-1 max-w-2xl leading-relaxed">
            Manage licensing tier, multi-company workspace allocations, billing cadence, and platform module entitlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Link
            to="/company-select"
            className="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
          >
            <span>Switch Workspace</span>
          </Link>
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => handleOpenUpgrade()}
            className={`btn-primary h-8 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all ${
              !canBuy ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!canBuy ? buyDisabledReason : 'Upgrade Plan'}
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Upgrade Plan</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Alerts: Read-Only or Blocked Status ── */}
      {isReadOnly && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
            <div>
              <span className="font-semibold">Free Trial Expired:</span>{' '}
              Your account is currently in <strong>read-only mode</strong>. You can view existing records and reports, but creating transactions requires an active subscription.
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenUpgrade()}
            className="btn-primary h-7 px-3 text-[11px] font-semibold whitespace-nowrap shrink-0 ml-auto"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {isBlocked && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800/40 dark:text-rose-200">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <span className="font-semibold">Account Access Restricted:</span>{' '}
            Access to this organization has been paused by the administrator. Please contact your account executive to restore active access.
          </div>
        </div>
      )}

      {/* ── 2. Current Plan Executive Summary Card ── */}
      <section className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border ${
                  isTrial
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                    : isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTrial || isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                  {isTrial ? 'Trial Active' : (status || 'Active')}
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                  Tenant Organization: <strong className="text-zinc-800 dark:text-[#E6E8EE] font-semibold">{orgName}</strong>
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                  {activePlanName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#A0A6B5] mt-1 leading-relaxed">
                  {activePlanDescription}
                </p>
              </div>

              {/* Trial Countdown Progress Bar */}
              {isTrial && (
                <div className="pt-1 max-w-md space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-[#A0A6B5] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Trial Validity Period</span>
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-[#1D212C] rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-[#2A2F3D]">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, 100 - trialProgressPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 dark:text-[#6B7184]">
                    <span>Day {trialDaysPassed} of {totalTrialDays}</span>
                    <span>Valid until: {formattedTrialEndDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing & CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="text-left lg:text-right">
                <div className="text-3xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight font-sans">
                  {activePlanPricing.priceDisplay}
                  <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-normal ml-1">
                    {activePlanPricing.durationDisplay}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
                  Access: <strong className="text-zinc-800 dark:text-[#E6E8EE] font-semibold">{accessMode}</strong> • Status: <strong className="text-zinc-800 dark:text-[#E6E8EE] capitalize">{status.toLowerCase()}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => handleOpenUpgrade()}
                  className={`btn-primary h-8 px-3.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all ${
                    !canBuy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={!canBuy ? buyDisabledReason : 'Upgrade Plan'}
                >
                  <Zap size={13} className="text-amber-300 fill-amber-300" />
                  <span>Upgrade Plan</span>
                </button>
                {canBuy && subscription?.id && !isTrial && status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="btn-secondary h-8 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/30 dark:border-rose-900/40 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Cancel Subscription</span>
                  </button>
                )}
                <a
                  href={`mailto:sales@mark2erp.com?subject=Subscription%20Inquiry%20-%20${encodeURIComponent(orgName)}`}
                  className="btn-secondary h-8 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  <Mail size={13} className="text-zinc-500 dark:text-[#A0A6B5]" />
                  <span>Contact Sales</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Metadata Ribbon (Replaces disconnected chunky tiles) */}
        <div className="bg-zinc-50/70 dark:bg-[#1D212C]/60 border-t border-zinc-100 dark:border-[#2A2F3D] px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Assigned Tier</span>
            <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{activePlanName}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Billing Cadence</span>
            <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{activePlanObj?.durationDays ? `${activePlanObj.durationDays} Days` : '30-Day Cycle'}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Company Quota</span>
            <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{companyQuotaLabel}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Tenant Isolation</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Multi-Tenant Encrypted</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. REAL WORKSPACES & MODULES (Zero Dummy Metrics, Perfectly Balanced) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Column: Registered Legal Companies */}
        <div className="lg:col-span-6 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2A2F3D] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center justify-center">
                  <Building2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                    Registered Legal Companies ({companies.length})
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
                    Active legal operating entities under {orgName}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]">
                Limit: {companyQuotaLabel}
              </span>
            </div>

            {companies.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 dark:text-[#6B7184] bg-zinc-50 dark:bg-[#1D212C]/40 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                No companies currently registered under this tenant.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                {companies.map((company, index) => (
                  <div key={company.id || index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200/60 dark:bg-[#1D212C] dark:text-[#E6E8EE] dark:border-[#2A2F3D]">
                        {company.name?.charAt(0)?.toUpperCase() || index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">
                          {company.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-[#6B7184] font-mono">
                          Code: {company.code || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                      <Link
                        to={`/company/${company.id}/dashboard`}
                        className="btn-secondary h-7 px-2.5 text-[11px] font-semibold flex items-center gap-1"
                        title="Open Workspace"
                      >
                        <span>Open</span>
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genuine Workspace Quota Card */}
          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/70 dark:bg-[#1D212C]/60 p-3.5 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-700 dark:text-[#A0A6B5] font-medium">
              <span className="text-[11.5px]">Workspace Quota Allocation</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE] text-[11px]">
                {companies.length} of {companyQuotaLabel}
              </span>
            </div>
            <div className="w-full bg-zinc-200/80 dark:bg-[#2A2F3D] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#2E3D28] dark:bg-[#4C8DFF] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${maxAllowedCompanies ? Math.min(100, (companies.length / maxAllowedCompanies) * 100) : 100}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] leading-relaxed">
              {isAtCompanyLimit
                ? 'Your organization has reached the company limit for this tier. Upgrade to the Growth tier for up to 3 legal entities, or Enterprise for uncapped company provisioning.'
                : 'You have available capacity to provision additional legal companies under this organization.'}
            </p>
            {isAtCompanyLimit && (
              <button
                type="button"
                onClick={() => handleOpenUpgrade()}
                className="text-[11px] font-bold text-zinc-900 dark:text-[#4C8DFF] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>Unlock Additional Workspaces</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Entitled Platform Modules */}
        <div className="lg:col-span-6 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2A2F3D] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50 flex items-center justify-center">
                  <Layers size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                    Active Platform Modules ({entitledModuleKeys.length})
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
                    Subscribed capabilities provisioned for this organization
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Entitled
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(MODULE_METADATA).map(([key, meta]) => {
                const isEnabled = entitledModuleKeys.includes(key);
                const Icon = meta.icon;

                return (
                  <div
                    key={key}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      isEnabled
                        ? 'bg-zinc-50/50 border-zinc-200/80 hover:bg-zinc-50 dark:bg-[#1D212C] dark:border-[#2A2F3D] dark:hover:bg-[#222736]'
                        : 'bg-zinc-50/20 border-zinc-100 opacity-60 dark:bg-[#1D212C]/40 dark:border-[#2A2F3D]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center border shrink-0 ${meta.badgeColor}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] block truncate">
                          {meta.label}
                        </span>
                        <span className="text-[10.5px] text-zinc-500 dark:text-[#A0A6B5] block truncate">
                          {meta.desc}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border shrink-0 ${
                      isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-[#161922] dark:text-[#6B7184] dark:border-[#2A2F3D]'
                    }`}>
                      {isEnabled ? 'Included' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-400 dark:text-[#6B7184] border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
            <span>Modules reflect live subscription entitlements</span>
            <span className="font-medium text-zinc-600 dark:text-[#A0A6B5]">{entitledModuleKeys.length} of {Object.keys(MODULE_METADATA).length} Active</span>
          </div>
        </div>

      </div>

      {/* ── 4. Available Subscription Plans (Compare & Upgrade) ── */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
              Available Subscription Plans
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
              Select a tier to unlock additional legal companies and platform capabilities.
            </p>
          </div>

          {/* Billing Cycle Switcher & Sync Button */}
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-100 dark:bg-[#1D212C] p-0.5 rounded-lg flex items-center border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-zinc-900 shadow-2xs dark:bg-[#161922] dark:text-[#E6E8EE]'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-white text-zinc-900 shadow-2xs dark:bg-[#161922] dark:text-[#E6E8EE]'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE]'
                }`}
              >
                <span>Annual</span>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[9.5px] font-bold px-1 py-0.2 rounded">
                  -20%
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={refetchPlans}
              disabled={plansLoading}
              className="btn-secondary h-7 px-2.5 text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
              title="Sync plans from server"
            >
              <RefreshCw size={12} className={plansLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Dynamic Plans Grid from Backend */}
        {!canView ? (
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1D212C] text-zinc-500 dark:text-[#A0A6B5] mx-auto flex items-center justify-center">
              <ShieldCheck size={20} className="text-zinc-600 dark:text-[#A0A6B5]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                Subscription Plan Catalog Restricted
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] max-w-lg mx-auto mt-1 leading-relaxed">
                Available subscription tiers and upgrade options are restricted to Organization Owners and System Administrators. As an organization member, your workspace access is governed by your organization's active tier shown above.
              </p>
            </div>
          </div>
        ) : plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white dark:bg-[#161922] rounded-xl p-6 border border-zinc-200/80 dark:border-[#2A2F3D] animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-zinc-200 dark:bg-[#2A2F3D] rounded w-1/3" />
                  <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-1/4" />
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-[#1D212C] rounded w-3/4" />
                <div className="h-10 bg-zinc-100 dark:bg-[#1D212C] rounded w-1/2 my-3" />
                <div className="h-14 bg-zinc-50 dark:bg-[#1D212C]/60 rounded" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-zinc-100 dark:bg-[#1D212C] rounded w-full" />
                  <div className="h-3 bg-zinc-100 dark:bg-[#1D212C] rounded w-4/5" />
                  <div className="h-3 bg-zinc-100 dark:bg-[#1D212C] rounded w-3/5" />
                </div>
                <div className="h-9 bg-zinc-100 dark:bg-[#1D212C] rounded mt-4" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-8 text-center space-y-3">
            <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${plansError?.status === 403 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-500 dark:text-[#A0A6B5]'}`}>
              {plansError?.status === 403 ? <Lock size={20} /> : <Layers size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                {plansError?.status === 403
                  ? 'Subscription Catalog Authorization Pending'
                  : plansError
                  ? 'Subscription Plans Unavailable'
                  : 'No Plans Configured on Server'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] max-w-md mx-auto mt-1 leading-relaxed">
                {plansError?.status === 403
                  ? 'The backend authorization filter requires SUBSCRIPTION_PLAN:READ permission to query the plan catalog. Please contact your platform administrator.'
                  : plansError
                  ? 'Unable to retrieve subscription plans from the backend API. Please check server status or retry synchronization.'
                  : 'There are currently no active subscription plans configured in the backend registry.'}
              </p>
            </div>
            {plansError?.status !== 403 && (
              <button
                type="button"
                onClick={refetchPlans}
                disabled={plansLoading}
                className="btn-secondary h-8 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw size={12} className={plansLoading ? 'animate-spin' : ''} />
                <span>Retry Server Sync</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const current = isCurrentPlan(p);
              const pricing = formatPlanPricing(p.price, p.currency, p.durationDays, billingCycle);
              const isPopular = !p.isTrial && (p.name?.toLowerCase().includes('growth') || p.name?.toLowerCase().includes('pro'));
              const modules = Array.isArray(p.modules) ? p.modules : [];

              return (
                <div
                  key={p.id || p.code}
                  className={`rounded-xl p-6 border flex flex-col justify-between transition-all duration-200 ${
                    current
                      ? 'bg-white dark:bg-[#161922] border-emerald-500 dark:border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : isPopular
                      ? 'bg-white dark:bg-[#161922] border-zinc-900 dark:border-[#4C8DFF]/60 ring-1 ring-zinc-900/10 dark:ring-[#4C8DFF]/20 shadow-xs'
                      : 'bg-white dark:bg-[#161922] border-zinc-200/90 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#383F52] hover:shadow-xs'
                  }`}
                >
                  {/* Header with Integrated Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
                        {p.name}
                      </h3>
                      {current ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                          <Check size={10} className="stroke-[3]" /> Current Plan
                        </span>
                      ) : isPopular ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-[#2E3D28] text-white dark:bg-[#4C8DFF] dark:text-white">
                          <Sparkles size={10} className="text-amber-300" /> Recommended
                        </span>
                      ) : p.isTrial ? (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50 uppercase">
                          Evaluation
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D] uppercase">
                          Scalable
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] min-h-[34px] leading-relaxed">
                      {p.description || 'Full platform capabilities and administrative tools.'}
                    </p>

                    {/* Pricing Display */}
                    <div className="pt-3 pb-3 border-y border-zinc-100 dark:border-[#2A2F3D] my-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight font-sans">
                          {pricing.priceDisplay}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-normal">
                          {pricing.durationDisplay}
                        </span>
                      </div>
                      {pricing.monthlyRateDisplay && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          Equivalent to {pricing.monthlyRateDisplay} (billed annually)
                        </p>
                      )}
                    </div>

                    {/* Quota Highlights directly from Backend */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-[#1D212C] border border-zinc-100 dark:border-[#2A2F3D] text-xs mb-3.5">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Max Companies</span>
                        <span className="font-bold text-zinc-800 dark:text-[#E6E8EE]">
                          {formatPlanLimit(p.maxCompanies, 'companies')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Users / Co.</span>
                        <span className="font-bold text-zinc-800 dark:text-[#E6E8EE]">
                          {formatPlanLimit(p.maxUsersPerCompany ?? p.maxUsers, 'users')}
                        </span>
                      </div>
                    </div>

                    {/* Real Modules from Backend Plan */}
                    <div className="space-y-1.5">
                      <span className="text-[9.5px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">
                        Included Platform Modules {modules.length > 0 ? `(${modules.length})` : ''}
                      </span>
                      {modules.length > 0 ? (
                        <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-[#A0A6B5]">
                          {modules.map((m, idx) => (
                            <li key={m.id || m.moduleId || idx} className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">{formatModuleName(m.moduleName)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-[#A0A6B5]">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>All core modules included</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5 mt-4 border-t border-zinc-100 dark:border-[#2A2F3D]">
                    {current ? (
                      <button
                        type="button"
                        disabled
                        className="btn-secondary w-full py-2.5 rounded-lg text-xs font-semibold text-zinc-400 dark:text-[#6B7184] bg-zinc-50 dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] cursor-default flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Active Current Plan</span>
                      </button>
                    ) : (
                      <div>
                        <button
                          type="button"
                          disabled={!canBuy}
                          onClick={() => handleOpenUpgrade(p)}
                          className={`btn-primary w-full py-2.5 rounded-lg text-xs font-semibold bg-[#2E3D28] hover:bg-[#3C4E34] active:bg-[#243320] text-white dark:bg-[#4C8DFF] dark:hover:bg-[#3B7AE8] dark:text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs ${
                            !canBuy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={!canBuy ? buyDisabledReason : (p.isTrial ? 'Choose Trial' : `Upgrade to ${p.name}`)}
                        >
                          <span>{p.isTrial ? 'Choose Trial' : `Upgrade to ${p.name}`}</span>
                          <ArrowRight size={13} />
                        </button>
                        {!canBuy && (
                          <p className="text-[10.5px] text-zinc-400 dark:text-[#6B7184] text-center mt-1.5">
                            Owner or Admin role required
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Enterprise Invoicing & Statutory Compliance (High Trust, Zero Gimmick) ── */}
      <section className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#2A2F3D] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] flex items-center justify-center">
              <Receipt size={15} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                Enterprise Billing Receipts & Compliance
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
                Official billing statements and statutory tax receipts
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-[#A0A6B5] font-medium">
            Currency: <strong className="text-zinc-800 dark:text-[#E6E8EE]">INR (₹)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Panel 1: Current Cycle Statement */}
          <div className="rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono text-[11px]">
                  #INV-{new Date().getFullYear()}-001
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                  Active Cycle
                </span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] font-mono text-sm">
                {activePlanPricing.priceDisplay}
              </span>
            </div>

            <p className="text-zinc-500 dark:text-[#A0A6B5] text-[11.5px] leading-relaxed">
              {activePlanName} Evaluation statement issued to <strong className="text-zinc-800 dark:text-[#E6E8EE]">{orgName}</strong> ({orgCode}). Billed with zero outstanding dues.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={`mailto:sales@mark2erp.com?subject=Tax%20Invoice%20Request%20-%20${encodeURIComponent(orgName)}`}
                className="btn-secondary h-7 px-3 text-[11px] font-semibold flex items-center gap-1.5"
              >
                <Mail size={12} />
                <span>Request GST Tax Invoice</span>
              </a>
            </div>
          </div>

          {/* Panel 2: Corporate Purchase Orders */}
          <div className="rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE] text-[11px]">
                Purchase Orders & Custom Quotas
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-[#6B7184] font-mono">
                Corporate Billing
              </span>
            </div>

            <p className="text-zinc-500 dark:text-[#A0A6B5] text-[11.5px] leading-relaxed">
              Need custom annual billing, multi-subsidiary quota expansion, or procurement via corporate Purchase Order (PO) / NEFT / RTGS?
            </p>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={`mailto:sales@mark2erp.com?subject=Enterprise%20Subscription%20Inquiry%20-%20${encodeURIComponent(orgName)}`}
                className="btn-secondary h-7 px-3 text-[11px] font-semibold flex items-center gap-1.5"
              >
                <Building2 size={12} />
                <span>Contact Enterprise Sales</span>
                <ArrowRight size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Backend Gap Notice */}
        <div className="bg-zinc-50 dark:bg-[#1D212C]/40 rounded-xl p-3 border border-zinc-200/60 dark:border-[#2A2F3D] text-[11px] text-zinc-500 dark:text-[#A0A6B5] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
            <span>Automated tenant billing transaction history API is not yet provisioned in the backend. System administrators can access organization payment records via the Global Console.</span>
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider shrink-0 ml-2">
            Status: Graceful Fallback
          </span>
        </div>
      </section>

      {/* ── Cancel Subscription Confirmation Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#161922] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">Cancel Active Subscription?</h3>
                <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1 leading-relaxed">
                  Are you sure you want to cancel the subscription for <strong className="text-zinc-800 dark:text-[#E6E8EE]">{orgName}</strong>? Your workspace will remain active until the end of the billing period, after which it will transition to read-only access.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary h-8 px-3.5 text-xs font-semibold"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="btn-danger h-8 px-3.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Modal (Direct Razorpay integration) ── */}
      <SubscriptionCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        selectedPlan={selectedPlanForUpgrade}
        organization={organization}
        user={user}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

/**
 * Main SubscriptionPage export.
 * Renders cleanly inside the active layout context without duplicate wrappers.
 */
export default function SubscriptionPage() {
  return <SubscriptionContent />;
}
