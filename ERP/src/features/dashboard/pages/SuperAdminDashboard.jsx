import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  Building2,
  ArrowRight,
  Layers,
  Server,
  Zap,
  ScrollText,
  UserCheck,
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
  Info
} from 'lucide-react';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
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
import apiClient from '../../../api/common/client';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function SuperAdminDashboard() {
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth?.user ?? null);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // ── Organization data (primary — platform admin org endpoints, no companyId)
  // NOTE: Organization API uses page (0-based) and size — NOT pageSize
  const {
    data: orgsData,
    isLoading: orgsLoading,
    error: orgsError
  } = useGetOrganizationsQuery({ page: 0, size: 100 }, { skip: !isSuperAdmin });

  // ── System admin dashboard overview (new aggregated endpoint)
  const {
    data: dashboardOverview,
    isLoading: overviewLoading,
    error: overviewError
  } = useGetSystemAdminDashboardOverviewQuery(undefined, { skip: !isSuperAdmin });

  // ── Fallback: global company data for module assignments and KPI fallback
  // Uses legacy /api/sso/company?page=0&pageSize=200 (requires page + pageSize params)
  const { data: companiesData, isLoading: companiesLoading } = useGetCompaniesQuery({ page: 0, pageSize: 200 });
  const companies = companiesData?.companies || [];

  const { data: companyModulesData, isLoading: modulesLoading } = useGetCompanyModulesQuery({ page: 1, pageSize: 50 });
  const [updateModuleStatus] = useUpdateCompanyModuleStatusMutation();
  const [deleteCompanyModule] = useDeleteCompanyModuleMutation();

  const { data: modulesData, isLoading: modulesDataLoading } = useGetModulesQuery(
    { page: 0, pageSize: 100 },
    { skip: !isSuperAdmin }
  );

  const [sessionsInfo, setSessionsInfo] = useState({ total: 0, active: 0, sessions: [] });
  const [liveStatsLoading, setLiveStatsLoading] = useState(false);
  const [liveStatsLoaded, setLiveStatsLoaded] = useState(false);

  const handleLoadLiveStats = async () => {
    if (!isSuperAdmin || companies.length === 0 || liveStatsLoading) return;
    setLiveStatsLoading(true);
    try {
      const sessionsResult = { sessions: [] };
      await Promise.all(companies.map(async (c) => {
        try {
          const res = await getCompanySessions(c.id, { page: 1, pageSize: 1000 });
          const sessions = res?.sessions || res || [];
          sessionsResult.sessions.push(...(Array.isArray(sessions) ? sessions : []));
        } catch (err) {
          // Ignore per-company errors
        }
      }));
      const sessions = sessionsResult.sessions || [];
      setSessionsInfo({
        total: sessions.length,
        active: sessions.filter((s) => s.active !== false).length,
        sessions,
      });
      setLiveStatsLoaded(true);
      dispatch(addAlert({ type: 'success', message: 'Live activity diagnostics updated.' }));
    } catch (e) {
      dispatch(addAlert({ type: 'error', message: 'Failed to load live admin activity' }));
    } finally {
      setLiveStatsLoading(false);
    }
  };

  // ── Derive KPI values
  // Prefer the new org-based overview; fall back to company-based counts
  const orgOverviewAvailable = !overviewError && dashboardOverview;

  const organizations = orgsData?.organizations || [];
  const totalOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations.total ?? organizations.length)
    : organizations.length;
  const activeOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations.active ?? organizations.filter(o => o.active).length)
    : organizations.filter(o => o.active).length;
  const suspendedOrgs = orgOverviewAvailable
    ? (dashboardOverview.organizations.suspended ?? Math.max(0, totalOrgs - activeOrgs))
    : Math.max(0, totalOrgs - activeOrgs);

  const totalMembers = orgOverviewAvailable
    ? (dashboardOverview.members.total ?? null)
    : null; // TODO(BACKEND): available once org endpoints are implemented

  const totalCompanies = orgOverviewAvailable
    ? (dashboardOverview.companies.total ?? companies.length)
    : companies.length;

  const modulesList = Array.isArray(modulesData)
    ? modulesData
    : modulesData?.modules || modulesData?.data?.content || modulesData?.content || modulesData?.data || [];
  const totalModules = orgOverviewAvailable
    ? (dashboardOverview.modules.total ?? modulesList.length)
    : modulesList.length;
  const activeModules = orgOverviewAvailable
    ? (dashboardOverview.modules.active ?? modulesList.filter(m => m.status === 'ACTIVE' || m.active).length)
    : modulesList.filter(m => m.status === 'ACTIVE' || m.active).length;

  const activeSessions = orgOverviewAvailable
    ? (dashboardOverview.sessions.active ?? sessionsInfo.active)
    : sessionsInfo.active;

  const companyModulesList = companyModulesData?.companyModuleResponse
    || (Array.isArray(companyModulesData) ? companyModulesData : companyModulesData?.data?.content || []);
  const activeAssignments = companyModulesList.filter(cm => cm.active !== false && cm.status !== 'INACTIVE').length;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Backend API availability indicator
  const orgApiMissing = !!orgsError;

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-12">

      {/* ── Dashboard Hero / Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-zinc-200/70">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldAlert size={12} />
              Platform Control Center
            </span>
            <span className="text-zinc-400 text-xs font-medium">
              {formattedDate}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {greeting}, {currentUser?.name || currentUser?.username || 'System Admin'}!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Organization-level platform overview. Monitor all organizations, member workspaces, and assigned modules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadLiveStats}
          disabled={liveStatsLoading || companies.length === 0}
          className="btn-secondary h-9 px-3.5 text-xs flex items-center gap-2 self-start sm:self-center shrink-0 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50"
          title={companies.length === 0 ? 'No organizations provisioned yet' : 'Fetch real-time sessions'}
        >
          <RefreshCw size={14} className={liveStatsLoading ? 'animate-spin text-primary' : 'text-zinc-500'} />
          <span>{liveStatsLoaded ? 'Refresh Live Activity' : 'Load Live Activity'}</span>
        </button>
      </div>

      {/* ── TODO(BACKEND) notice when org API is unavailable ── */}
      {orgApiMissing && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <Info size={15} className="shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-semibold">Organization API error:</span>{' '}
            <code className="font-mono bg-rose-100 px-1 rounded">/api/sso/admin/organizations</code> returned an error.
            Organization and Member KPI cards will be unavailable until the backend is reachable.
          </div>
        </div>
      )}

      {/* ── KPI Cards (8-card organization-first layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Organizations */}
        <KpiCard
          label="Organizations"
          value={orgsLoading ? null : totalOrgs}
          icon={Building2}
          color="blue"
          badgeText={`${activeOrgs} Active`}
          loading={orgsLoading}
          missing={orgApiMissing}
          linkTo={buildPath('/super-admin/organizations')}
        />
        {/* 2. Active Organizations */}
        <KpiCard
          label="Active Organizations"
          value={orgsLoading ? null : activeOrgs}
          icon={ShieldCheck}
          color="emerald"
          badgeText="Operational"
          loading={orgsLoading}
          missing={orgApiMissing}
        />
        {/* 3. Organization Members */}
        <KpiCard
          label="Org Members"
          value={totalMembers}
          icon={Users}
          color="indigo"
          badgeText="Total members"
          loading={overviewLoading}
          missing={orgApiMissing}
          todoNote="GET /api/sso/admin/dashboard"
        />
        {/* 4. Companies */}
        <KpiCard
          label="Companies"
          value={companiesLoading ? null : totalCompanies}
          icon={UserCog}
          color="violet"
          badgeText="Across all organizations"
          loading={companiesLoading}
          linkTo={buildPath('/super-admin/companies')}
        />
        {/* 5. Modules */}
        <KpiCard
          label="Modules"
          value={modulesDataLoading ? null : totalModules}
          icon={Layers}
          color="cyan"
          badgeText={`${activeModules} Active`}
          loading={modulesDataLoading}
          linkTo={buildPath('/super-admin/modules')}
        />
        {/* 6. Suspended Organizations */}
        <KpiCard
          label="Suspended Orgs"
          value={orgsLoading ? null : suspendedOrgs}
          icon={XCircle}
          color="rose"
          badgeText={`${suspendedOrgs} Suspended`}
          loading={orgsLoading}
          missing={orgApiMissing}
        />
        {/* 7. Active Sessions */}
        <KpiCard
          label="Active Sessions"
          value={liveStatsLoaded ? activeSessions : null}
          icon={Activity}
          color="amber"
          badgeText={liveStatsLoaded ? 'Live' : 'Click "Load Live Activity"'}
          loading={false}
        />
        {/* 8. System Health */}
        <KpiCard
          label="System Health"
          value={null}
          displayValue={
            dashboardOverview?.systemHealth?.api === 'HEALTHY' ? 'Healthy' : 'Checking…'
          }
          icon={Server}
          color="emerald"
          badgeText="API / DB / Integrations"
          loading={overviewLoading}
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left Column (Main, 8 cols) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Organization Overview Table */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Building2 size={16} className="text-zinc-500" />
                Organization Overview
              </h3>
              <Link
                to={buildPath('/super-admin/organizations')}
                className="text-xs font-bold text-primary hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[260px]">
              {orgsLoading ? (
                <div className="p-6"><TableRowSkeleton columns={5} rows={3} /></div>
              ) : orgApiMissing ? (
                /* Fallback to company list while org API is pending */
                companies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
                      <p className="text-[10px] text-amber-700 font-semibold">
                        Showing Companies (fallback) — Organization API pending backend implementation
                      </p>
                    </div>
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                        <tr>
                          <th className="p-3.5 w-12 text-center text-[10px] uppercase font-bold tracking-wider">#</th>
                          <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Company (Tenant)</th>
                          <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Code</th>
                          <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Status</th>
                          <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Created</th>
                          <th className="p-3.5 text-right text-[10px] uppercase font-bold tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {companies.slice(0, 5).map((company, index) => (
                          <tr key={company.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="p-3.5 text-center text-zinc-400 font-medium">{index + 1}</td>
                            <td className="p-3.5">
                              <Link
                                to={`/company/${company.id}/dashboard`}
                                onClick={() => localStorage.setItem('selected_company', JSON.stringify(company))}
                                className="font-semibold text-zinc-900 hover:text-primary transition-colors flex items-center gap-2.5"
                              >
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-100">
                                  {company?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="truncate max-w-[180px]">{company.name}</span>
                              </Link>
                            </td>
                            <td className="p-3.5">
                              <span className="font-mono text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                {company.code}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {company.active ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-zinc-500 text-xs">
                              {company.created ? new Date(company.created).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-3.5 text-right">
                              <Link
                                to={buildPath(`/super-admin/companies/${company.id}`)}
                                className="text-xs font-semibold text-zinc-500 hover:text-primary transition-colors inline-flex items-center gap-1"
                              >
                                Manage <ChevronRight size={13} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <OrgEmptyState buildPath={buildPath} />
                )
              ) : organizations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                      <tr>
                        <th className="p-3.5 w-12 text-center text-[10px] uppercase font-bold tracking-wider">#</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Organization</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Code</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Status</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Companies</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Members</th>
                        <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Created</th>
                        <th className="p-3.5 text-right text-[10px] uppercase font-bold tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {organizations.slice(0, 5).map((org, index) => (
                        <tr key={org.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-3.5 text-center text-zinc-400 font-medium">{index + 1}</td>
                          <td className="p-3.5">
                            <Link
                              to={buildPath(`/super-admin/organizations/${org.id}`)}
                              className="font-semibold text-zinc-900 hover:text-primary transition-colors flex items-center gap-2.5"
                            >
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-100">
                                {org?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="truncate max-w-[160px]">{org.name}</span>
                            </Link>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                              {org.code || '—'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <OrgStatusBadge status={org.status} active={org.active} />
                          </td>
                          <td className="p-3.5 text-zinc-700 font-semibold">{org.companyCount ?? '—'}</td>
                          <td className="p-3.5 text-zinc-700 font-semibold">{org.memberCount ?? '—'}</td>
                          <td className="p-3.5 text-zinc-500 text-xs">
                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3.5 text-right">
                            <Link
                              to={buildPath(`/super-admin/organizations/${org.id}`)}
                              className="text-xs font-semibold text-zinc-500 hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              Manage <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <OrgEmptyState buildPath={buildPath} />
              )}
            </div>
          </div>

          {/* Module Assignments (company-level — unchanged) */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Layers size={16} className="text-zinc-500" />
                Module Assignments
              </h3>
              <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 uppercase tracking-wider">
                {companyModulesList.length || 0} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              {modulesLoading ? (
                <div className="p-4"><TableRowSkeleton columns={6} rows={4} /></div>
              ) : companyModulesList.length > 0 ? (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium">
                    <tr>
                      <th className="p-3.5 w-12 text-center text-[10px] uppercase font-bold tracking-wider">#</th>
                      <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Company</th>
                      <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Module</th>
                      <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Host API</th>
                      <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Status</th>
                      <th className="p-3.5 text-right text-[10px] uppercase font-bold tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {companyModulesList.map((cm, idx) => (
                      <tr key={cm.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3.5 text-center font-medium text-zinc-400">{idx + 1}</td>
                        <td className="p-3.5">
                          <Link
                            to={buildPath('/super-admin/companies')}
                            className="font-semibold text-zinc-900 hover:text-primary transition-colors"
                          >
                            {cm.company?.companyName || cm.companyName || 'Unknown'}
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-zinc-800">{cm.module?.name || cm.moduleName || '—'}</span>
                        </td>
                        <td className="p-3.5">
                          {cm.module?.host ? (
                            <a
                              href={cm.module.host}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                            >
                              {cm.module.host}
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Not Configured</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateModuleStatus({ id: cm.id, active: !cm.active }).unwrap();
                                dispatch(addAlert({ type: 'success', message: 'Status updated successfully' }));
                              } catch (e) {
                                dispatch(addAlert({ type: 'error', message: 'Failed to update status' }));
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border cursor-pointer hover:scale-105 transition-transform ${
                              cm.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cm.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {cm.active ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: 'Remove Module Assignment?',
                                message: `Remove ${cm.module?.name || 'this module'} from ${cm.company?.companyName || 'this company'}?`,
                                confirmLabel: 'Remove',
                                isDestructive: true
                              });
                              if (ok) {
                                try {
                                  await deleteCompanyModule(cm.id).unwrap();
                                  dispatch(addAlert({ type: 'success', message: 'Assignment removed successfully' }));
                                } catch (e) {
                                  dispatch(addAlert({ type: 'error', message: 'Failed to remove assignment' }));
                                }
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Remove Assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center bg-zinc-50/40">
                  <Layers className="mx-auto text-zinc-300 mb-2" size={28} />
                  <p className="text-xs font-semibold text-zinc-700">No modules assigned yet</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Navigate to Companies to assign modules.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column (4 cols) ── */}
        <div className="lg:col-span-4 space-y-6">

          <HealthCard
            activeSessions={sessionsInfo.active}
            activeAssignments={activeAssignments}
            liveStatsLoaded={liveStatsLoaded}
            dashboardOverview={dashboardOverview}
          />

          <QuickActionsCard buildPath={buildPath} />

        </div>
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Organization Status Badge
// ──────────────────────────────────────────────────────────────────
function OrgStatusBadge({ status, active }) {
  const s = status || (active ? 'ACTIVE' : 'INACTIVE');
  if (s === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  );
  if (s === 'SUSPENDED') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> {s}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Empty State for Organization Overview
// ──────────────────────────────────────────────────────────────────
function OrgEmptyState({ buildPath }) {
  return (
    <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[260px] max-h-[320px]">
      <div className="w-12 h-12 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-center mb-3 text-zinc-400 shadow-2xs">
        <Building2 size={24} />
      </div>
      <h4 className="text-sm font-semibold text-zinc-900 mb-1">No organizations provisioned yet</h4>
      <p className="text-xs text-zinc-500 mb-5 max-w-sm">Create your first organization to get started.</p>
      <Link
        to={buildPath('/super-admin/organizations/provision')}
        className="btn-primary text-xs inline-flex items-center gap-1.5 px-4 py-2"
      >
        <Plus size={14} /> Provision Organization
      </Link>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// KPI Card Component
// ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, displayValue, icon: Icon, color = 'blue', badgeText, loading = false, missing = false, linkTo, todoNote }) {
  const styles = {
    blue: { iconBg: 'bg-blue-50 text-blue-600 border-blue-100', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    indigo: { iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    emerald: { iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    rose: { iconBg: 'bg-rose-50 text-rose-600 border-rose-100', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    violet: { iconBg: 'bg-violet-50 text-violet-600 border-violet-100', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    cyan: { iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
    amber: { iconBg: 'bg-amber-50 text-amber-600 border-amber-100', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  };

  const style = styles[color] || styles.blue;

  const displayedValue = displayValue ?? (loading ? null : (missing ? '—' : (value !== null && value !== undefined ? value : '—')));

  const inner = (
    <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${style.iconBg}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          {loading ? (
            <span className="inline-block w-12 h-8 bg-zinc-100 animate-pulse rounded" />
          ) : displayedValue}
        </p>
        {badgeText && (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border ${style.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {badgeText}
          </span>
        )}
        {todoNote && (
          <span className="block text-[9px] text-zinc-400 italic">{todoNote}</span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block">{inner}</Link>;
  }
  return inner;
}

// ──────────────────────────────────────────────────────────────────
// System Health Card
// ──────────────────────────────────────────────────────────────────
function HealthCard({ activeSessions, activeAssignments, liveStatsLoaded, dashboardOverview }) {
  const health = dashboardOverview?.systemHealth;
  const apiStatus = health?.api || 'UNKNOWN';
  const dbStatus = health?.database || 'UNKNOWN';
  const intStatus = health?.integrations || 'UNKNOWN';

  const statusBadge = (s) => {
    if (s === 'HEALTHY') return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy</span>;
    if (s === 'DEGRADED') return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Degraded</span>;
    if (s === 'OFFLINE') return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Offline</span>;
    return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-600 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Unknown</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Activity size={16} className="text-zinc-500" />
          System Health
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>

      <div className="space-y-2.5">
        <HealthRow icon={Server} label="API Servers" badge={statusBadge(apiStatus)} detail="All endpoints responding" />
        <HealthRow
          icon={Users}
          label="Active Sessions"
          badge={liveStatsLoaded
            ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {activeSessions} Active</span>
            : <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Standby</span>}
          detail={liveStatsLoaded ? 'Current authenticated sessions' : "Click 'Load Live Activity'"}
        />
        <HealthRow icon={Layers} label="Module Integrations" badge={statusBadge(intStatus)} detail={`${activeAssignments} active connections`} />
      </div>
    </div>
  );
}

function HealthRow({ icon: Icon, label, badge, detail }) {
  return (
    <div className="border border-zinc-100 rounded-lg p-3 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center">
            <Icon size={13} />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
        {badge}
      </div>
      <p className="text-xs text-zinc-500 pl-8">{detail}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Quick Actions Card
// ──────────────────────────────────────────────────────────────────
function QuickActionsCard({ buildPath }) {
  const actions = [
    { label: 'Manage Organizations', path: '/super-admin/organizations', icon: Building2 },
    { label: 'Provision Organization', path: '/super-admin/organizations/provision', icon: Plus },
    { label: 'Module Registry', path: '/super-admin/modules', icon: Layers },
    { label: 'Global Users', path: '/super-admin/users', icon: Users },
    { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: ScrollText },
    { label: 'System Roles', path: '/super-admin/roles', icon: UserCheck },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Zap size={16} className="text-zinc-500" />
          Quick Actions
        </h3>
      </div>

      <div className="space-y-1.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.path}
              to={buildPath(act.path)}
              className="flex items-center justify-between h-11 px-3 rounded-lg border border-transparent hover:border-zinc-200/80 hover:bg-zinc-50 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex items-center justify-center">
                  <Icon size={14} />
                </div>
                <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {act.label}
                </span>
              </div>
              <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
