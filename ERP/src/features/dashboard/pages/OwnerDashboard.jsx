import React, { useMemo, useCallback } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Users,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Boxes,
  ShoppingCart,
  Briefcase,
  RefreshCw,
  ChevronRight,
  Lock,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectAuthContext } from '../../auth/authSlice';
import { setSelectedCompany, selectSelectedCompany } from '../../company-management/companySlice';
import { useAccessMode } from '../../../hooks/useAccessMode';
import { getEntitledModules } from '../../../utils/moduleNormalization';
import OwnerLayout, { useIsOwnerLayout } from '../../../layouts/OwnerLayout';

/**
 * Redesigned OwnerDashboardContent.
 * Follows the exact design system, spacing, cards, typography, and clean SaaS aesthetics
 * of the Mark2 ERP Company Dashboard.
 */
function OwnerDashboardContent() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  const {
    organization,
    currentCompany,
    companies = [],
    subscription,
    user,
  } = authContext;

  const activeCompanyId =
    selectedCompany?.id || currentCompany?.id || (companies.length > 0 ? companies[0].id : null);
  const activeCompanyCode =
    selectedCompany?.code || currentCompany?.code || (companies.length > 0 ? companies[0].code : '');
  const activeCompanyName =
    selectedCompany?.name ||
    currentCompany?.name ||
    (companies.length > 0 ? companies[0].name : 'Primary Company');

  const {
    isTrial,
    isActive,
    isReadOnly,
    daysRemaining,
  } = useAccessMode();

  const entitledModules = useMemo(() => getEntitledModules(authContext), [authContext]);

  const handleSelectCompany = useCallback((comp) => {
    dispatch(
      setSelectedCompany({
        id: comp.id,
        code: comp.code,
        name: comp.name || comp.legalName,
      })
    );
  }, [dispatch]);

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const ownerName = user?.fullName || user?.username || 'Organization Owner';
  const ownerEmail = user?.email || user?.username || '';
  const orgCurrency = organization?.currency || 'INR';
  const orgStatus = organization?.status || 'ACTIVE';

  // Module launcher mapping with entitlements
  const availableModuleLaunchers = [
    {
      id: 'ACCOUNT',
      name: 'Finance & Accounts',
      code: 'accounts',
      shortName: 'Finance',
      description: 'General ledger, charts of accounts, journal vouchers, invoices, receivables & payables, and taxation reports.',
      icon: Calculator,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
      path: '/accounts/dashboard',
      isEntitled: entitledModules.includes('ACCOUNT'),
    },
    {
      id: 'INVENTORY',
      name: 'Inventory Management',
      code: 'inventory',
      shortName: 'Inventory',
      description: 'Real-time stock tracking, warehouses, product batches, inventory adjustments, and valuation analytics.',
      icon: Boxes,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
      path: '/inventory/dashboard',
      isEntitled: entitledModules.includes('INVENTORY'),
    },
    {
      id: 'CRM',
      name: 'Sales & CRM',
      code: 'crm',
      shortName: 'Sales CRM',
      description: 'Customer lifecycle, sales quotations, customer orders, lead pipelines, and commercial revenue performance.',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
      path: '/crm/dashboard',
      isEntitled: entitledModules.includes('CRM'),
    },
    {
      id: 'PURCHASES',
      name: 'Purchasing & Procurement',
      code: 'purchase',
      shortName: 'Purchasing',
      description: 'Purchase requisitions, supplier requests for quotation (RFQs), purchase orders, and vendor invoice settlements.',
      icon: Briefcase,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'hover:border-rose-300',
      path: '/purchase-requisitions',
      isEntitled: entitledModules.includes('PURCHASES') || entitledModules.includes('ACCOUNT'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      {/* ── Main Content Container ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">

        {/* ── 1. Compact Page Header (Replacing oversized dark hero) ── */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Owner Workspace</span>
              {orgCode && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="font-mono text-zinc-600 font-bold">{orgCode}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">
              Owner Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Organization overview, company access and business module management.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/subscription"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <CreditCard size={14} className="text-zinc-500" />
              <span>Manage Plan</span>
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="Refresh metrics"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <RefreshCw size={13} className="text-zinc-500" />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* ── 2. Summary KPI Cards Row (Matching Company Dashboard StatsCard design) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Card 1: Total Companies */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Total Companies
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                {companies.length}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{companies.length > 0 ? `${companies.length} Active` : '0 Active'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11px]">
                Primary: {activeCompanyCode || 'Default'}
              </span>
            </div>
          </div>

          {/* Card 2: Active Modules */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Active Modules
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Layers size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                {entitledModules.length}
                <span className="text-base font-normal text-zinc-400 ml-1">/ {availableModuleLaunchers.length}</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{entitledModules.length} Provisioned</span>
              </span>
              {availableModuleLaunchers.length - entitledModules.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 text-[11px]">
                  {availableModuleLaunchers.length - entitledModules.length} Locked
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Subscription Status */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Subscription
                </span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <CreditCard size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate capitalize">
                {subscription?.planCode ? subscription.planCode.replace(/_/g, ' ') : (isTrial ? 'Free Trial' : 'Enterprise')}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] ${
                isTrial
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                <Clock size={11} />
                <span>{daysRemaining !== null ? `${daysRemaining} days left` : 'Active Plan'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11px]">
                {authContext.accessMode || 'Full'}
              </span>
            </div>
          </div>

          {/* Card 4: Organization Owner Profile */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Owner Profile
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate" title={ownerName}>
                {ownerName}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-medium truncate">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>Verified Owner</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[120px]">
                {ownerEmail}
              </span>
            </div>
          </div>

        </section>

        {/* ── 3. Organization Overview Section ── */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Organization Overview</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Core organization identity, tenant parameters and billing currency</p>
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/60 uppercase tracking-wider">
              Organization
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization Name</span>
              <p className="text-xs font-bold text-zinc-900 truncate" title={orgName}>{orgName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization Code</span>
              <p className="text-xs font-mono font-bold text-zinc-800">{orgCode || 'ORG'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Base Currency</span>
              <p className="text-xs font-mono font-bold text-zinc-800">{orgCurrency}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization Status</span>
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="capitalize">{orgStatus.toLowerCase()}</span>
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Primary Company</span>
              <p className="text-xs font-bold text-zinc-900 truncate" title={activeCompanyName}>{activeCompanyName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Registered Workspaces</span>
              <p className="text-xs font-bold text-zinc-900">{companies.length} {companies.length === 1 ? 'Workspace' : 'Workspaces'}</p>
            </div>
          </div>
        </section>

        {/* ── 4. Business Modules (Matching Company Dashboard Module Grid) ── */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h2 className="text-base font-display font-bold text-zinc-900 tracking-tight">
                Business Modules
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage and access business applications provisioned for your organization.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-bold text-zinc-600 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
              {entitledModules.length} of {availableModuleLaunchers.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {availableModuleLaunchers.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md min-h-[220px] ${
                    mod.isEntitled
                      ? 'border-zinc-200/90 ' + mod.borderColor
                      : 'border-zinc-200/70 bg-zinc-50/40 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon container + Status badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${mod.bgColor} ${mod.color} flex items-center justify-center shadow-2xs`}>
                        <Icon size={20} />
                      </div>

                      {mod.isEntitled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/60">
                          <Lock size={10} className="text-zinc-400" />
                          <span>Not Provisioned</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1 line-clamp-3">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-4 mt-3 border-t border-zinc-100">
                    {mod.isEntitled ? (
                      <Link
                        to={mod.path}
                        className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs bg-zinc-900 hover:bg-zinc-800 text-white"
                      >
                        <span>Open {mod.shortName}</span>
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <Link
                        to="/subscription"
                        className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                      >
                        <Lock size={11} className="text-zinc-400" />
                        <span>Upgrade to Enable</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Company Management Section ("Your Companies") ── */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-zinc-900 tracking-tight">
                Your Companies
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Overview of all registered companies and workspaces under {orgName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/company-select"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
              >
                <span>Company Directory</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Company</th>
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Currency</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Workspace Context</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      No companies found. Create a company to get started.
                    </td>
                  </tr>
                ) : (
                  companies.map((comp) => {
                    const isCurrent =
                      comp.id === activeCompanyId || comp.code === activeCompanyCode;
                    return (
                      <tr key={comp.id || comp.code} className="hover:bg-zinc-50/60 transition-colors">
                        {/* Company Name */}
                        <td className="py-3.5 px-5 font-bold text-zinc-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                              <Building2 size={14} />
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900">{comp.name || comp.legalName}</div>
                              {comp.legalName && comp.legalName !== comp.name && (
                                <div className="text-[10px] text-zinc-400 font-normal">{comp.legalName}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3.5 px-5">
                          <span className="font-mono text-zinc-700 font-bold uppercase text-[11px] bg-zinc-100 px-2 py-0.5 rounded">
                            {comp.code || '—'}
                          </span>
                        </td>

                        {/* Currency */}
                        <td className="py-3.5 px-5 font-mono text-zinc-600 font-medium">
                          {comp.currency || orgCurrency}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </span>
                        </td>

                        {/* Workspace Context */}
                        <td className="py-3.5 px-5 font-medium">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              <Check size={11} className="text-emerald-600" />
                              <span>Current Active</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">Secondary</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {isCurrent ? (
                              <>
                                <Link
                                  to="/accounts/dashboard"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
                                >
                                  <span>Open Dashboard</span>
                                  <ArrowRight size={11} />
                                </Link>
                                <Link
                                  to={`/company/${comp.id}/settings`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-[11px] font-semibold hover:bg-zinc-50 transition-colors"
                                >
                                  <span>Manage</span>
                                </Link>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSelectCompany(comp)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-[11px] font-semibold hover:bg-zinc-50 transition-colors shadow-2xs"
                                >
                                  <span>Switch To</span>
                                </button>
                                <Link
                                  to={`/company/${comp.id}/settings`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-[11px] font-semibold hover:bg-zinc-50 transition-colors"
                                >
                                  <span>Manage</span>
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 6. Subscription Section (Compact enterprise license card) ── */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">
                  {subscription?.planCode ? subscription.planCode.replace(/_/g, ' ') : (isTrial ? '30-Day Enterprise Trial' : 'Enterprise Subscription')}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isTrial ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{isTrial ? 'Trial Active' : 'Subscribed'}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {daysRemaining !== null
                  ? `${daysRemaining} days remaining in trial period. Access all 4 enterprise modules with complete administrative control.`
                  : 'Active subscription tier with full organization privileges and workspace management.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              to="/subscription"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              <span>Manage Plan</span>
              <ArrowRight size={13} />
            </Link>
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
            <Link to="/subscription" className="hover:text-zinc-600 transition-colors">Subscription & Billing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Main OwnerDashboard export with layout context detection & auth guard.
 */
export default function OwnerDashboard() {
  const isInsideLayout = useIsOwnerLayout();
  const authContext = useAppSelector(selectAuthContext);

  const isOwner =
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    authContext?.user?.role === 'super_admin';

  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  if (isInsideLayout) {
    return <OwnerDashboardContent />;
  }

  return (
    <OwnerLayout>
      <OwnerDashboardContent />
    </OwnerLayout>
  );
}
