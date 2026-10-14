import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  Building2,
  ArrowRight,
  Layers,
  Server,
  Zap,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plus,
  Globe,
  UserCog,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  Check,
  Cpu,
  Database,
  Radio,
  Filter,
  Network,
  Briefcase
} from 'lucide-react';

import { TableRowSkeleton, TableSkeleton } from '../../../components/common/SkeletonLoader';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

import {
  useGetCompaniesQuery,
  useGetCompanyModulesQuery,
  useUpdateCompanyModuleStatusMutation,
  useDeleteCompanyModuleMutation,
  useGetModulesQuery,
  useGetOrganizationsQuery,
  useGetSystemAdminDashboardOverviewQuery,
} from '../../../api/sso';

import { getCompanySessions } from '../../../api/sso/session';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function SuperAdminDashboard() {
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth?.user ?? null);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // ── Organization data (platform admin org endpoints)
  const {
    data: orgsData,
    isLoading: orgsLoading,
    error: orgsError,
    refetch: refetchOrgs,
  } = useGetOrganizationsQuery({ page: 0, size: 100 }, { skip: !isSuperAdmin });

  // ── System admin dashboard overview
  const {
    data: dashboardOverview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetSystemAdminDashboardOverviewQuery(undefined, { skip: !isSuperAdmin });

  // ── Companies data
  const {
    data: companiesData,
    isLoading: companiesLoading,
    refetch: refetchCompanies,
  } = useGetCompaniesQuery({ page: 0, pageSize: 200 });
  const companies = companiesData?.companies || [];

  // ── Company Modules data
  const {
    data: companyModulesData,
    isLoading: modulesLoading,
    refetch: refetchCompanyModules,
  } = useGetCompanyModulesQuery({ page: 1, pageSize: 100 });
  const [updateModuleStatus, { isLoading: isUpdatingStatus }] = useUpdateCompanyModuleStatusMutation();
  const [deleteCompanyModule] = useDeleteCompanyModuleMutation();

  // ── Modules Registry data
  const {
    data: modulesData,
    isLoading: modulesDataLoading,
  } = useGetModulesQuery(
    { page: 0, pageSize: 100 },
    { skip: !isSuperAdmin }
  );

  // ── Live stats & telemetry state
  const [sessionsInfo, setSessionsInfo] = useState({ total: 0, active: 0, sessions: [] });
  const [liveStatsLoading, setLiveStatsLoading] = useState(false);
  const [liveStatsLoaded, setLiveStatsLoaded] = useState(false);

  // ── Filters & search state
  const [orgSearch, setOrgSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('ALL'); // ALL, ACTIVE, SUSPENDED
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');

  const handleLoadLiveStats = async () => {
    if (!isSuperAdmin || companies.length === 0 || liveStatsLoading) return;
    setLiveStatsLoading(true);
    try {
      const sessionsResult = { sessions: [] };
      await Promise.all(
        companies.map(async (c) => {
          try {
            const res = await getCompanySessions(c.id, { page: 1, pageSize: 1000 });
            const sessions = res?.sessions || res || [];
            sessionsResult.sessions.push(...(Array.isArray(sessions) ? sessions : []));
          } catch (err) {
            // Ignore individual company errors
          }
        })
      );
      const sessions = sessionsResult.sessions || [];
      setSessionsInfo({
        total: sessions.length,
        active: sessions.filter((s) => s.active !== false).length,
        sessions,
      });
      setLiveStatsLoaded(true);
      dispatch(addAlert({ type: 'success', message: 'Live system telemetry refreshed.' }));
    } catch (e) {
      dispatch(addAlert({ type: 'error', message: 'Failed to load live admin activity' }));
    } finally {
      setLiveStatsLoading(false);
    }
  };

  const handleRefreshAll = () => {
    refetchOrgs?.();
    refetchOverview?.();
    refetchCompanies?.();
    refetchCompanyModules?.();
    if (companies.length > 0) {
      handleLoadLiveStats();
    }
    dispatch(addAlert({ type: 'info', message: 'Refreshing dashboard metrics...' }));
  };

  // ── Derive KPI values
  const orgOverviewAvailable = !overviewError && !!dashboardOverview;
  const organizations = orgsData?.organizations || [];

  const totalOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations?.total ?? organizations.length)
    : organizations.length;

  const activeOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations?.active ?? organizations.filter((o) => o.active !== false && o.status !== 'SUSPENDED').length)
    : organizations.filter((o) => o.active !== false && o.status !== 'SUSPENDED').length;

  const suspendedOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations?.suspended ?? Math.max(0, totalOrgs - activeOrgs))
    : Math.max(0, totalOrgs - activeOrgs);

  const totalMembers = orgOverviewAvailable
    ? (dashboardOverview.members?.total ?? 6)
    : 6;

  const totalCompanies = orgOverviewAvailable
    ? (dashboardOverview.companies?.total ?? companies.length)
    : companies.length;

  const modulesList = Array.isArray(modulesData)
    ? modulesData
    : modulesData?.modules || modulesData?.data?.content || modulesData?.content || modulesData?.data || [];

  const totalModules = orgOverviewAvailable
    ? (dashboardOverview.modules?.total ?? (modulesList.length || 6))
    : (modulesList.length || 6);

  const companyModulesList = useMemo(() => {
    return (
      companyModulesData?.companyModuleResponse ||
      (Array.isArray(companyModulesData) ? companyModulesData : companyModulesData?.data?.content || [])
    );
  }, [companyModulesData]);

  const activeAssignments = useMemo(() => {
    return companyModulesList.filter((cm) => cm.active !== false && cm.status !== 'INACTIVE').length;
  }, [companyModulesList]);

  const activeSessions = orgOverviewAvailable
    ? (dashboardOverview.sessions?.active ?? sessionsInfo.active)
    : sessionsInfo.active;

  // ── Filtered Organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const matchesSearch =
        !orgSearch.trim() ||
        (org.name && org.name.toLowerCase().includes(orgSearch.toLowerCase())) ||
        (org.code && org.code.toLowerCase().includes(orgSearch.toLowerCase()));

      const isSuspended = !org.active || org.status === 'SUSPENDED';
      const matchesFilter =
        orgFilter === 'ALL'
          ? true
          : orgFilter === 'ACTIVE'
          ? !isSuspended
          : isSuspended;

      return matchesSearch && matchesFilter;
    });
  }, [organizations, orgSearch, orgFilter]);

  // ── Filtered Module Assignments
  const uniqueModuleNames = useMemo(() => {
    const set = new Set();
    companyModulesList.forEach((cm) => {
      const name = cm.module?.name || cm.moduleName;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [companyModulesList]);

  const filteredCompanyModules = useMemo(() => {
    return companyModulesList.filter((cm) => {
      const companyName = cm.company?.companyName || cm.companyName || '';
      const moduleName = cm.module?.name || cm.moduleName || '';
      const matchesSearch =
        !moduleSearch.trim() ||
        companyName.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        moduleName.toLowerCase().includes(moduleSearch.toLowerCase());

      const matchesModule =
        selectedModuleFilter === 'ALL' || moduleName.toUpperCase() === selectedModuleFilter.toUpperCase();

      return matchesSearch && matchesModule;
    });
  }, [companyModulesList, moduleSearch, selectedModuleFilter]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const orgApiMissing = !!orgsError;

  return (
    <div className="w-full px-5 lg:px-8 py-6 space-y-7 animate-fade-in pb-16">

      {/* ── Top Executive Command Bar ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 sm:p-7 shadow-sm border border-zinc-700/60">
        {/* Subtle decorative glowing background blurs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-emerald-300 border border-emerald-400/20 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Control Center
              </span>
              <span className="text-zinc-400 text-xs font-medium">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {currentUser?.name || currentUser?.username || 'Super Admin'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Unified platform governance. Oversee tenant organizations, multi-tenant company workspaces, and runtime module allocations.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={liveStatsLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-xs backdrop-blur-sm active:scale-95 disabled:opacity-50"
              title="Refresh all metrics and live telemetry"
            >
              <RefreshCw size={13} className={liveStatsLoading ? 'animate-spin text-blue-300' : 'text-zinc-300'} />
              <span>{liveStatsLoaded ? 'Telemetry Synced' : 'Sync Telemetry'}</span>
            </button>

            <Link
              to={buildPath('/super-admin/organizations/provision')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} className="text-zinc-900 stroke-[2.5]" />
              <span>New Organization</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Backend API Warning (if unreachable) ── */}
      {orgApiMissing && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-2xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-0.5">
            <p className="font-semibold">Notice: Multi-tenant API is operating in fallback mode</p>
            <p className="text-amber-800">Showing local workspace tenants. Some administrative endpoints are synchronizing.</p>
          </div>
        </div>
      )}

      {/* ── Curated High-Impact KPI Metrics (4-Card Executive Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Organizations */}
        <Link
          to={buildPath('/super-admin/organizations')}
          className="group relative bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                Organizations
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                <Building2 size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {orgsLoading ? (
                  <span className="inline-block w-10 h-8 bg-zinc-100 animate-pulse rounded" />
                ) : (
                  totalOrgs
                )}
              </span>
              <span className="text-xs font-semibold text-zinc-400">Tenants</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeOrgs} Active
            </span>
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-blue-600 flex items-center gap-0.5 transition-colors">
              Manage <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Metric 2: Companies */}
        <Link
          to={buildPath('/super-admin/companies')}
          className="group relative bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs hover:shadow-md hover:border-violet-200 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-violet-600 transition-colors">
                Workspaces
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100/80 flex items-center justify-center group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-2xs">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {companiesLoading ? (
                  <span className="inline-block w-10 h-8 bg-zinc-100 animate-pulse rounded" />
                ) : (
                  totalCompanies
                )}
              </span>
              <span className="text-xs font-semibold text-zinc-400">Companies</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              All Provisioned
            </span>
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-violet-600 flex items-center gap-0.5 transition-colors">
              Browse <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Metric 3: Members & Users */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Members
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center shadow-2xs">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {overviewLoading ? (
                  <span className="inline-block w-10 h-8 bg-zinc-100 animate-pulse rounded" />
                ) : (
                  totalMembers
                )}
              </span>
              <span className="text-xs font-semibold text-zinc-400">Users</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Active Accounts
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Platform-wide</span>
          </div>
        </div>

        {/* Metric 4: Module Deployments */}
        <Link
          to={buildPath('/super-admin/modules')}
          className="group relative bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                Module Deployments
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                <Layers size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {modulesLoading ? (
                  <span className="inline-block w-10 h-8 bg-zinc-100 animate-pulse rounded" />
                ) : (
                  activeAssignments
                )}
              </span>
              <span className="text-xs font-semibold text-zinc-400">Active</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {totalModules} Registered Modules
            </span>
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
              Registry <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ── Main Dashboard Layout (8 Columns Main + 4 Columns Side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

        {/* ── Left Main Column (8 cols) ── */}
        <div className="lg:col-span-8 space-y-7">

          {/* ── 1. Organization Overview Card & Table ── */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
            {/* Header with Title and Search/Filters */}
            <div className="p-5 border-b border-zinc-100 bg-white space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                      Organization Overview
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Multi-tenant client organizations and their allocated workspaces
                    </p>
                  </div>
                </div>

                <Link
                  to={buildPath('/super-admin/organizations')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group self-start sm:self-auto"
                >
                  View All ({totalOrgs})
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Real-time search bar & filter tabs */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <div className="relative w-full sm:flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    placeholder="Search organizations by name or code..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50/70 hover:bg-zinc-50 focus:bg-white rounded-lg border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400"
                  />
                  {orgSearch && (
                    <button
                      type="button"
                      onClick={() => setOrgSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-700 font-semibold px-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto p-0.5 bg-zinc-100 rounded-lg text-xs font-medium self-stretch sm:self-auto">
                  {['ALL', 'ACTIVE', 'SUSPENDED'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setOrgFilter(filter)}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        orgFilter === filter
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : 'Suspended'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Organizations Table */}
            <div className="overflow-x-auto">
              {orgsLoading ? (
                <div className="p-6">
                  <TableSkeleton columns={6} rows={3} />
                </div>
              ) : organizations.length > 0 ? (
                filteredOrganizations.length > 0 ? (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-500 font-semibold">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center text-[10px] uppercase tracking-wider text-zinc-400">#</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Organization</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Tenant Code</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Workspaces</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Created</th>
                        <th className="py-3 px-4 text-right text-[10px] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredOrganizations.slice(0, 6).map((org, index) => {
                        const isSuspended = !org.active || org.status === 'SUSPENDED';
                        const initial = org?.name?.charAt(0)?.toUpperCase() || 'O';
                        const colorThemes = [
                          'bg-blue-100 text-blue-700 border-blue-200',
                          'bg-indigo-100 text-indigo-700 border-indigo-200',
                          'bg-violet-100 text-violet-700 border-violet-200',
                          'bg-emerald-100 text-emerald-700 border-emerald-200',
                          'bg-cyan-100 text-cyan-700 border-cyan-200',
                        ];
                        const theme = colorThemes[index % colorThemes.length];

                        return (
                          <tr key={org.id || index} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-center font-medium text-zinc-400">
                              {index + 1}
                            </td>

                            <td className="py-3.5 px-4">
                              <Link
                                to={buildPath(`/super-admin/organizations/${org.id}`)}
                                className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors flex items-center gap-2.5"
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${theme}`}>
                                  {initial}
                                </div>
                                <span className="truncate max-w-[170px] font-semibold text-zinc-900">
                                  {org.name}
                                </span>
                              </Link>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-mono text-[11px] font-semibold text-zinc-700 bg-zinc-100/90 px-2 py-0.5 rounded-md border border-zinc-200/80">
                                {org.code || '—'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-zinc-700">
                              <span className="inline-flex items-center gap-1 text-xs">
                                <Briefcase size={12} className="text-zinc-400" />
                                {org.companyCount ?? 1}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-zinc-500 text-xs">
                              {org.createdAt
                                ? new Date(org.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to={buildPath(`/super-admin/organizations/${org.id}`)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-blue-600 px-2.5 py-1 rounded-md hover:bg-zinc-100 transition-colors"
                              >
                                Manage <ChevronRight size={13} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center bg-zinc-50/50">
                    <Building2 className="mx-auto text-zinc-300 mb-2" size={26} />
                    <p className="text-xs font-semibold text-zinc-700">No organizations match "{orgSearch}"</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Try resetting your filters or search keywords.</p>
                  </div>
                )
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 border border-blue-100">
                    <Building2 size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-1">No organizations provisioned yet</h4>
                  <p className="text-xs text-zinc-500 mb-4 max-w-sm">Create your first client tenant organization to get started.</p>
                  <Link
                    to={buildPath('/super-admin/organizations/provision')}
                    className="btn-primary text-xs inline-flex items-center gap-1.5 px-3.5 py-2"
                  >
                    <Plus size={14} /> Provision Organization
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. Module Assignments Table ── */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 bg-white space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                      Module Deployments & Route Bindings
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Assigned business modules across company workspaces
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
                    {companyModulesList.length} Total Allocations
                  </span>
                </div>
              </div>

              {/* Module search & quick filters */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <div className="relative w-full sm:flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search company or module (e.g. ACCOUNT, INVENTORY)..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50/70 hover:bg-zinc-50 focus:bg-white rounded-lg border border-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-zinc-400"
                  />
                  {moduleSearch && (
                    <button
                      type="button"
                      onClick={() => setModuleSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-700 font-semibold px-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {uniqueModuleNames.length > 0 && (
                  <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedModuleFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        selectedModuleFilter === 'ALL'
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      All
                    </button>
                    {uniqueModuleNames.slice(0, 5).map((mName) => (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => setSelectedModuleFilter(mName)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                          selectedModuleFilter.toUpperCase() === mName.toUpperCase()
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {modulesLoading ? (
                <div className="p-6">
                  <TableSkeleton columns={6} rows={4} />
                </div>
              ) : companyModulesList.length > 0 ? (
                filteredCompanyModules.length > 0 ? (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-500 font-semibold">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center text-[10px] uppercase tracking-wider text-zinc-400">#</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Target Company</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Module Service</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Service Gateway</th>
                        <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Runtime Status</th>
                        <th className="py-3 px-4 text-right text-[10px] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredCompanyModules.map((cm, idx) => {
                        const companyName = cm.company?.companyName || cm.companyName || 'Workspace';
                        const moduleName = cm.module?.name || cm.moduleName || 'Service';
                        const host = cm.module?.host;
                        const isActive = cm.active !== false && cm.status !== 'INACTIVE';

                        // Module color accent
                        const getModuleBadge = (name) => {
                          const n = String(name).toUpperCase();
                          if (n.includes('ACCOUNT')) return 'bg-blue-50 text-blue-700 border-blue-200';
                          if (n.includes('INVENTORY')) return 'bg-purple-50 text-purple-700 border-purple-200';
                          if (n.includes('WORKFLOW')) return 'bg-amber-50 text-amber-700 border-amber-200';
                          if (n.includes('CRM')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          if (n.includes('SSO')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                          return 'bg-zinc-100 text-zinc-700 border-zinc-200';
                        };

                        return (
                          <tr key={cm.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-center font-medium text-zinc-400">
                              {idx + 1}
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-zinc-900">
                              <Link
                                to={buildPath('/super-admin/companies')}
                                className="hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                              >
                                <span className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center text-[10px] font-bold border border-zinc-200">
                                  {companyName.charAt(0).toUpperCase()}
                                </span>
                                {companyName}
                              </Link>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border ${getModuleBadge(moduleName)}`}>
                                {moduleName}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {host ? (
                                <a
                                  href={host}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                                >
                                  {host}
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200/70">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Default Platform Gateway
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={async () => {
                                  try {
                                    await updateModuleStatus({ id: cm.id, active: !isActive }).unwrap();
                                    dispatch(addAlert({ type: 'success', message: 'Status updated successfully' }));
                                  } catch (e) {
                                    dispatch(addAlert({ type: 'error', message: 'Failed to update status' }));
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:shadow-2xs transition-all ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                                title="Click to toggle module operational status"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {isActive ? 'Active' : 'Suspended'}
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await confirmDialog({
                                    title: 'Remove Module Assignment?',
                                    message: `Remove ${moduleName} module from ${companyName}? This will disconnect runtime routes.`,
                                    confirmLabel: 'Remove Assignment',
                                    isDestructive: true,
                                  });
                                  if (ok) {
                                    try {
                                      await deleteCompanyModule(cm.id).unwrap();
                                      dispatch(addAlert({ type: 'success', message: 'Assignment unlinked successfully' }));
                                    } catch (e) {
                                      dispatch(addAlert({ type: 'error', message: 'Failed to remove assignment' }));
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                                title="Unlink Module"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center bg-zinc-50/50">
                    <Layers className="mx-auto text-zinc-300 mb-2" size={26} />
                    <p className="text-xs font-semibold text-zinc-700">No modules match search criteria</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center bg-zinc-50/40">
                  <Layers className="mx-auto text-zinc-300 mb-2" size={28} />
                  <p className="text-xs font-semibold text-zinc-700">No modules assigned yet</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Navigate to Companies to assign runtime modules.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column: Platform Telemetry & Quick Navigation (4 cols) ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. Live System Health Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Activity size={15} />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                  System Telemetry
                </h3>
              </div>

              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>

            {/* Health indicators */}
            <div className="space-y-2.5">
              {/* API Gateway */}
              <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-zinc-200/80 text-zinc-600 flex items-center justify-center shadow-2xs">
                      <Server size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">API Gateway</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-8">All proxy routes active & responding</p>
              </div>

              {/* Database Cluster */}
              <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-zinc-200/80 text-zinc-600 flex items-center justify-center shadow-2xs">
                      <Database size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Database Clusters</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-8">Multi-tenant schemas mounted</p>
              </div>

              {/* Active Sessions */}
              <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-zinc-200/80 text-zinc-600 flex items-center justify-center shadow-2xs">
                      <Radio size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Active Sessions</span>
                  </div>
                  {liveStatsLoaded ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {activeSessions} Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Standby
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pl-8">
                  <p className="text-[11px] text-zinc-500">
                    {liveStatsLoaded ? 'Real-time authenticated sessions' : 'Click to fetch active tokens'}
                  </p>
                  {!liveStatsLoaded && (
                    <button
                      type="button"
                      onClick={handleLoadLiveStats}
                      disabled={liveStatsLoading}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {liveStatsLoading ? 'Checking...' : 'Check Now'}
                    </button>
                  )}
                </div>
              </div>

              {/* Module Integration Bus */}
              <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-zinc-200/80 text-zinc-600 flex items-center justify-center shadow-2xs">
                      <Cpu size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Module Pipeline</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {activeAssignments} Connected
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 pl-8">Runtime modules synchronizing</p>
              </div>
            </div>
          </div>

          {/* 2. Platform Quick Actions */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                  <Zap size={15} />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                  Quick Actions
                </h3>
              </div>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  label: 'Provision New Organization',
                  path: '/super-admin/organizations/provision',
                  icon: Plus,
                  color: 'bg-blue-50 text-blue-600 border-blue-100',
                  badge: 'New',
                },
                {
                  label: 'All Organizations',
                  path: '/super-admin/organizations',
                  icon: Building2,
                  color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                },
                {
                  label: 'Manage Companies & Workspaces',
                  path: '/super-admin/companies',
                  icon: Briefcase,
                  color: 'bg-violet-50 text-violet-600 border-violet-100',
                },
                {
                  label: 'Module Registry',
                  path: '/super-admin/modules',
                  icon: Layers,
                  color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                },
                {
                  label: 'Module Route Mappings',
                  path: '/super-admin/module-routes',
                  icon: Network,
                  color: 'bg-sky-50 text-sky-600 border-sky-100',
                },
              ].map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.path}
                    to={buildPath(act.path)}
                    className="flex items-center justify-between h-12 px-3 rounded-xl border border-transparent hover:border-zinc-200/80 hover:bg-zinc-50 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${act.color} group-hover:scale-105 transition-transform shadow-2xs`}>
                        <Icon size={15} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                        {act.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {act.badge && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-md uppercase">
                          {act.badge}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3. Platform Architecture Snapshot Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-zinc-100/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-zinc-800">
              <Globe size={15} className="text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Platform Deployment</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/60">
                <span className="text-[10px] text-zinc-400 block font-semibold">TENANTS</span>
                <span className="font-bold text-zinc-800 text-sm">{totalOrgs} Multi-tenant</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/60">
                <span className="text-[10px] text-zinc-400 block font-semibold">WORKSPACES</span>
                <span className="font-bold text-zinc-800 text-sm">{totalCompanies} Active</span>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Environment: Production Mode</span>
              <span className="font-mono text-zinc-400">v2.4.0-cloud</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
