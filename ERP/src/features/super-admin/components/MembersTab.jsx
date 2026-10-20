import React, { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { useGetOrganizationMembersQuery } from '../../../api/sso/organization.api';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import TabSearchBar from './TabSearchBar';

export default function MembersTab({ organizationId, org, buildPath }) {
  const { data, isLoading } = useGetOrganizationMembersQuery({ organizationId });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const members = Array.isArray(data)
    ? data
    : data?.members || data?.content || [];

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const name = (m.name || m.fullName || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const status = (m.status || '').toLowerCase();
      const matchesSearch = !search.trim() || name.includes(q) || email.includes(q) || role.includes(q) || status.includes(q);

      const isOrgAdmin = role.includes('admin') || role.includes('owner');
      const matchesRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'ADMIN'
          ? isOrgAdmin
          : !isOrgAdmin;

      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Organization Members & Administrators
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {members.length} Accounts
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Team accounts with access to {org?.name || 'this organization'} and its workspaces
          </p>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <TabSearchBar
        search={search}
        setSearch={setSearch}
        placeholder="Search members by name, email, role, or status..."
        totalCount={members.length}
        filteredCount={filtered.length}
        filters={[
          {
            id: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'All Roles', value: 'ALL' },
              { label: 'Administrators', value: 'ADMIN' },
              { label: 'Members', value: 'MEMBER' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setRoleFilter('ALL');
        }}
        accentColor="indigo"
      />

      {isLoading ? (
        <div className="p-6"><TableSkeleton columns={4} rows={3} /></div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[560px]" aria-label="Organization Members Table">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
              <tr>
                <th scope="col" className="py-3 px-4 w-12 text-center text-xs uppercase tracking-wider text-zinc-500">#</th>
                <th scope="col" className="py-3 px-4 text-xs uppercase tracking-wider">Member</th>
                <th scope="col" className="py-3 px-4 text-xs uppercase tracking-wider">Role</th>
                <th scope="col" className="py-3 px-4 text-xs uppercase tracking-wider">Status</th>
                <th scope="col" className="py-3 px-4 text-xs uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((m, idx) => (
                <tr key={m.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-medium text-zinc-400">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100 shrink-0">
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900">{m.name || 'Tenant User'}</div>
                        <div className="text-[11px] text-zinc-400">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 uppercase">
                      {m.role || 'ORGANIZATION_ADMIN'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center">
          <Users size={28} className="mx-auto text-zinc-300 mb-2" />
          <h4 className="text-sm font-bold text-zinc-800">
            {search || roleFilter !== 'ALL' ? 'No matching members found' : 'No members provisioned yet'}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto mb-4">
            {search || roleFilter !== 'ALL'
              ? `No team members match "${search}". Try adjusting your keywords or active filters.`
              : 'Organization administrators and member workspace accounts will be displayed here as they are invited.'}
          </p>
          {(search || roleFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
              }}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 px-3.5 py-1.5"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
