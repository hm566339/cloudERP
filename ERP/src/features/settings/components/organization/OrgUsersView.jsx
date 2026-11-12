import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building2,
  Shield,
  Briefcase,
  Key,
  Layers,
  UserPlus,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import { useGetOrgMembersQuery } from '../../../../api/sso/organization.api';
import apiClient from '../../../../api/common/client';
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import UserCompanyAccessModal from '../../../users/components/UserCompanyAccessModal';
import UserAssignRoleModal from '../../../users/components/UserAssignRoleModal';
import ExportModal from '../../../../components/common/ExportModal';
import Modal from '../../../../components/common/Modal';
import CustomSelect from '../../../../components/common/CustomSelect';
import { confirmDialog } from '../../../../utils/confirmDialog';

const DEFAULT_COLUMNS = [
  'fullName',
  'email',
  'empId',
  'company',
  'role',
  'status',
  'lastLogin',
];

export default function OrgUsersView({
  organization,
  companies = [],
}) {
  const dispatch = useAppDispatch();

  // State
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for Invite / New User
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmpId, setInviteEmpId] = useState('');
  const [inviteMemberType, setInviteMemberType] = useState('MEMBER');
  const [inviteCompanyId, setInviteCompanyId] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // RTK Query for members
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
      const empId = m.employeeId || m.empId || m.code || '-';
      const memberType = (m.memberType || 'MEMBER').toUpperCase();
      const membershipStatus = (
        m.membershipStatus || m.status || (m.active !== false ? 'ACTIVE' : 'INACTIVE')
      ).toUpperCase();

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

      const primaryRole = companyAccess[0]?.roleName || m.roleName || m.role || memberType;

      return {
        id,
        userId,
        memberId,
        email,
        fullName,
        username,
        empId,
        memberType,
        membershipStatus,
        companyAccess,
        assignedCompanyNames,
        primaryRole,
        active: membershipStatus === 'ACTIVE',
        lastLogin: m.lastLoginAt || m.lastLogin || null,
        createdAt: m.createdAt || m.joinedAt || null,
      };
    });
  }, [rawMembers]);

  // Client-side filtering & sorting
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = m.fullName.toLowerCase().includes(term);
        const matchesEmail = m.email.toLowerCase().includes(term);
        const matchesEmpId = (m.empId || '').toLowerCase().includes(term);
        const matchesCompany = m.assignedCompanyNames.some((c) =>
          c.toLowerCase().includes(term)
        );
        const matchesRole = m.primaryRole.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesEmpId && !matchesCompany && !matchesRole) {
          return false;
        }
      }

      if (statusFilter === 'Active' && !m.active) return false;
      if (statusFilter === 'Inactive' && m.active) return false;

      if (companyFilter !== 'All') {
        const matchesSelectedCompany = m.companyAccess.some(
          (ca) => ca.companyId === companyFilter || ca.companyName === companyFilter
        );
        if (!matchesSelectedCompany) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [members, searchTerm, statusFilter, companyFilter, sortBy, sortOrder]);

  const totalElements = filteredMembers.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = page * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  // Actions
  const handleToggleStatus = (member) => {
    const isActivating = !member.active;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} access for ${member.fullName}?`,
      async () => {
        try {
          await apiClient.patch(`/api/sso/organization/members/${member.memberId}/status`, {
            status: isActivating ? 'ACTIVE' : 'INACTIVE',
          });
          dispatch(
            addAlert({
              type: 'success',
              message: `User ${isActivating ? 'activated' : 'deactivated'} successfully`,
            })
          );
          refetchMembers();
        } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: err?.response?.data?.message || 'Failed to update user status',
            })
          );
        }
      }
    );
  };

  const handleDeleteUser = (member) => {
    confirmDialog(
      'Remove Member from Organization',
      `Are you sure you want to remove ${member.fullName} (${member.email}) from the organization? This will revoke all company access.`,
      async () => {
        try {
          await apiClient.delete(`/api/sso/organization/members/${member.memberId}`);
          dispatch(
            addAlert({
              type: 'success',
              message: 'User removed from organization successfully',
            })
          );
          refetchMembers();
        } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: err?.response?.data?.message || 'Failed to remove user',
            })
          );
        }
      }
    );
  };

  const handleOpenEdit = (member) => {
    setEditingUser(member);
    setEditFullName(member.fullName || '');
    setEditEmpId(member.empId === '-' ? '' : member.empId);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'User name is required' }));
      return;
    }
    setIsUpdating(true);
    try {
      await apiClient.put(`/api/sso/users/${editingUser.userId}`, {
        fullName: editFullName.trim(),
        employeeId: editEmpId.trim(),
      });
      dispatch(addAlert({ type: 'success', message: 'User updated successfully' }));
      setIsEditModalOpen(false);
      refetchMembers();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to update user',
        })
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'Email address is required' }));
      return;
    }

    setIsInviting(true);
    try {
      const orgId = organization?.id || organization?.organizationId;
      const res = await apiClient.post(
        '/api/sso/organization/members/invite',
        {
          email: inviteEmail.trim().toLowerCase(),
          fullName: inviteFullName.trim() || undefined,
          employeeId: inviteEmpId.trim() || undefined,
          memberType: inviteMemberType,
          companyId: inviteCompanyId || undefined,
          organizationId: orgId || undefined,
        },
        {
          params: orgId ? { organizationId: orgId } : undefined,
        }
      );
      const data = res?.data?.data || res?.data;
      if (data?.emailSent === false) {
        dispatch(
          addAlert({
            type: 'warning',
            message: 'User created, but invitation email could not be sent' + (data?.emailError ? `: ${data.emailError}` : ''),
          })
        );
      } else {
        dispatch(
          addAlert({
            type: 'success',
            message: data?.message || `User created and invitation email sent to ${inviteEmail}`,
          })
        );
      }
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteEmpId('');
      setInviteCompanyId('');
      refetchMembers();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to send user invitation',
        })
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (member) => {
    const orgId = organization?.id || organization?.organizationId;
    const memberId = member?.memberId || member?.id;
    try {
      const res = await apiClient.post(
        `/api/sso/organization/members/${memberId}/resend-invite`,
        {},
        {
          params: orgId ? { organizationId: orgId } : undefined,
        }
      );
      const data = res?.data?.data || res?.data;
      if (data?.emailSent === false) {
        dispatch(
          addAlert({
            type: 'warning',
            message: 'Invitation refreshed, but email could not be sent' + (data?.emailError ? `: ${data.emailError}` : ''),
          })
        );
      } else {
        dispatch(
          addAlert({
            type: 'success',
            message: data?.message || `Invitation email resent successfully to ${member.email}`,
          })
        );
      }
      refetchMembers();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to resend invitation',
        })
      );
    }
  };

  // Columns definition
  const columns = useMemo(() => [
    {
      id: 'fullName',
      label: 'User Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {row.fullName}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              @{row.username || row.email.split('@')[0]}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-800 dark:text-zinc-200 text-xs font-medium">
          {row.email || '-'}
        </span>
      ),
    },
    {
      id: 'empId',
      label: 'Employee ID',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {row.empId || '-'}
        </span>
      ),
    },
    {
      id: 'company',
      label: 'Company & Assigned Roles',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col gap-1 max-w-[320px]">
          {row.companyAccess.length === 0 ? (
            <span className="text-xs text-zinc-400 italic">No Company Access</span>
          ) : (
            row.companyAccess.map((ca, idx) => {
              const roles = Array.isArray(ca.roleNames) && ca.roleNames.length > 0
                ? ca.roleNames.join(', ')
                : (ca.roleName || 'Member');
              return (
                <div
                  key={ca.companyId || idx}
                  className="flex items-center gap-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded px-2 py-0.5"
                  title={`${ca.companyName || 'Company'}: ${roles}`}
                >
                  <Briefcase size={11} className="text-zinc-500 shrink-0" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                    {ca.companyName || 'Company'}:
                  </span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate">
                    {roles}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ),
    },
    {
      id: 'role',
      label: 'Member Type',
      sortable: true,
      sortKey: 'memberType',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
          <Shield size={11} className="text-zinc-500" />
          <span>{row.memberType || 'MEMBER'}</span>
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'active',
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active} />,
    },
    {
      id: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
    {
      id: 'company',
      label: 'Company',
      type: 'select',
      value: companyFilter,
      options: [
        { label: 'All Companies', value: 'All' },
        ...companies.map((c) => ({
          label: c.name || c.legalName,
          value: c.id,
        })),
      ],
    },
  ], [statusFilter, companyFilter, companies]);

  // Row Actions
  const rowActions = useMemo(() => [
    {
      key: 'company-access',
      label: 'Assign Companies',
      icon: Briefcase,
      onClick: (row) => {
        setSelectedUserForAccess({
          userId: row.userId,
          fullName: row.fullName,
          email: row.email,
          companyAccess: row.companyAccess,
        });
        setIsAccessModalOpen(true);
      },
      tooltip: 'Assign to Multiple Companies',
      className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    },
    {
      key: 'assign-role',
      label: 'Assign Role',
      icon: Key,
      onClick: (row) => {
        setSelectedUserForRole(row);
        setIsRoleModalOpen(true);
      },
      tooltip: 'Assign Role',
      className: 'hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40',
    },
    {
      key: 'edit',
      label: 'Edit User',
      icon: Edit2,
      onClick: (row) => handleOpenEdit(row),
      tooltip: 'Edit User Profile',
      className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    },
    {
      key: 'resend-invite',
      label: 'Resend Invitation',
      icon: Mail,
      show: (row) => row.membershipStatus === 'INVITED' || !row.active,
      onClick: (row) => handleResendInvite(row),
      tooltip: 'Resend Invitation Email',
      className: 'hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40',
    },
    {
      key: 'toggle-status',
      label: (row) => (row.active ? 'Deactivate' : 'Activate'),
      icon: (row) => (row.active ? AlertCircle : CheckCircle),
      onClick: (row) => handleToggleStatus(row),
      tooltip: (row) => (row.active ? 'Deactivate User' : 'Activate User'),
      className: (row) =>
        row.active
          ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: (row) => handleDeleteUser(row),
      tooltip: 'Remove from Organization',
    },
  ], []);

  // Sub-row expanded drawer
  const renderExpandedRow = (member) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-2 text-xs">
      <div className="space-y-1">
        <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">User ID</span>
        <p className="font-mono text-zinc-800 dark:text-zinc-200">{member.userId || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Membership Type</span>
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{member.memberType || 'MEMBER'}</p>
      </div>
      <div className="space-y-1">
        <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Joined Organization</span>
        <p className="text-zinc-700 dark:text-zinc-300">
          {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN') : '-'}
        </p>
      </div>
      <div className="space-y-1 col-span-2">
        <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Company Access Details</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {member.companyAccess.length === 0 ? (
            <p className="text-zinc-400 italic">No companies assigned</p>
          ) : (
            member.companyAccess.map((ca, idx) => (
              <span
                key={ca.companyId || idx}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
              >
                <Building2 size={12} className="text-zinc-500" />
                <span className="font-semibold">{ca.companyName}</span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">{ca.roleName || 'Member'}</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCompanyFilter('All');
    setPage(0);
    setSelectedRows([]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Users & Permissions"
        description="Manage organization members, company assignments, and user privileges"
      >
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New User</span>
        </button>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="USER_MANAGEMENT"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={paginatedMembers}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Name, Email, Employee ID..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}

          // Filters
          filters={basicFilters}
          filterValues={{ status: statusFilter, company: companyFilter }}
          onFilterChange={(key, val) => {
            if (key === 'status') setStatusFilter(val);
            if (key === 'company') setCompanyFilter(val);
            setPage(0);
          }}

          // Reset & Refresh & Export
          onReset={handleResetFilters}
          onRefresh={refetchMembers}
          onExport={() => setIsExportModalOpen(true)}

          // Columns
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => {
            if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            else { setSortBy(key); setSortOrder('asc'); }
            setPage(0);
          }}

          // Row Actions & Expansion
          rowActions={rowActions}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page,
            pageSize,
            totalPages,
            totalElements,
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          itemName="users"

          // Empty State matching Customer Management
          emptyMessage="No users found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find user accounts."
        />
      </div>

      {/* Invite / New User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Organization User"
        size="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={inviteEmpId}
              onChange={(e) => setInviteEmpId(e.target.value)}
              placeholder="e.g. EMP-101"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Assign Initial Company
            </label>
            <select
              value={inviteCompanyId}
              onChange={(e) => setInviteCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            >
              <option value="">No initial company (Organization-wide only)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.legalName} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting}
              className="btn-primary"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={editEmpId}
              onChange={(e) => setEditEmpId(e.target.value)}
              placeholder="e.g. EMP-101"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn-primary"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cross-Company Access Assignment Modal */}
      {selectedUserForAccess && (
        <UserCompanyAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => {
            setIsAccessModalOpen(false);
            setSelectedUserForAccess(null);
          }}
          user={selectedUserForAccess}
          organizationId={organization?.id || organization?.organizationId}
          companies={companies}
          allCompanies={companies}
          onSuccess={() => refetchMembers()}
          onUpdated={() => refetchMembers()}
        />
      )}

      {/* Assign Role Modal */}
      {selectedUserForRole && (
        <UserAssignRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setSelectedUserForRole(null);
          }}
          user={selectedUserForRole}
          organization={organization}
          companies={companies}
          onSuccess={() => refetchMembers()}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="users-permissions-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
