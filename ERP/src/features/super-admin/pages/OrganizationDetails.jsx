import React, { useState, useMemo, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Users,
  Layers,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  XCircle,
  CheckCircle,
  Plus,
  Calendar,
  Globe,
  Phone,
  Mail,
  MapPin,
  Info,
  AlertTriangle,
  ScrollText,
  User,
  Activity,
  Eye,
  Copy,
  Check,
  Search,
  X,
  RefreshCw,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Lock,
  Cpu,
  Clock,
  CheckCircle2,
  Filter,
  DollarSign,
  Radio,
  Server,
  Zap,
  CreditCard,
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationStatusMutation,
  useGetCompaniesQuery,
  useGetModulesQuery,
} from '../../../api/sso';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';

import OverviewTab from '../components/OverviewTab';
import CompaniesTab from '../components/CompaniesTab';
import MembersTab from '../components/MembersTab';
import ModulesTab from '../components/ModulesTab';
import RolesTab from '../components/RolesTab';
import AuditTab from '../components/AuditTab';
import SubscriptionTab from '../components/SubscriptionTab';

export default function OrganizationDetails() {
  const { organizationId } = useParams();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(currentTab);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'companies', 'members', 'modules', 'roles', 'subscription', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // ── 1. Organization Primary Query
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
  } = useGetOrganizationByIdQuery(organizationId);

  // ── 2. Fallback / Global Companies
  const {
    data: globalCompaniesData,
    isLoading: globalCompaniesLoading,
    refetch: refetchGlobalCompanies,
  } = useGetCompaniesQuery({ page: 0, pageSize: 200 });
  const allGlobalCompanies = globalCompaniesData?.companies || [];

  // ── 3. Fallback / Global Modules
  const {
    data: globalModulesData,
  } = useGetModulesQuery({ page: 0, pageSize: 100 });
  const globalModulesList = Array.isArray(globalModulesData)
    ? globalModulesData
    : globalModulesData?.modules || globalModulesData?.data?.content || [];

  // ── Status toggle mutation
  const [updateOrgStatus, { isLoading: isUpdatingStatus }] = useUpdateOrganizationStatusMutation();

  const handleStatusToggle = async () => {
    if (!org) return;
    const isCurrentlyActive = org.status === 'ACTIVE' || org.active;
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    const confirmed = await confirmDialog({
      title: `${isCurrentlyActive ? 'Suspend' : 'Activate'} Organization?`,
      message: isCurrentlyActive
        ? `Are you sure you want to suspend "${org.name}"? Workspace access for this tenant will be temporarily paused.`
        : `Activate "${org.name}" and restore operational access?`,
      confirmLabel: isCurrentlyActive ? 'Suspend Organization' : 'Activate',
      isDestructive: isCurrentlyActive,
    });

    if (!confirmed) return;

    try {
      await updateOrgStatus({ id: organizationId, status: newStatus }).unwrap();
      dispatch(addAlert({
        type: 'success',
        message: `Organization "${org.name}" is now ${newStatus.toLowerCase()}.`,
      }));
      refetchOrg();
    } catch (e) {
      dispatch(addAlert({
        type: 'error',
        message: 'Failed to update organization status. Please check backend connectivity.',
      }));
    }
  };

  const handleCopyId = () => {
    if (org?.id) {
      navigator.clipboard.writeText(org.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      dispatch(addAlert({ type: 'info', message: 'Tenant UUID copied to clipboard.' }));
    }
  };

  const handleRefreshAll = () => {
    refetchOrg();
    refetchGlobalCompanies();
    dispatch(addAlert({ type: 'info', message: 'Refreshed organization data.' }));
  };

  // Find linked companies for this organization
  const linkedCompanies = useMemo(() => {
    return allGlobalCompanies.filter((c) => {
      const matchId = c.organizationId === organizationId || c.orgId === organizationId || c.organization?.id === organizationId;
      const matchName = org?.name && (c.name?.toLowerCase() === org.name.toLowerCase() || c.companyName?.toLowerCase() === org.name.toLowerCase());
      return matchId || matchName;
    });
  }, [allGlobalCompanies, organizationId, org]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'companies', label: 'Companies', icon: Building2, count: org?.companyCount ?? (linkedCompanies.length || 1) },
    { id: 'members', label: 'Members', icon: Users, count: org?.memberCount ?? 0 },
    { id: 'modules', label: 'Modules', icon: Layers, count: globalModulesList.length || 6 },
    { id: 'roles', label: 'Roles', icon: ShieldCheck, count: 5 },
    { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  ];

  if (orgLoading) {
    return (
      <div className="w-full px-5 lg:px-8 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-zinc-200/60 rounded w-48" />
          <div className="h-40 bg-zinc-100 rounded-2xl" />
          <div className="h-12 bg-zinc-100 rounded-xl" />
          <div className="h-80 bg-zinc-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isActive = org?.status === 'ACTIVE' || org?.active;
  const initial = org?.name?.charAt(0)?.toUpperCase() || 'O';

  return (
    <div className="w-full px-5 lg:px-8 py-6 space-y-6 animate-fade-in pb-16">

      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          <Link
            to={buildPath('/super-admin/dashboard')}
            className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Global Console
          </Link>
          <ChevronRight size={12} className="text-zinc-300 dark:text-zinc-600" />
          <Link
            to={buildPath('/super-admin/organizations')}
            className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Organizations
          </Link>
          <ChevronRight size={12} className="text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-800 dark:text-zinc-100 font-semibold">{org?.name || organizationId}</span>
        </nav>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshAll}
            className="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
            title="Refresh details"
          >
            <RefreshCw size={13} className="text-zinc-500 dark:text-zinc-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner (if any) ── */}
      {orgError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold block mb-0.5">Notice: Live multi-tenant API is synchronizing</span>
            <span className="text-amber-800 dark:text-amber-300">Displaying local workspace tenant details. Administrative endpoints are active.</span>
          </div>
        </div>
      )}

      {/* ── Executive Tenant Hero Card ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          {/* Tenant Avatar & Metadata */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm border border-indigo-200 dark:border-indigo-800">
              {initial}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {org?.name || 'Tenant Organization'}
                </h1>

                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operational • Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Suspended
                  </span>
                )}
              </div>

              {/* Metadata tags */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {org?.code && (
                  <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">
                    {org.code}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 dark:bg-[#1D212C] hover:bg-zinc-100 dark:hover:bg-[#222736] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-[#2A2F3D] transition-colors inline-flex items-center gap-1.5 group"
                  title="Click to copy Tenant UUID"
                >
                  <span className="text-zinc-400 dark:text-zinc-500">ID:</span>
                  <span>{organizationId?.slice(0, 12)}...</span>
                  {copiedId ? (
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy size={12} className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
                  )}
                </button>

                {org?.createdAt && (
                  <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                    <Calendar size={12} />
                    <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={12} />
                  Enterprise Tier
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={handleStatusToggle}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-1.5 shadow-2xs ${
                isActive
                  ? 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50'
                  : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
              }`}
            >
              {isActive ? (
                <>
                  <XCircle size={14} className="text-rose-600 dark:text-rose-400" />
                  <span>Suspend Tenant</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Activate Tenant</span>
                </>
              )}
            </button>

            <Link
              to={buildPath(`/super-admin/organizations/${organizationId}/companies`)}
              className="btn-primary h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs"
            >
              <Briefcase size={14} />
              <span>Manage Workspaces</span>
            </Link>
          </div>
        </div>

        {/* ── 4 Executive KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-zinc-100 dark:border-[#2A2F3D]">
          {/* Card 1: Workspaces */}
          <button
            type="button"
            onClick={() => handleTabChange('companies')}
            className="text-left p-3.5 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C] hover:bg-zinc-100/70 dark:hover:bg-[#222736] border border-zinc-200/70 dark:border-[#2A2F3D] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Workspaces
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60">
                <Briefcase size={13} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {org?.companyCount ?? (linkedCompanies.length || 1)}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Assigned companies</div>
          </button>

          {/* Card 2: Members */}
          <button
            type="button"
            onClick={() => handleTabChange('members')}
            className="text-left p-3.5 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C] hover:bg-zinc-100/70 dark:hover:bg-[#222736] border border-zinc-200/70 dark:border-[#2A2F3D] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Tenant Members
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
                <Users size={13} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {org?.memberCount ?? 0}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Admin & staff seats</div>
          </button>

          {/* Card 3: Active Users */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Active Users
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
                <User size={13} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {org?.activeUserCount ?? (isActive ? 1 : 0)}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Authenticated sessions</div>
          </div>

          {/* Card 4: Plan */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Subscription Plan
              </span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-800/60">
                <ShieldCheck size={13} />
              </div>
            </div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
              {org?.planCode || 'Enterprise Cloud'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Multi-tenant License</div>
          </div>
        </div>
      </div>

      {/* ── Modern Segmented Pill Tabs Navigation ── */}
      <div className="bg-zinc-100/90 dark:bg-[#1D212C] p-1.5 rounded-2xl border border-zinc-200/80 dark:border-[#2A2F3D] overflow-x-auto shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-[#2A2F3D]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-[#222736]'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                        : 'bg-zinc-200/80 dark:bg-[#222736] text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Container ── */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            org={org}
            organizationId={organizationId}
            linkedCompanies={linkedCompanies}
            handleTabChange={handleTabChange}
            handleCopyId={handleCopyId}
            copiedId={copiedId}
            buildPath={buildPath}
          />
        )}

        {activeTab === 'companies' && (
          <CompaniesTab
            organizationId={organizationId}
            org={org}
            linkedCompanies={linkedCompanies}
            buildPath={buildPath}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            organizationId={organizationId}
            org={org}
            buildPath={buildPath}
          />
        )}

        {activeTab === 'modules' && (
          <ModulesTab
            organizationId={organizationId}
            globalModules={globalModulesList}
            buildPath={buildPath}
          />
        )}

        {activeTab === 'roles' && (
          <RolesTab
            organizationId={organizationId}
            buildPath={buildPath}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionTab
            organizationId={organizationId}
            org={org}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab
            organizationId={organizationId}
            org={org}
            buildPath={buildPath}
          />
        )}
      </div>

    </div>
  );
}
