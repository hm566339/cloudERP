import React, { useState, useMemo } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useGetOrganizationRolesQuery } from '../../../api/sso';
import TabSearchBar from './TabSearchBar';

export default function RolesTab({ organizationId, buildPath }) {
  const { data, isLoading } = useGetOrganizationRolesQuery({ organizationId });
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('ALL');

  const standardRoles = useMemo(() => [
    {
      name: 'ORGANIZATION_ADMIN',
      label: 'Organization Administrator',
      desc: 'Full administrative governance across all workspaces, user provisioning, and tenant configurations.',
      scope: 'Organization-Wide',
      level: 'Tier 1 Executive',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      name: 'COMPANY_OWNER',
      label: 'Workspace Owner',
      desc: 'Executive ownership of linked company workspaces, financial settings, and department modules.',
      scope: 'Workspace Scoped',
      level: 'Tier 2 Managerial',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'FINANCE_MANAGER',
      label: 'Financial Controller',
      desc: 'Full access to accounting ledgers, invoices, payments, tax filings, and bank integrations.',
      scope: 'Accounting Module',
      level: 'Tier 2 Managerial',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'INVENTORY_MANAGER',
      label: 'Inventory Controller',
      desc: 'Full access to stock levels, dispatch delivery challans, warehouse bins, and valuation audits.',
      scope: 'Inventory Module',
      level: 'Tier 2 Managerial',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'STAFF_MEMBER',
      label: 'Operational Staff',
      desc: 'Standard daily transaction creation, voucher entry, and assigned document view privileges.',
      scope: 'Standard Access',
      level: 'Tier 3 Operational',
      badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
  ], []);

  const filteredRoles = useMemo(() => {
    return standardRoles.filter((role) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        role.name.toLowerCase().includes(q) ||
        role.label.toLowerCase().includes(q) ||
        role.desc.toLowerCase().includes(q) ||
        role.scope.toLowerCase().includes(q);

      const matchesScope =
        scopeFilter === 'ALL' || role.scope.toLowerCase().includes(scopeFilter.toLowerCase());

      return matchesSearch && matchesScope;
    });
  }, [standardRoles, search, scopeFilter]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={16} className="text-violet-600" />
            Roles & Access Control Policies
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {standardRoles.length} Policies
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Role definitions and security permissions applicable to users in this organization
          </p>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <TabSearchBar
        search={search}
        setSearch={setSearch}
        placeholder="Search roles by title, code, description, or scope..."
        totalCount={standardRoles.length}
        filteredCount={filteredRoles.length}
        filters={[
          {
            id: 'scope',
            label: 'Scope',
            value: scopeFilter,
            onChange: setScopeFilter,
            options: [
              { label: 'All Scopes', value: 'ALL' },
              { label: 'Organization-Wide', value: 'Organization-Wide' },
              { label: 'Workspace Scoped', value: 'Workspace Scoped' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setScopeFilter('ALL');
        }}
        accentColor="violet"
      />

      <div className="p-5">
        {filteredRoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((role) => (
              <div
                key={role.name}
                className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40 hover:bg-white hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${role.badge}`}>
                    {role.name}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded-full">
                    {role.scope}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{role.label}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{role.desc}</p>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{role.level}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 size={12} /> Active Policy
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-50/50 rounded-xl">
            <ShieldCheck size={26} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No roles match "{search}"</p>
            <p className="text-[11px] text-zinc-400 mt-1">Try resetting search keywords or scope filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setScopeFilter('ALL');
              }}
              className="mt-3 btn-secondary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
