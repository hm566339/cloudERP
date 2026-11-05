import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Building2,
  Shield,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Layers,
  ArrowRight,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import { useGetOrgMembersQuery } from '../../../../api/sso/organization.api';
import apiClient from '../../../../api/common/client';
import UserCompanyAccessModal from '../../../users/components/UserCompanyAccessModal';

export default function OrgUsersView({
  organization,
  companies = [],
}) {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteMemberType, setInviteMemberType] = useState('MEMBER');
  const [inviteCompanyId, setInviteCompanyId] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // RTK Query to load organization members
  const {
    data: rawMembers = [],
    isLoading,
    isFetching,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Normalize members list
  const members = useMemo(() => {
    const list = Array.isArray(rawMembers) ? rawMembers : (rawMembers?.data || []);
    return list.map((m) => {
      const id = m.id || m.memberId || m.userId;
      const userId = m.userId || m.id;
      const memberId = m.memberId || m.id;
      const email = m.email || '';
      const fullName = m.fullName || m.name || m.username || email.split('@')[0] || 'User';
      const username = m.username || email.split('@')[0] || '';
      const memberType = (m.memberType || 'MEMBER').toUpperCase();
      const membershipStatus = (m.membershipStatus || m.status || (m.active !== false ? 'ACTIVE' : 'INACTIVE')).toUpperCase();

      // Normalize assigned companies & company access
      let companyAccess = [];
      if (Array.isArray(m.companyAccess)) {
        companyAccess = m.companyAccess;
      } else if (Array.isArray(m.authorizedCompanies)) {
        companyAccess = m.authorizedCompanies.map((cName, idx) => ({
          companyId: m.authorizedCompanyIds?.[idx] || String(idx),
          companyName: cName,
          roleName: m.role || 'Member',
          active: true,
        }));
      }

      const assignedCompanyNames = companyAccess.map(
        (ca) => ca.companyName || ca.name || 'Company'
      );

      return {
        id,
        userId,
        memberId,
        email,
        fullName,
        username,
        memberType,
        membershipStatus,
        companyAccess,
        assignedCompanyNames,
        createdAt: m.createdAt || m.joinedAt || null,
        active: membershipStatus === 'ACTIVE',
      };
    });
  }, [rawMembers]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = m.fullName.toLowerCase().includes(term);
        const matchesEmail = m.email.toLowerCase().includes(term);
        const matchesCompany = m.assignedCompanyNames.some((c) =>
          c.toLowerCase().includes(term)
        );
        const matchesRole = m.companyAccess.some((ca) =>
          (ca.roleName || '').toLowerCase().includes(term)
        );
        if (!matchesName && !matchesEmail && !matchesCompany && !matchesRole) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL' && m.memberType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && m.membershipStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [members, searchTerm, typeFilter, statusFilter]);

  // Open multi-company access modal for a specific member
  const handleOpenCompanyAccess = (member) => {
    setSelectedUserForAccess({
      id: member.userId,
      userId: member.userId,
      memberId: member.memberId,
      name: member.fullName,
      email: member.email,
      companyAccess: member.companyAccess,
      authorizedCompanies: member.assignedCompanyNames,
    });
    setIsAccessModalOpen(true);
  };

  // Handle invite / add member
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.trim()) {
      dispatch(addAlert({ type: 'error', message: 'Please enter a valid member email.' }));
      return;
    }

    setIsInviting(true);
    try {
      // Send invite request
      await apiClient.post('/api/sso/organization/members', {
        email: inviteEmail.trim(),
        fullName: inviteFullName.trim() || inviteEmail.trim().split('@')[0],
        memberType: inviteMemberType,
        companyId: inviteCompanyId || (companies[0]?.id || null),
      });

      dispatch(
        addAlert({
          type: 'success',
          message: `Member ${inviteEmail.trim()} invited to organization successfully.`,
        })
      );
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteCompanyId('');
      refetchMembers();
    } catch (err) {
      // If endpoint returns error or is not directly supported, fallback gracefully
      const msg = err?.response?.data?.message || err?.message || 'Failed to add member to organization.';
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsInviting(false);
    }
  };

  // Toggle member status
  const handleToggleMemberStatus = async (member) => {
    const newStatus = member.membershipStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.put(`/api/sso/organization/members/${member.memberId}/status`, {
        status: newStatus,
      });
      dispatch(
        addAlert({
          type: 'success',
          message: `Member ${member.fullName} status updated to ${newStatus}.`,
        })
      );
      refetchMembers();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to update member status.',
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Users size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Users & Permissions
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Organization-level membership directory. Manage multi-company user access and independent company-wise roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetchMembers()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
            title="Refresh member roster"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl transition-all shadow-xs"
          >
            <UserPlus size={14} />
            <span>Invite / Add Member</span>
          </button>
        </div>
      </div>

      {/* ── Architectural Notice ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#EDEEE4]/60 dark:bg-[#1D212C]/60 border border-[#D5D8CA] dark:border-[#2A2F3D] text-xs text-[#2E3D28] dark:text-[#E6E8EE]">
        <Layers size={18} className="text-[#2E3D28] dark:text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Multi-Company Single User ID Architecture</span>
          <p className="text-[#485942] dark:text-[#A0A6B5] leading-relaxed">
            Each organization member has one unified User ID in the database. Use <strong>"Manage Access"</strong> on any member row to assign them to additional companies with independent company-specific roles without creating duplicate user accounts.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#485942] dark:text-[#A0A6B5]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member name, email, company, or role..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Member Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="INVITED">Invited</option>
          </select>
        </div>
      </div>

      {/* ── Members Table ── */}
      <div className="overflow-x-auto rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-xs">
        <table className="w-full text-left text-xs min-w-[780px]">
          <thead className="bg-[#F7F7F0] dark:bg-[#1D212C] border-b border-[#D5D8CA] dark:border-[#2A2F3D] text-[10px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Organization Member</th>
              <th className="py-3 px-4">Member Type</th>
              <th className="py-3 px-4">Assigned Companies</th>
              <th className="py-3 px-4">Company-Wise Roles</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5D8CA] dark:divide-[#2A2F3D]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-[#485942] dark:text-[#A0A6B5]">
                  <span className="inline-block w-4 h-4 border-2 border-[#2E3D28]/30 border-t-[#2E3D28] rounded-full animate-spin mr-2" />
                  Loading organization members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-[#485942] dark:text-[#A0A6B5]">
                  <Users size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  No organization members match the specified filters.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const initial = (member.fullName[0] || 'U').toUpperCase();
                const isOwner = member.memberType === 'OWNER';

                return (
                  <tr key={member.id || member.email} className="hover:bg-[#EDEEE4]/50 dark:hover:bg-[#222736]/50 transition-colors">
                    {/* Member Name & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] font-bold flex items-center justify-center shrink-0 border border-[#D5D8CA] dark:border-[#2A2F3D]">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#2E3D28] dark:text-[#E6E8EE] truncate">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-[#485942] dark:text-[#A0A6B5] truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Member Type */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          isOwner
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                            : member.memberType === 'ADMIN'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                            : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200/60 dark:border-[#2A2F3D]'
                        }`}
                      >
                        {member.memberType}
                      </span>
                    </td>

                    {/* Assigned Companies */}
                    <td className="py-3 px-4">
                      {member.assignedCompanyNames.length === 0 ? (
                        <span className="text-[11px] text-zinc-400 italic">No companies assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {member.assignedCompanyNames.map((cName) => (
                            <span
                              key={cName}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D]"
                            >
                              <Building2 size={10} className="text-[#485942] dark:text-[#A0A6B5]" />
                              <span className="truncate max-w-[90px]">{cName}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Company-Wise Roles */}
                    <td className="py-3 px-4">
                      {member.companyAccess.length === 0 ? (
                        <span className="text-[11px] text-zinc-400 italic">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {member.companyAccess.map((ca, idx) => (
                            <span
                              key={ca.companyId || idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-[#222736] text-[#2E3D28] dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D]"
                              title={`${ca.companyName || 'Company'}: ${ca.roleName || 'Member'}`}
                            >
                              <span className="font-semibold">{ca.companyName || 'Company'}:</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{ca.roleName || 'Member'}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          member.membershipStatus === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60'
                            : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-500 border-zinc-200 dark:border-[#2A2F3D]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.membershipStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        />
                        <span>{member.membershipStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenCompanyAccess(member)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-[#EDEEE4] dark:bg-[#1D212C] hover:bg-[#DCE2CF] dark:hover:bg-[#222736] rounded-lg transition-colors shadow-2xs"
                          title="Manage company assignments and independent roles"
                        >
                          <Shield size={12} className="text-[#485942] dark:text-[#A0A6B5]" />
                          <span>Manage Access</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Multi-Company User Access Modal ── */}
      {selectedUserForAccess && (
        <UserCompanyAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => {
            setIsAccessModalOpen(false);
            setSelectedUserForAccess(null);
          }}
          user={selectedUserForAccess}
          memberId={selectedUserForAccess.memberId}
          allCompanies={companies}
          onUpdated={() => {
            refetchMembers();
          }}
        />
      )}

      {/* ── Invite / Add Member Modal ── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsInviteModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xl p-6 z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#2E3D28] text-white">
                  <UserPlus size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                    Invite Organization Member
                  </h3>
                  <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5]">
                    Add a team member to {organization?.name || 'this organization'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@organization.com"
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Mohit Sharma"
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Member Type
                </label>
                <select
                  value={inviteMemberType}
                  onChange={(e) => setInviteMemberType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-zinc-900 dark:text-[#E6E8EE]"
                >
                  <option value="MEMBER">MEMBER (Standard Workspace Access)</option>
                  <option value="ADMIN">ADMIN (Organization Administrator)</option>
                </select>
              </div>

              {companies.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                    Initial Company Assignment
                  </label>
                  <select
                    value={inviteCompanyId}
                    onChange={(e) => setInviteCompanyId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-zinc-900 dark:text-[#E6E8EE]"
                  >
                    <option value="">Default (First Company)</option>
                    {companies.map((c) => (
                      <option key={c.id || c.companyId} value={c.id || c.companyId}>
                        {c.name || c.companyName} ({c.code || c.companyCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] hover:bg-[#3C4E34] rounded-xl disabled:opacity-50"
                >
                  {isInviting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

