import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Globe, Users, ShieldCheck, CreditCard,
  Layers, ArrowRight, Sparkles, Clock, CheckCircle2,
  AlertTriangle, LogOut, ChevronDown, Check,
  BarChart3, Settings, Calculator, Boxes, ShoppingCart,
  Briefcase, RefreshCw, ChevronRight, KeyRound
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectAuthContext, logout as logoutAction } from '../../auth/authSlice';
import { setSelectedCompany, selectSelectedCompany } from '../../company-management/companySlice';
import { useLogoutApiMutation } from '../../auth/services/authApi';
import { useGetDashboardMetricsQuery } from '../../../api/sso/dashboard';
import { removeCookie } from '../../../utils/cookieHelper';
import MarkLogo from '../../../components/common/MarkLogo';
import SubscriptionNoticeBanner from '../../../components/common/SubscriptionNoticeBanner';
import StatsCard from '../components/StatsCard';
import { RoleTable, PortalAccessTable } from '../components/DashboardTables';
import { useAccessMode } from '../../../hooks/useAccessMode';
import { getEntitledModules } from '../../../utils/moduleNormalization';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  const {
    organization,
    currentCompany,
    companies = [],
    membership,
    subscription,
    user,
    modules = [],
  } = authContext;

  const activeCompanyId = selectedCompany?.id || currentCompany?.id || (companies.length > 0 ? companies[0].id : null);
  const activeCompanyCode = selectedCompany?.code || currentCompany?.code || (companies.length > 0 ? companies[0].code : '');
  const activeCompanyName = selectedCompany?.name || currentCompany?.name || (companies.length > 0 ? companies[0].name : 'Primary Company');

  const {
    isTrial,
    isActive,
    isReadOnly,
    isBlocked,
    daysRemaining,
  } = useAccessMode();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [logoutApi] = useLogoutApiMutation();

  // Load live company dashboard metrics from existing backend SSO dashboard API
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useGetDashboardMetricsQuery(
    activeCompanyId,
    { skip: !activeCompanyId }
  );

  const entitledModules = useMemo(() => getEntitledModules(authContext), [authContext]);

  const handleSelectCompany = (comp) => {
    dispatch(setSelectedCompany({
      id: comp.id,
      code: comp.code,
      name: comp.name || comp.legalName,
    }));
    setCompanyDropdownOpen(false);
  };

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore API logout error and proceed with local cleanup
    } finally {
      removeCookie('ACCESS_TOKEN');
      removeCookie('ACCESS_TOKEN_REFRESH');
      removeCookie('auth_token');
      localStorage.clear();
      sessionStorage.clear();
      dispatch(logoutAction());
      navigate('/login', { replace: true });
    }
  }, [logoutApi, dispatch, navigate]);

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const ownerName = user?.fullName || user?.username || 'Organization Owner';
  const ownerEmail = user?.email || user?.username || '';

  // Module launcher mapping
  const availableModuleLaunchers = [
    {
      id: 'ACCOUNT',
      name: 'Finance & Accounts',
      code: 'accounts',
      description: 'General ledger, charts of accounts, journal vouchers, invoices, accounts receivable & payable, taxation & reports.',
      icon: Calculator,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/80',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      path: '/accounts/dashboard',
      isEntitled: entitledModules.includes('ACCOUNT'),
    },
    {
      id: 'INVENTORY',
      name: 'Inventory Management',
      code: 'inventory',
      description: 'Real-time stock tracking, warehouses, product batches, inventory adjustments & valuation reports.',
      icon: Boxes,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/80',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      path: '/inventory/dashboard',
      isEntitled: entitledModules.includes('INVENTORY'),
    },
    {
      id: 'CRM',
      name: 'Sales & CRM',
      code: 'crm',
      description: 'Customer lifecycle, sales quotations, customer orders, lead tracking & sales analytics.',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/80',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      path: '/crm/dashboard',
      isEntitled: entitledModules.includes('CRM'),
    },
    {
      id: 'PURCHASES',
      name: 'Purchasing & Procurement',
      code: 'purchase',
      description: 'Purchase requisitions, supplier requests for quotation (RFQs), purchase orders & supplier invoices.',
      icon: Briefcase,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/80',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      path: '/purchase-requisitions',
      isEntitled: entitledModules.includes('PURCHASES') || entitledModules.includes('ACCOUNT'),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* ── Top Bar / Global Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Organization Context */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <MarkLogo className="h-8 w-auto object-contain cursor-pointer" onClick={() => navigate('/owner/dashboard')} />
            
            <div className="hidden sm:block h-6 w-px bg-zinc-200" />
            
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-black text-zinc-900 tracking-tight capitalize">
                    {orgName}
                  </span>
                  {orgCode && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {orgCode}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-zinc-400">Organization Workspace</span>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                <ShieldCheck size={11} className="text-emerald-600" />
                <span>Owner</span>
              </span>
            </div>
          </div>

          {/* Center / Right Actions */}
          <div className="flex items-center gap-3">
            
            {/* Active Company Switcher */}
            {companies.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Building2 size={14} className="text-zinc-500" />
                  <span className="max-w-[140px] truncate">{activeCompanyName}</span>
                  <ChevronDown size={13} className="text-zinc-400" />
                </button>

                {companyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCompanyDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-scale-up origin-top-right">
                      <div className="px-3 py-1.5 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Switch Company
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {companies.map((comp) => {
                          const isCurrent = comp.id === activeCompanyId || comp.code === activeCompanyCode;
                          return (
                            <button
                              key={comp.id || comp.code}
                              onClick={() => handleSelectCompany(comp)}
                              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                                isCurrent ? 'font-bold text-zinc-900 bg-zinc-50/80' : 'text-zinc-600'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="truncate">{comp.name || comp.legalName}</div>
                                {comp.code && (
                                  <div className="text-[10px] font-mono text-zinc-400 uppercase">
                                    {comp.code}
                                  </div>
                                )}
                              </div>
                              {isCurrent && <Check size={14} className="text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Profile & Logout Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 bg-white transition-all shadow-2xs group"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <span className="font-bold text-zinc-800 block truncate max-w-[120px]">{ownerName}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Owner</span>
                </div>
                <ChevronDown size={13} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-scale-up origin-top-right">
                    <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl mb-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">{ownerName}</p>
                      <p className="text-[11px] text-zinc-500 font-medium truncate">{ownerEmail}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Organization Owner
                      </div>
                    </div>

                    <div className="px-2 py-1 space-y-0.5">
                      <Link
                        to="/subscription"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                      >
                        <CreditCard size={14} className="text-zinc-500" />
                        <span>Subscription & Plan</span>
                      </Link>
                      
                      <Link
                        to="/accounts/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                      >
                        <Settings size={14} className="text-zinc-500" />
                        <span>Company Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-zinc-100 mt-1 pt-1 px-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                      >
                        <LogOut size={14} className="text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Global Subscription Notice Banner */}
      <SubscriptionNoticeBanner />

      {/* ── Main Dashboard Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-zinc-200 border border-white/10 mb-1">
                <Sparkles size={12} className="text-sky-400" />
                <span>Organization Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                {orgName}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Welcome, <span className="text-white font-bold">{ownerName}</span>. You have full executive control as the Organization Owner. Manage company workspaces, verify module entitlements, and launch business operations below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition-all shadow-sm active:scale-95"
              >
                <CreditCard size={14} className="text-zinc-900" />
                <span>Manage Plan</span>
              </Link>
              <button
                onClick={() => refetchMetrics && refetchMetrics()}
                title="Refresh metrics"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors backdrop-blur-md"
              >
                <RefreshCw size={13} className={metricsLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

          </div>
        </section>

        {/* ── Key Executive Metrics ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Organization Context */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Organization</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 size={16} />
              </div>
            </div>
            <div className="text-lg font-black text-zinc-900 truncate" title={orgName}>
              {orgName}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-zinc-500">
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-bold uppercase">{orgCode || 'ORG'}</span>
              <span>•</span>
              <span>{organization?.currency || 'INR'}</span>
              <span>•</span>
              <span className="capitalize">{organization?.status || 'ACTIVE'}</span>
            </div>
          </div>

          {/* Card 2: Active Plan & Trial */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Subscription</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="text-lg font-black text-zinc-900 truncate">
              {subscription?.planCode ? subscription.planCode.replace(/_/g, ' ') : '30-Day Free Trial'}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isTrial ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700'
              }`}>
                <Clock size={11} />
                <span>{daysRemaining !== null ? `${daysRemaining} days left` : 'Active'}</span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{authContext.accessMode || 'FULL'}</span>
            </div>
          </div>

          {/* Card 3: Active Company */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Primary Company</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Globe size={16} />
              </div>
            </div>
            <div className="text-lg font-black text-zinc-900 truncate" title={activeCompanyName}>
              {activeCompanyName}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-zinc-500">
              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-bold uppercase">{activeCompanyCode || 'COMP'}</span>
              <span>•</span>
              <span className="text-zinc-600 font-semibold">{companies.length} {companies.length === 1 ? 'Company' : 'Companies'}</span>
            </div>
          </div>

          {/* Card 4: Organization Owner Profile */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Owner Profile</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-lg font-black text-zinc-900 truncate" title={ownerName}>
              {ownerName}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 truncate">
              <span className="text-zinc-700 truncate">{ownerEmail}</span>
            </div>
          </div>

        </section>

        {/* ── Enterprise Application Launchpad ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-black text-zinc-900 tracking-tight">
                Enterprise Business Modules
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Launch authorized applications provisioned for {activeCompanyName} under your organization plan.
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-500 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
              {entitledModules.length} Active {entitledModules.length === 1 ? 'Module' : 'Modules'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {availableModuleLaunchers.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${
                    mod.isEntitled ? mod.borderColor : 'border-zinc-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${mod.bgColor} ${mod.color} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Icon size={20} />
                      </div>
                      {mod.isEntitled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                          Not Provisioned
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1 line-clamp-3">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-zinc-100">
                    {mod.isEntitled ? (
                      <Link
                        to={mod.path}
                        className={`w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all shadow-xs group-hover:shadow-md ${mod.buttonBg}`}
                      >
                        <span>Open {mod.name.split(' ')[0]}</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        to="/subscription"
                        className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                      >
                        <span>Upgrade to Enable</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Organization Companies Directory ── */}
        <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-display font-black text-zinc-900">
                Organization Companies ({companies.length})
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Companies registered under {orgName} accessible by your organization membership.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                to="/company-select"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <span>Company Directory</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Company Name</th>
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Access Context</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {companies.map((comp) => {
                  const isCurrent = comp.id === activeCompanyId || comp.code === activeCompanyCode;
                  return (
                    <tr key={comp.id || comp.code} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-zinc-900">
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-zinc-400" />
                          <span>{comp.name || comp.legalName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-600 font-bold uppercase">
                        {comp.code || '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-600">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            Current Active
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Secondary</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isCurrent ? (
                          <Link
                            to="/accounts/dashboard"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors"
                          >
                            <span>Open Modules</span>
                            <ArrowRight size={11} />
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleSelectCompany(comp)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-zinc-200 text-zinc-700 text-[11px] font-semibold hover:bg-zinc-50 transition-colors"
                          >
                            <span>Switch To</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Operational Metrics (Users, Roles & Portal Access Distribution) ── */}
        {metricsData && (
          <section className="space-y-4">
            <h2 className="text-base font-display font-black text-zinc-900">
              Company Operations & Security Context ({activeCompanyName})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <StatsCard
                title="Total Users"
                icon={Users}
                total={metricsData?.users?.total}
                active={metricsData?.users?.active}
                inactive={metricsData?.users?.inactive}
                blocked={metricsData?.users?.blocked}
                unverified={metricsData?.users?.unverified}
                colorClass="text-blue-500"
                bgClass="bg-blue-50"
              />
              <StatsCard
                title="Active Sessions"
                icon={KeyRound}
                total={metricsData?.sessions?.total}
                active={metricsData?.sessions?.active}
                activeLabel="Live"
                colorClass="text-emerald-500"
                bgClass="bg-emerald-50"
              />
              <StatsCard
                title="Configured Roles"
                icon={ShieldCheck}
                total={metricsData?.roles?.total}
                colorClass="text-purple-500"
                bgClass="bg-purple-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              <RoleTable roles={metricsData?.roles} />
              <PortalAccessTable portalAccess={metricsData?.portalAccess} />
            </div>
          </section>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Cloud ERP. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Organization: <strong className="text-zinc-600 font-mono">{orgCode}</strong></span>
            <span>•</span>
            <Link to="/subscription" className="hover:text-zinc-600 transition-colors">Subscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
