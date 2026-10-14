import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, ExternalLink, ChevronRight } from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { setSelectedCompany } from '../../company-management/companySlice';
import { useGetOrganizationCompaniesQuery } from '../../../api/sso/organization.api';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import TabSearchBar from './TabSearchBar';

export default function CompaniesTab({ organizationId, org, linkedCompanies, buildPath }) {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetOrganizationCompaniesQuery({ organizationId });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const companiesFromApi = Array.isArray(data)
    ? data
    : data?.companies || data?.content || [];

  const effectiveCompanies = companiesFromApi.length > 0 ? companiesFromApi : linkedCompanies;

  const filtered = useMemo(() => {
    return effectiveCompanies.filter((c) => {
      const q = search.toLowerCase();
      const name = (c.name || c.companyName || '').toLowerCase();
      const code = (c.code || c.companyCode || '').toLowerCase();
      const matchesSearch = !search.trim() || name.includes(q) || code.includes(q);

      const isActive = c.active !== false && c.status !== 'SUSPENDED';
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? isActive
          : !isActive;

      return matchesSearch && matchesStatus;
    });
  }, [effectiveCompanies, search, statusFilter]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      {/* Header with Title and Action */}
      <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            Company Workspaces
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {effectiveCompanies.length} Total
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational enterprise company instances provisioned under {org?.name || 'this organization'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={buildPath(`/super-admin/companies`)}
            className="btn-primary text-xs h-9 px-3.5 inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Provision Company
          </Link>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <TabSearchBar
        search={search}
        setSearch={setSearch}
        placeholder="Search workspaces by company name or code..."
        totalCount={effectiveCompanies.length}
        filteredCount={filtered.length}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Status', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
        accentColor="blue"
      />

      {isLoading ? (
        <div className="p-6"><TableSkeleton columns={5} rows={3} /></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-zinc-50/80 border-b border-zinc-100 text-zinc-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center text-[10px] uppercase tracking-wider text-zinc-400">#</th>
                <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Workspace Company</th>
                <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Company Code</th>
                <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[10px] uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-right text-[10px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((c, idx) => {
                const cName = c.name || c.companyName || 'Workspace';
                const cCode = c.code || c.companyCode || '—';
                const cActive = c.active !== false && c.status !== 'SUSPENDED';

                return (
                  <tr key={c.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-medium text-zinc-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-100 shrink-0">
                          {cName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-zinc-900">{cName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                        {cCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {cActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {c.created || c.createdAt ? new Date(c.created || c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/company/${c.id}/dashboard`}
                          onClick={() => {
                            localStorage.setItem('selected_company', JSON.stringify(c));
                            dispatch(setSelectedCompany(c));
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Launch <ExternalLink size={11} />
                        </Link>
                        <Link
                          to={buildPath(`/super-admin/companies`)}
                          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-zinc-100 transition-colors"
                        >
                          Manage <ChevronRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center">
          <Building2 size={28} className="mx-auto text-zinc-300 mb-2" />
          <h4 className="text-sm font-bold text-zinc-800">
            {search || statusFilter !== 'ALL' ? 'No matching workspaces found' : 'No company workspaces found'}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            {search || statusFilter !== 'ALL'
              ? `No workspaces match your query "${search}". Try resetting active filters.`
              : 'Provision a company workspace for this organization to begin managing business modules.'}
          </p>
          {search || statusFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 px-3.5 py-1.5"
            >
              Reset Search & Filters
            </button>
          ) : (
            <Link
              to={buildPath('/super-admin/companies')}
              className="btn-primary text-xs inline-flex items-center gap-1.5 px-4 py-2"
            >
              <Plus size={14} /> Provision Company
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
