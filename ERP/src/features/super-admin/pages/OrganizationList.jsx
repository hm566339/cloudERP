import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2, PlusCircle, Search, Eye, Edit, ShieldAlert, ShieldCheck,
  CheckCircle, XCircle, Users, Layers, ChevronRight, RefreshCw, Globe,
  MoreHorizontal, Info, AlertTriangle
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  useGetOrganizationsQuery,
  useUpdateOrganizationStatusMutation,
} from '../../../api/sso';
import { useRoutePath } from '../../../hooks/useRoutePath';

/**
 * OrganizationList — System Admin view of all organizations.
 *
 * This is the primary "tenants" page in the new organization-first architecture.
 * Companies are child entities UNDER organizations.
 *
 * Calls: GET /api/sso/admin/organizations?page=0&size=200
 * No companyId — organization listing is platform-wide.
 */
export default function OrganizationList() {
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || 'ALL';
  const [searchTerm, setSearchTerm] = useState('');

  // Organization listing — platform-wide, no companyId
  // NOTE: Organization API uses page (0-based) and size — NOT pageSize
  const {
    data: orgsData,
    isLoading: orgsLoading,
    isFetching: orgsFetching,
    error: orgsError,
    refetch: refetchOrgs,
  } = useGetOrganizationsQuery({ page: 0, size: 200 });

  const [updateOrgStatus] = useUpdateOrganizationStatusMutation();

  const orgs = orgsData?.organizations || [];

  // Filter organizations
  const filtered = useMemo(() => {
    return orgs.filter((item) => {
      const matchesSearch = !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orgs, searchTerm, statusFilter]);

  const handleStatusToggle = async (org) => {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateOrgStatus({ id: org.id, status: newStatus }).unwrap();
      dispatch(addAlert({ type: 'success', message: `Organization ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully.` }));
    } catch (e) {
      dispatch(addAlert({ type: 'error', message: 'Failed to update organization status.' }));
    }
  };

  const isLoading = orgsLoading || orgsFetching;

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-5 animate-fade-in pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mb-2">
            <Link to={buildPath('/super-admin/dashboard')} className="hover:text-zinc-600 transition-colors">
              Global Console
            </Link>
            <ChevronRight size={12} />
            <span className="text-zinc-700">Organizations</span>
          </nav>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Building2 size={22} className="text-blue-600 shrink-0" />
            Organizations
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            All tenant organizations on the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={refetchOrgs}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={(orgsLoading || orgsFetching) ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to={buildPath('/super-admin/organizations/provision')}
            className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            Provision Organization
          </Link>
        </div>
      </div>


      {/* Show error notice if org API fails */}
      {orgsError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold block mb-0.5">Failed to load organizations</span>
            <code className="font-mono bg-rose-100 px-1 rounded">GET /api/sso/admin/organizations</code> returned an error.
            Check that the platform admin API is running and you have System Admin access.
          </div>
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-zinc-900 placeholder-zinc-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].map((s) => (
            <Link
              key={s}
              to={s === 'ALL' ? buildPath('/super-admin/organizations') : buildPath(`/super-admin/organizations?status=${s}`)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>

        <span className="text-[11px] text-zinc-400 font-medium">
          {filtered.length} {filtered.length === 1 ? 'organization' : 'organizations'}
        </span>
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs text-zinc-400">Loading organizations…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 mb-1">No organizations found</p>
              <p className="text-xs text-zinc-400">
                {searchTerm ? 'Try adjusting your search.' : 'Provision your first organization to get started.'}
              </p>
            </div>
            {!searchTerm && (
              <Link
                to={buildPath('/super-admin/organizations/provision')}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <PlusCircle size={13} />
                Provision Organization
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="p-3.5 w-10 text-center text-[10px] uppercase font-bold tracking-wider">#</th>
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
                {filtered.map((org, idx) => (
                  <OrgRow
                    key={org.id}
                    org={org}
                    index={idx}
                    buildPath={buildPath}
                    onStatusToggle={handleStatusToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Table Row for a single organization
// ──────────────────────────────────────────────────────────────────
function OrgRow({ org, index, buildPath, onStatusToggle }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const detailPath = `/super-admin/organizations/${org.id}`;

  return (
    <tr className="hover:bg-zinc-50/70 transition-colors group">
      <td className="p-3.5 text-center text-zinc-400 font-medium">{index + 1}</td>

      {/* Name */}
      <td className="p-3.5">
        <Link
          to={buildPath(detailPath)}
          className="flex items-center gap-2.5 font-semibold text-zinc-900 hover:text-blue-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 border border-blue-200/60">
            {org?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="block truncate max-w-[200px]">{org.name}</span>
          </div>
        </Link>
      </td>

      {/* Code */}
      <td className="p-3.5">
        <span className="font-mono text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
          {org.code || '—'}
        </span>
      </td>

      {/* Status */}
      <td className="p-3.5">
        <OrgStatusBadge status={org.status} />
      </td>

      {/* Companies count */}
      <td className="p-3.5 text-zinc-700 font-semibold">
        {org.companyCount !== undefined ? org.companyCount : '—'}
      </td>

      {/* Members count */}
      <td className="p-3.5 text-zinc-700 font-semibold">
        {org.memberCount !== undefined ? org.memberCount : '—'}
      </td>

      {/* Created */}
      <td className="p-3.5 text-zinc-500">
        {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </td>

      {/* Actions */}
      <td className="p-3.5">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={buildPath(detailPath)}
            className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-zinc-600 border border-zinc-200 bg-white hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 transition-all inline-flex items-center gap-1"
          >
            <Eye size={12} />
            View
          </Link>

          <button
            type="button"
            onClick={() => onStatusToggle(org)}
            className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border transition-all inline-flex items-center gap-1 ${
              org.status === 'ACTIVE'
                ? 'text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100'
                : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            {org.status === 'ACTIVE' ? <XCircle size={12} /> : <CheckCircle size={12} />}
            {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────────────
// Status Badge
// ──────────────────────────────────────────────────────────────────
function OrgStatusBadge({ status }) {
  const s = status || 'UNKNOWN';
  if (s === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  );
  if (s === 'SUSPENDED') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
    </span>
  );
  if (s === 'INACTIVE') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Inactive
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {s}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Map company shape → org shape (fallback mode)
// ──────────────────────────────────────────────────────────────────
function mapCompanyToOrg(c) {
  return {
    id: c.id || c.companyId,
    name: c.name || c.companyName,
    code: c.code || c.companyCode,
    status: c.active ? 'ACTIVE' : 'INACTIVE',
    active: c.active,
    companyCount: undefined, // not available in company shape
    memberCount: undefined,
    createdAt: c.created || c.createdAt,
  };
}
