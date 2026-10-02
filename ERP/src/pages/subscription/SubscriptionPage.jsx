import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Copy,
  Check,
  Layers,
  ArrowUpRight,
  Server,
  Headphones
} from 'lucide-react';
import { useAccessMode } from '../../hooks/useAccessMode';
import { useRoutePath } from '../../hooks/useRoutePath';

export default function SubscriptionPage() {
  const {
    status,
    accessMode,
    isReadOnly,
    isBlocked,
    isTrial,
    isActive,
    trialEndsAt,
    daysRemaining,
    planName,
    organization,
    company,
  } = useAccessMode();

  const { buildPath } = useRoutePath();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [selectedTier, setSelectedTier] = useState('professional');
  const [copiedField, setCopiedField] = useState(null);

  // Manage body scroll lock and escape listener for modal
  useEffect(() => {
    if (!showUpgradeModal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUpgradeModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showUpgradeModal]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText?.(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formattedDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  // Calculate trial progress percentage (out of 30 days)
  const trialDaysPassed = daysRemaining !== null ? Math.max(0, Math.min(30, 30 - daysRemaining)) : 0;
  const trialProgressPercent = Math.min(100, Math.round((trialDaysPassed / 30) * 100));

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Small Business',
      monthlyPrice: 29,
      annualPrice: 24,
      description: 'Essential accounting, invoicing, and single-entity financial ledger.',
      features: [
        'Up to 3 Team Members',
        '1 Registered Legal Entity',
        'Chart of Accounts & GL',
        'Customer Invoices & Vouchers',
        'Standard Financial Statements',
        'Standard Email Support',
      ],
      cta: 'Select Starter',
      featured: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      badge: 'Most Popular',
      monthlyPrice: 79,
      annualPrice: 64,
      description: 'Comprehensive ERP for growing companies needing inventory and workflows.',
      features: [
        'Up to 15 Team Members',
        'Up to 5 Legal Entities',
        'Advanced Inventory & Warehouses',
        'Multi-currency & Exchange Rates',
        'Configurable Approval Workflows',
        'Audit Trails & Change History',
        'Priority 24/7 Assistance',
      ],
      cta: 'Upgrade to Professional',
      featured: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Suite',
      badge: 'Custom Scale',
      monthlyPrice: 199,
      annualPrice: 159,
      description: 'Full-scale enterprise resource planning with dedicated infra and SLA.',
      features: [
        'Unlimited Team Members',
        'Unlimited Legal Entities',
        'Full Manufacturing MRP & BOM',
        'Custom Role Permissions & FBAC',
        'Automated Hourly Snapshot Backups',
        'Dedicated Enterprise Account Manager',
        '99.99% Uptime Guarantee & SLA',
      ],
      cta: 'Contact Enterprise Sales',
      featured: false,
    },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">
      {/* ── Page Header & Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 tracking-tight">
              Subscription & Plan Details
            </h1>
            {isTrial && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 shadow-xs">
                <Sparkles size={12} className="text-emerald-500" />
                <span>30-Day Free Trial</span>
              </span>
            )}
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/80 shadow-xs">
                <CheckCircle2 size={12} className="text-indigo-600" />
                <span>Active Subscription</span>
              </span>
            )}
            {isReadOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 shadow-xs">
                <AlertTriangle size={12} className="text-amber-600" />
                <span>Trial Expired • Read-Only</span>
              </span>
            )}
            {isBlocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 shadow-xs">
                <ShieldAlert size={12} className="text-rose-600" />
                <span>Access Restricted</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1.5">
            Review your organization's subscription tier, usage quotas, and access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={buildPath('dashboard')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-xs transition-all"
          >
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-black hover:to-zinc-900 shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Upgrade Plan</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Read-Only Notice Box (if applicable) ── */}
      {isReadOnly && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3.5 shadow-xs animate-scale-up">
          <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900">Your free trial has expired</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              This account is currently in <strong>read-only mode</strong>. You can still view all existing records, transaction histories, and financial reports. Upgrade your plan to unlock create, edit, and posting permissions across all modules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="ml-auto px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shrink-0 whitespace-nowrap shadow-xs"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* ── Blocked Notice Box (if applicable) ── */}
      {isBlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3.5 shadow-xs">
          <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-rose-900">Account Access Restricted</h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Access to this organization has been paused by the system administrator. Please reach out to your account executive or contact support to reactivate your workspace.
            </p>
          </div>
        </div>
      )}

      {/* ── Hero Plan Status Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-zinc-800/80">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[11px] font-medium border border-white/10 uppercase tracking-wider">
                Current Plan
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Organization: <strong className="text-white capitalize">{organization?.name || 'Workspace'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
                {planName || (isTrial ? '30-Day Enterprise Trial' : 'Enterprise ERP')}
              </h2>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : status === 'TRIALING'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                }`}
              >
                {status}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Full access to Accounting, Inventory, Purchase, Sales, and Reporting modules. Isolated tenant data protected by multi-tenant encryption.
            </p>

            {/* Trial Countdown Bar */}
            {isTrial && trialEndsAt && (
              <div className="pt-2 max-w-md space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} className="text-indigo-400" />
                    Trial Period
                  </span>
                  <span className="font-bold text-white">
                    {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active'}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/60">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, 100 - trialProgressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Started: 30 days allocated</span>
                  <span>Ends: {formattedDate}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-100 shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <Zap size={14} className="text-indigo-600 fill-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Explore Upgrade Options</span>
            </button>
            <a
              href={`mailto:sales@mark2erp.com?subject=Inquiry%20from%20${encodeURIComponent(organization?.name || 'Organization')}&body=Hello%20Mark2%20Team%2C%0A%0AWe%20would%20like%20to%20discuss%20our%20subscription%20plan%20for%20organization%20${encodeURIComponent(organization?.code || '')}.`}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all flex items-center justify-center gap-2 text-center"
            >
              <Mail size={14} />
              <span>Contact Account Manager</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Capacity & Resource Quotas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">User Seats</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">3</span>
            <span className="text-xs text-zinc-400">/ 15 included</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full w-[20%]" />
          </div>
          <p className="text-[11px] text-zinc-400">12 seats available to assign</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Legal Companies</span>
            <Building2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">1</span>
            <span className="text-xs text-zinc-400">/ 5 entities</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full w-[20%]" />
          </div>
          <p className="text-[11px] text-zinc-400">Primary: {company?.name || 'Workspace'}</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Document Storage</span>
            <Database size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">1.4 GB</span>
            <span className="text-xs text-zinc-400">/ 25 GB</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full w-[6%]" />
          </div>
          <p className="text-[11px] text-zinc-400">Invoices, attachments & bills</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold">Monthly Transactions</span>
            <BarChart3 size={16} className="text-violet-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">1,420</span>
            <span className="text-xs text-zinc-400">/ Unlimited</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-violet-600 h-1.5 rounded-full w-[15%]" />
          </div>
          <p className="text-[11px] text-zinc-400">Vouchers, journals & orders</p>
        </div>
      </div>

      {/* ── Grid: Plan Details & Context ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Subscription Status */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Subscription Specifications</h3>
                <p className="text-[11px] text-zinc-400">Plan lifecycle, access status, and renewal</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : status === 'TRIALING'
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-500 font-medium">Assigned Plan Tier</span>
              <span className="font-bold text-zinc-900">{planName}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-zinc-100">
              <span className="text-zinc-500 font-medium">Lifecycle State</span>
              <span className="font-mono font-bold text-zinc-800">{status}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-zinc-100">
              <span className="text-zinc-500 font-medium">Access Permission Mode</span>
              <span className="inline-flex items-center gap-1.5 font-mono font-bold text-zinc-800">
                <Lock size={12} className={accessMode === 'FULL' ? 'text-emerald-600' : 'text-amber-600'} />
                {accessMode}
              </span>
            </div>

            {trialEndsAt && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-400" />
                  Trial Valid Until
                </span>
                <div className="text-right">
                  <span className="font-bold text-zinc-900 block">{formattedDate}</span>
                  {daysRemaining !== null && (
                    <span className="text-[11px] text-zinc-400 block">
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Organization Context */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Tenant & Workspace Mapping</h3>
                <p className="text-[11px] text-zinc-400">Multi-tenant isolation and security scope</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              Tenant
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-500 font-medium">Organization</span>
              <span className="font-bold text-zinc-900 capitalize">{organization?.name || '—'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-zinc-100">
              <span className="text-zinc-500 font-medium">Organization Code</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-zinc-800 uppercase">{organization?.code || '—'}</span>
                {organization?.code && (
                  <button
                    type="button"
                    onClick={() => handleCopy(organization.code, 'orgCode')}
                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100 transition-colors"
                    title="Copy Code"
                  >
                    {copiedField === 'orgCode' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <span className="text-zinc-500 font-medium">Primary Active Company</span>
              <span className="font-bold text-zinc-900">{company?.name || '—'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-zinc-100">
              <span className="text-zinc-500 font-medium">Company Identifier</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-zinc-800 uppercase">{company?.code || '—'}</span>
                {company?.code && (
                  <button
                    type="button"
                    onClick={() => handleCopy(company.code, 'companyCode')}
                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100 transition-colors"
                    title="Copy Company Code"
                  >
                    {copiedField === 'companyCode' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── All Plans & Capabilities Comparison Matrix ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">
              Compare Subscription Plans
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose the right capacity and governance tier for your business requirements.
            </p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/70 shrink-0">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>Annually</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {plans.map((p) => {
            const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;
            const isCurrent = (p.id === 'professional' && !isTrial) || (p.id === 'starter' && isTrial);

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  p.featured
                    ? 'border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-md'
                    : 'border border-zinc-200/80 bg-white hover:border-zinc-300 shadow-xs'
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    {p.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900">{p.name}</h4>
                      <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">{p.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 pb-1 border-b border-zinc-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-zinc-900">${price}</span>
                      <span className="text-xs text-zinc-400 font-medium">/ month</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-600 pt-2">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTier(p.id);
                      setShowUpgradeModal(true);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      p.featured
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'bg-zinc-900 hover:bg-black text-white'
                    }`}
                  >
                    <span>{p.cta}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Enterprise Governance & Security Badges ── */}
      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/80 space-y-4">
        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
          Enterprise Security & Data Isolation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/70 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 text-zinc-900 font-bold">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Multi-Tenant Isolation</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Every request enforces organization and company scope at database and application layers.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200/70 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 text-zinc-900 font-bold">
              <Server size={16} className="text-emerald-600" />
              <span>High Availability & Backups</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Continuous transaction log backups and point-in-time recovery for financial audits.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200/70 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 text-zinc-900 font-bold">
              <Headphones size={16} className="text-blue-600" />
              <span>Dedicated Enterprise SLA</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Guaranteed 1-hour critical response time and direct access to solutions architects.
            </p>
          </div>
        </div>
      </div>

      {/* ── Upgrade Plan Modal (Rendered via createPortal to document.body) ── */}
      {showUpgradeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowUpgradeModal(false)}
          />

          <div className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-zinc-100 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Upgrade Subscription</h3>
                  <p className="text-xs text-zinc-500">
                    Empower <strong className="text-zinc-800 capitalize">{organization?.name || 'your team'}</strong> with expanded capacity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Billing Cycle Picker */}
            <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-200/60">
              <div>
                <p className="text-xs font-bold text-zinc-800">Billing Cadence</p>
                <p className="text-[11px] text-zinc-500">Annual plans include a 20% discount</p>
              </div>
              <div className="inline-flex items-center p-1 bg-zinc-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    billingCycle === 'monthly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    billingCycle === 'annual' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  Annual (-20%)
                </button>
              </div>
            </div>

            {/* Plan Cards in Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((p) => {
                const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;
                const isSelected = selectedTier === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedTier(p.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{p.name}</span>
                        {isSelected && <CheckCircle2 size={15} className="text-indigo-600" />}
                      </div>
                      <div className="mt-2">
                        <span className="text-xl font-black text-zinc-900">${price}</span>
                        <span className="text-[10px] text-zinc-400">/mo</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 text-[10px] text-zinc-600 font-medium">
                      ✓ {p.features[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise Support Contact Card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Direct Enterprise Assistance</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Need customized billing, tax invoices (GST/VAT), or dedicated onboarding for <strong>{organization?.name || 'your team'}</strong>? Our sales team will activate your subscription immediately.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a
                  href="mailto:sales@mark2erp.com"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 transition-colors"
                >
                  <Mail size={14} className="text-indigo-600" />
                  <span className="font-medium truncate">sales@mark2erp.com</span>
                </a>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 transition-colors"
                >
                  <Phone size={14} className="text-indigo-600" />
                  <span className="font-medium">+91 98765 43210</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
              <a
                href={`mailto:sales@mark2erp.com?subject=Upgrade%20to%20${encodeURIComponent(selectedTier.toUpperCase())}%20Plan%20for%20${encodeURIComponent(organization?.name || 'Organization')}&body=Hello%20Mark2%20Sales%20Team%2C%0A%0AWe%20would%20like%20to%20upgrade%20our%20subscription%20to%20the%20${encodeURIComponent(selectedTier.toUpperCase())}%20tier%20(${encodeURIComponent(billingCycle)}%20billing)%20for%20organization%3A%0A-%20Organization%20Name%3A%20${encodeURIComponent(organization?.name || '')}%0A-%20Organization%20Code%3A%20${encodeURIComponent(organization?.code || '')}%0A-%20Company%3A%20${encodeURIComponent(company?.name || '')}%20(${encodeURIComponent(company?.code || '')})%0A%0APlease%20provide%20the%20activation%20details.%0A%0AThank%20you.`}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all inline-flex items-center justify-center gap-2 text-center"
              >
                <Mail size={14} />
                <span>Contact Sales to Activate</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
