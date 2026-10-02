import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Layers, ShieldCheck, ChevronRight, ArrowLeft,
  Edit, XCircle, CheckCircle, Trash2, MoreHorizontal, Plus,
  Calendar, Globe, Phone, Mail, MapPin, Info, AlertTriangle,
  ScrollText, User, Activity, Eye
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  useGetOrganizationByIdQuery,
  useGetOrganizationMembersQuery,
  useGetOrganizationCompaniesQuery,
  useGetOrganizationModulesQuery,
  useGetOrganizationRolesQuery,
  useGetOrganizationAuditLogsQuery,
  useUpdateOrganizationStatusMutation,
  useGetCompanyByIdQuery,
} from '../../../api/sso';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';

/**
 * OrganizationDetails — System Admin view for a single organization.
 *
 * Route: /super-admin/organizations/:organizationId
 *
 * Tabs:
 *   Overview | Companies | Members | Modules | Roles | Audit Logs
 *
 * TODO(BACKEND): Requires the following endpoints:
 *   GET /api/sso/admin/organizations/{organizationId}
 *   GET /api/sso/admin/organizations/{organizationId}/members
 *   GET /api/sso/admin/organizations/{organizationId}/companies
 *   GET /api/sso/admin/organizations/{organizationId}/modules
 *   GET /api/sso/admin/organizations/{organizationId}/roles
 *   GET /api/sso/admin/organizations/{organizationId}/audit-logs
 */
export default function OrganizationDetails() {
  const { organizationId } = useParams();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useGetOrganizationByIdQuery(organizationId);

  const [updateOrgStatus] = useUpdateOrganizationStatusMutation();

  const handleStatusToggle = async () => {
    const newStatus = org?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateOrgStatus({ id: organizationId, status: newStatus }).unwrap();
      dispatch(addAlert({ type: 'success', message: `Organization ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}.` }));
    } catch (e) {
      dispatch(addAlert({ type: 'error', message: 'Failed to update organization status. Backend API may not be implemented yet.' }));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'roles', label: 'Roles', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  ];

  if (orgLoading) {
    return (
      <div className="w-full px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-100 rounded w-48" />
          <div className="h-24 bg-zinc-100 rounded-xl" />
          <div className="h-64 bg-zinc-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-5 animate-fade-in pb-12">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
        <Link to={buildPath('/super-admin/dashboard')} className="hover:text-zinc-600 transition-colors">Global Console</Link>
        <ChevronRight size={12} />
        <Link to={buildPath('/super-admin/organizations')} className="hover:text-zinc-600 transition-colors">Organizations</Link>
        <ChevronRight size={12} />
        <span className="text-zinc-700">{org?.name || organizationId}</span>
      </nav>

      {/* ── Backend API Notice ── */}
      {orgError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold block mb-0.5">Organization API error</span>
            <code className="font-mono bg-rose-100 px-1 rounded">GET /api/sso/admin/organizations/{organizationId}</code> returned an error.
            Check that the platform admin API is running and you have System Admin access.
          </div>
        </div>
      )}

      {/* ── Organization Header Card ── */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
              {org?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                  {org?.name || 'Organization Details'}
                </h1>
                {org && <OrgStatusBadge status={org.status} />}
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
                {org?.code && (
                  <span className="flex items-center gap-1">
                    <span className="font-mono font-semibold bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-700">{org.code}</span>
                  </span>
                )}
                {org?.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {org.email}
                  </span>
                )}
                {org?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Created {new Date(org.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`h-8 px-3 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                org?.status === 'ACTIVE'
                  ? 'text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100'
                  : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              {org?.status === 'ACTIVE' ? <><XCircle size={13} /> Suspend</> : <><CheckCircle size={13} /> Activate</>}
            </button>
            <Link
              to={buildPath(`/super-admin/organizations/${organizationId}/companies`)}
              className="h-8 px-3 rounded-lg text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center gap-1.5"
            >
              <Building2 size={13} /> Manage Companies
            </Link>
          </div>
        </div>

        {/* ── KPI row under header ── */}
        {org && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-100">
            <MiniStat label="Companies" value={org.companyCount ?? '—'} icon={Building2} />
            <MiniStat label="Members" value={org.memberCount ?? '—'} icon={Users} />
            <MiniStat label="Active Users" value={org.activeUserCount ?? '—'} icon={User} />
            <MiniStat label="Plan" value={org.planCode || 'Enterprise'} icon={ShieldCheck} />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-zinc-200">
        <div className="flex overflow-x-auto gap-0 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div>
        {activeTab === 'overview' && <OverviewTab org={org} organizationId={organizationId} buildPath={buildPath} />}
        {activeTab === 'companies' && <CompaniesTab organizationId={organizationId} buildPath={buildPath} />}
        {activeTab === 'members' && <MembersTab organizationId={organizationId} buildPath={buildPath} />}
        {activeTab === 'modules' && <ModulesTab organizationId={organizationId} buildPath={buildPath} />}
        {activeTab === 'roles' && <RolesTab organizationId={organizationId} buildPath={buildPath} />}
        {activeTab === 'audit' && <AuditTab organizationId={organizationId} buildPath={buildPath} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────────────────────────────
function OverviewTab({ org, organizationId, buildPath }) {
  if (!org) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}`} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Organization Details */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Info size={15} className="text-zinc-500" />
          Organization Details
        </h3>
        <div className="space-y-3 text-xs">
          <DetailRow label="Organization ID" value={org.id} mono />
          <DetailRow label="Name" value={org.name} />
          <DetailRow label="Code" value={org.code} mono />
          <DetailRow label="Status" value={<OrgStatusBadge status={org.status} />} />
          <DetailRow label="Email" value={org.email} />
          <DetailRow label="Phone" value={org.phone} />
          <DetailRow label="Country" value={org.country} />
          <DetailRow label="Timezone" value={org.timezone} />
          <DetailRow label="Currency" value={org.currency} />
          <DetailRow label="Created" value={org.createdAt ? new Date(org.createdAt).toLocaleString() : '—'} />
          <DetailRow label="Last Updated" value={org.updatedAt ? new Date(org.updatedAt).toLocaleString() : '—'} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Activity size={15} className="text-zinc-500" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          {[
            { label: 'View Companies', path: `/super-admin/organizations/${organizationId}/companies`, icon: Building2 },
            { label: 'View Members', path: `/super-admin/organizations/${organizationId}/members`, icon: Users },
            { label: 'View Modules', path: null, icon: Layers, tab: 'modules' },
            { label: 'View Roles', path: null, icon: ShieldCheck, tab: 'roles' },
            { label: 'View Audit Logs', path: null, icon: ScrollText, tab: 'audit' },
          ].map((action) => (
            <div key={action.label} className="flex items-center justify-between h-10 px-3 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all group">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex items-center justify-center">
                  <action.icon size={13} />
                </div>
                <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">{action.label}</span>
              </div>
              <ChevronRight size={13} className="text-zinc-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Companies Tab
// ──────────────────────────────────────────────────────────────────
function CompaniesTab({ organizationId, buildPath }) {
  const { data, isLoading, error } = useGetOrganizationCompaniesQuery({ organizationId });
  const companies = Array.isArray(data) ? data : (data?.companies || data?.content || []);

  if (error) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}/companies`} />;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Building2 size={15} className="text-zinc-500" />
          Companies under this Organization
        </h3>
        <Link
          to={buildPath(`/super-admin/organizations/${organizationId}/companies`)}
          className="btn-secondary text-xs h-7 px-2.5 flex items-center gap-1"
        >
          <Plus size={12} /> Add Company
        </Link>
      </div>
      {isLoading ? (
        <div className="p-4"><TableRowSkeleton columns={4} rows={3} /></div>
      ) : companies.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">No companies under this organization yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Company</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Code</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Status</th>
                <th className="p-3.5 text-right text-[10px] uppercase font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-3.5">
                    <Link
                      to={buildPath(`/super-admin/organizations/${organizationId}/companies/${c.id}`)}
                      className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-100">
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[11px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">{c.code}</span>
                  </td>
                  <td className="p-3.5">
                    <OrgStatusBadge status={c.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      to={buildPath(`/super-admin/organizations/${organizationId}/companies/${c.id}`)}
                      className="text-xs font-semibold text-zinc-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Members Tab
// ──────────────────────────────────────────────────────────────────
function MembersTab({ organizationId, buildPath }) {
  const { data, isLoading, error } = useGetOrganizationMembersQuery({ organizationId });
  const members = Array.isArray(data) ? data : (data?.members || data?.content || []);

  if (error) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}/members`} />;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Users size={15} className="text-zinc-500" /> Organization Members
        </h3>
      </div>
      {isLoading ? (
        <div className="p-4"><TableRowSkeleton columns={4} rows={3} /></div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">No members in this organization yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Member</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Role</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Status</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-3.5">
                    <div>
                      <div className="font-semibold text-zinc-900">{m.name || '—'}</div>
                      <div className="text-zinc-400 text-[10px]">{m.email}</div>
                    </div>
                  </td>
                  <td className="p-3.5 text-zinc-600 font-medium">{m.role || '—'}</td>
                  <td className="p-3.5"><OrgStatusBadge status={m.status} /></td>
                  <td className="p-3.5 text-zinc-500">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Modules Tab
// ──────────────────────────────────────────────────────────────────
function ModulesTab({ organizationId, buildPath }) {
  const { data, isLoading, error } = useGetOrganizationModulesQuery({ organizationId });
  const modules = Array.isArray(data) ? data : (data?.modules || data?.content || []);

  if (error) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}/modules`} />;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Layers size={15} className="text-zinc-500" /> Assigned Modules
        </h3>
      </div>
      {isLoading ? (
        <div className="p-4"><TableRowSkeleton columns={3} rows={3} /></div>
      ) : modules.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">No modules assigned to this organization yet.</div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => (
            <div key={m.id} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-900">{m.name}</span>
                <OrgStatusBadge status={m.status} />
              </div>
              <span className="font-mono text-[10px] text-zinc-500">{m.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Roles Tab
// ──────────────────────────────────────────────────────────────────
function RolesTab({ organizationId, buildPath }) {
  const { data, isLoading, error } = useGetOrganizationRolesQuery({ organizationId });
  const roles = Array.isArray(data) ? data : (data?.roles || data?.content || []);

  if (error) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}/roles`} />;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <ShieldCheck size={15} className="text-zinc-500" /> Organization Roles
        </h3>
      </div>
      {isLoading ? (
        <div className="p-4"><TableRowSkeleton columns={3} rows={3} /></div>
      ) : roles.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">No roles defined for this organization yet.</div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {roles.map((r) => (
            <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors">
              <div>
                <div className="text-xs font-semibold text-zinc-900">{r.name}</div>
                <div className="text-[10px] text-zinc-400">{r.description || 'No description'}</div>
              </div>
              <OrgStatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Audit Logs Tab
// ──────────────────────────────────────────────────────────────────
function AuditTab({ organizationId, buildPath }) {
  const { data, isLoading, error } = useGetOrganizationAuditLogsQuery({ organizationId, size: 50 });
  const logs = data?.logs || [];

  if (error) return <PendingBackendNotice endpoint={`GET /api/sso/admin/organizations/${organizationId}/audit-logs`} />;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <ScrollText size={15} className="text-zinc-500" /> Audit Logs
        </h3>
      </div>
      {isLoading ? (
        <div className="p-4"><TableRowSkeleton columns={5} rows={5} /></div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400">No audit logs for this organization.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Action</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Actor</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Target</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Timestamp</th>
                <th className="p-3.5 text-[10px] uppercase font-bold tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-zinc-700 font-semibold">{l.action}</td>
                  <td className="p-3.5 text-zinc-600">{l.actor || '—'}</td>
                  <td className="p-3.5 text-zinc-600">{l.targetEntity} {l.targetId && <span className="font-mono text-[10px] text-zinc-400">#{l.targetId.slice(0, 8)}</span>}</td>
                  <td className="p-3.5 text-zinc-500">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td className="p-3.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${l.result === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {l.result || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
function OrgStatusBadge({ status }) {
  const s = status || 'UNKNOWN';
  const map = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
    INACTIVE: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  const dotMap = {
    ACTIVE: 'bg-emerald-500',
    SUSPENDED: 'bg-rose-500',
    INACTIVE: 'bg-zinc-400',
  };
  const cls = map[s] || 'bg-amber-50 text-amber-700 border-amber-200';
  const dot = dotMap[s] || 'bg-amber-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {s}
    </span>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-50/60 rounded-lg border border-zinc-100">
      <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
        <Icon size={15} />
      </div>
      <div>
        <div className="text-[10px] text-zinc-400 font-medium">{label}</div>
        <div className="text-sm font-bold text-zinc-900">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-zinc-400 font-medium shrink-0 min-w-[100px]">{label}</span>
      <span className={`text-zinc-800 text-right break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function PendingBackendNotice({ endpoint }) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
      <div>
        <span className="font-semibold block mb-1">TODO(BACKEND): Endpoint not yet implemented</span>
        <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">{endpoint}</code>
        <p className="mt-1.5 text-amber-700">
          This data will appear here once the backend endpoint is available.
        </p>
      </div>
    </div>
  );
}
