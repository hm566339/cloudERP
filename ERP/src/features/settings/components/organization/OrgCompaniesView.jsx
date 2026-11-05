import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  ExternalLink,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function OrgCompaniesView({
  companies = [],
  organization,
  maxCapacity = 4,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.legalName || '').toLowerCase().includes(term) ||
        (c.code || '').toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const canCreateMore = companies.length < maxCapacity;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Briefcase size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Companies Management
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Operating company workspaces and subsidiary entities registered under {organization?.name || 'this organization'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/owner/companies"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
          >
            <span>Company Console</span>
            <ArrowRight size={13} />
          </Link>
          {canCreateMore && (
            <Link
              to="/owner/companies"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl transition-all shadow-xs"
            >
              <Plus size={14} />
              <span>Create Company</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Capacity & Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5]">
            Plan Company Allowance
          </span>
          <div className="text-2xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] mt-1.5">
            {companies.length}
            <span className="text-xs font-normal text-[#485942] dark:text-[#A0A6B5] ml-1">/ {maxCapacity} Allowed</span>
          </div>
          <div className="w-full bg-[#EDEEE4] dark:bg-[#1D212C] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#2E3D28] dark:bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (companies.length / maxCapacity) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5]">
            Remaining Capacity
          </span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1.5">
            {Math.max(0, maxCapacity - companies.length)}
            <span className="text-xs font-normal text-[#485942] dark:text-[#A0A6B5] ml-1">Slots Available</span>
          </div>
          <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
            Subscription tier cap: {maxCapacity} companies
          </p>
        </div>

        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5]">
            Multi-Tenant Isolation
          </span>
          <div className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Independent Schema & Ledger</span>
          </div>
          <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
            Company-scoped roles, accounts, and inventory
          </p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#485942] dark:text-[#A0A6B5]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter companies by name or code..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
        />
      </div>

      {/* ── Companies Table ── */}
      <div className="overflow-x-auto rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-xs">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-[#F7F7F0] dark:bg-[#1D212C] border-b border-[#D5D8CA] dark:border-[#2A2F3D] text-[10px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Company Code</th>
              <th className="py-3 px-4">Currency</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5D8CA] dark:divide-[#2A2F3D]">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#485942] dark:text-[#A0A6B5]">
                  No companies found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((c) => {
                const compId = c.id || c.companyId;
                const compCode = (c.code || c.companyCode || '—').toUpperCase();
                const compName = c.name || c.companyName || 'Unnamed Company';
                const legalName = c.legalName;
                const compCurrency = c.currency || 'INR';
                const compStatus = c.status || (c.active ? 'Active' : 'Inactive');

                return (
                  <tr key={compId || compCode} className="hover:bg-[#EDEEE4]/50 dark:hover:bg-[#222736]/50 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#A0A6B5] flex items-center justify-center shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div>
                          <Link
                            to={`/company/${compId}/dashboard`}
                            className="font-bold text-[#2E3D28] dark:text-[#E6E8EE] hover:underline"
                          >
                            {compName}
                          </Link>
                          {legalName && legalName !== compName && (
                            <div className="text-[10px] text-[#485942] dark:text-[#A0A6B5]">
                              {legalName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-[11px] text-[#2E3D28] dark:text-[#E6E8EE]">
                      <span className="bg-[#EDEEE4] dark:bg-[#1D212C] px-2 py-0.5 rounded-md border border-[#D5D8CA] dark:border-transparent">
                        {compCode}
                      </span>
                    </td>

                    {/* Currency */}
                    <td className="py-3 px-4 font-mono font-semibold text-[#485942] dark:text-[#A0A6B5]">
                      {compCurrency}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{compStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to={`/company/${compId}/dashboard`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-[#EDEEE4] dark:bg-[#1D212C] hover:bg-[#DCE2CF] dark:hover:bg-[#222736] rounded-lg transition-colors"
                        >
                          <ExternalLink size={12} />
                          <span>Open</span>
                        </Link>
                        <Link
                          to={`/owner/companies/${compId}`}
                          className="px-2.5 py-1 text-xs font-semibold text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

