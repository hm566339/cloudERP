import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useGetOrganizationModulesQuery } from '../../../api/sso/organization.api';
import TabSearchBar from './TabSearchBar';

export default function ModulesTab({ organizationId, globalModules, buildPath }) {
  const { data, isLoading } = useGetOrganizationModulesQuery({ organizationId });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Core ERP Modules with rich metadata
  const standardModules = useMemo(() => [
    {
      code: 'ACCOUNT',
      name: 'Financial Accounting',
      desc: 'General Ledger, Chart of Accounts, Invoices, GST reports and reconciliations.',
      category: 'Finance',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'bg-blue-100 text-blue-700',
    },
    {
      code: 'INVENTORY',
      name: 'Inventory & Warehousing',
      desc: 'Stock movements, multi-location warehouses, Delivery Challans, and item valuations.',
      category: 'Operations',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'bg-purple-100 text-purple-700',
    },
    {
      code: 'WORKFLOW',
      name: 'Workflow & Approvals',
      desc: 'Multi-stage approval gates, rule-based escalations, and automated decision flows.',
      category: 'Automation',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'bg-amber-100 text-amber-700',
    },
    {
      code: 'CRM',
      name: 'Customer Relationship Mgmt',
      desc: 'Lead pipelines, customer accounts, communication logs, and sales opportunities.',
      category: 'Sales',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      code: 'SSO',
      name: 'Identity & Access Mesh',
      desc: 'Single sign-on tokens, RBAC roles, tenant isolation schemas, and token refresh.',
      category: 'Platform',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      code: 'PURCHASE',
      name: 'Procurement & Orders',
      desc: 'Vendor PO management, GRN goods receipt notes, and purchase order tracking.',
      category: 'Procurement',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'bg-rose-100 text-rose-700',
    },
  ], []);

  const filteredModules = useMemo(() => {
    return standardModules.filter((mod) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        mod.name.toLowerCase().includes(q) ||
        mod.code.toLowerCase().includes(q) ||
        mod.desc.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === 'ALL' || mod.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [standardModules, search, categoryFilter]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Layers size={16} className="text-emerald-600" />
            Allocated Modules & Service Access
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {standardModules.length} Modules
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cloud microservices enabled for this organization and available to provision on workspaces
          </p>
        </div>

        <Link
          to={buildPath('/super-admin/modules')}
          className="btn-secondary text-xs h-8 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Layers size={13} /> Global Module Registry
        </Link>
      </div>

      {/* Advanced Search & Filter Bar */}
      <TabSearchBar
        search={search}
        setSearch={setSearch}
        placeholder="Search modules by name, code, description, or category..."
        totalCount={standardModules.length}
        filteredCount={filteredModules.length}
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Modules', value: 'ALL' },
              { label: 'Finance', value: 'Finance' },
              { label: 'Operations', value: 'Operations' },
              { label: 'Sales', value: 'Sales' },
              { label: 'Platform', value: 'Platform' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setCategoryFilter('ALL');
        }}
        accentColor="emerald"
      />

      {/* Grid of Enterprise Module Cards */}
      <div className="p-5">
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((mod) => (
              <div
                key={mod.code}
                className="rounded-xl border border-zinc-200/80 p-4 bg-zinc-50/40 hover:bg-white hover:shadow-xs hover:border-zinc-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${mod.color}`}>
                      {mod.code}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900">{mod.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-mono text-zinc-500">{mod.category} Category</span>
                  <span className="text-emerald-600 font-semibold">Enabled</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-50/50 rounded-xl">
            <Layers size={26} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No modules match "{search}"</p>
            <p className="text-[11px] text-zinc-400 mt-1">Try resetting search keywords or category filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
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
