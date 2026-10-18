import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAppSelector } from "../../../app/hooks";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import {
  Search, UserPlus, Key, Edit, Edit2, Trash2, CheckCircle, AlertCircle, Eye, ShieldAlert,
  Users, Building2, Layers, UserCog, RotateCcw, RefreshCw, ChevronDown, X, Mail
} from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  getUsers, createUser, updateUser, deleteUser,
  assignRole, removeRole, grantPortalAccess, removePortalAccess,
  changePassword, togglePortalAccess, updateUserStatus, verifyUserEmail,
  resendSetupEmail
} from '../../../api/sso/user';
import { getCompanies, getCompanyByCode } from '../../../api/sso/company';
import { getRoles } from '../../../api/sso/role';
import { getCompanyModulesByCompany } from '../../../api/sso/companyModules';
import Pagination from "../../../components/common/Pagination";
import { FILTER_CONFIGS } from "../../../constants/filterConfigs";
import useApiFilters from "../../../hooks/useApiFilters";
import TableRowActions from "../../../components/common/TableRowActions";
import UpdateModal from "../../../components/common/UpdateModal";
import ExportModal from "../../../components/common/ExportModal";
import SortableHeader from "../../../components/common/SortableHeader";
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';

import UserCreateEditModal from '../components/UserCreateEditModal';
import UserChangePasswordModal from '../components/UserChangePasswordModal';
import UserAssignRoleModal from '../components/UserAssignRoleModal';
import UserModuleAccessModal from '../components/UserModuleAccessModal';
import CustomSelect from '../../../components/common/CustomSelect';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { userTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import PermissionGuard from '../../../components/common/PermissionGuard';

export default function UserList() {
  const { canCreate, canEdit, canDelete } = useRBAC();
  const paramsCompanyId = useParams().companyId;
  const storageCompanyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyId;
  const [resolvedCompanyId, setResolvedCompanyId] = useState(paramsCompanyId || storageCompanyId);
  const [visibleColumns, setVisibleColumns] = useState(['name', 'role', 'username', 'empId', 'active', 'emailStatus']);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const companyId = resolvedCompanyId;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loggedInUser = useAppSelector(selectCurrentUser);
  const isSuperAdminGlobal =
    loggedInUser?.role === "super_admin" &&
    location.pathname.startsWith("/super-admin");

  const {
    apiParams,
    paginationProps,
    filters,
    setFilter,
    removeFilter,
    resetFilters,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    page,
    pageSize,
    handleColumnSort,
  } = useApiFilters(FILTER_CONFIGS.users, { defaultPageSize: 10, defaultSortBy: 'name-asc' });

  const filterCompany = filters?.companyId || "";
  const filterRole = filters?.role || "";
  const filterStatus = filters?.status || "All";

  const activeCompanyId = filterCompany || companyId;
  const skipFetch = !activeCompanyId;

  // Data states
  const [data, setData] = useState({ users: [], pagination: null });
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rawCompanyModules, setRawCompanyModules] = useState([]);

  const fetchUsers = useCallback(async () => {
    if (skipFetch) return;
    setIsLoading(true);
    try {
      const queryParams = {
        ...apiParams,
        companyId: activeCompanyId,
      };
      
      // Remove sort parameter entirely since the backend doesn't support it
      delete queryParams.sort;

      // Map 'size' to 'pageSize' to match the backend controller's @RequestParam int pageSize
      if (queryParams.size !== undefined) {
        queryParams.pageSize = queryParams.size;
        delete queryParams.size;
      }
      
      const res = await getUsers(activeCompanyId, queryParams);

      let usersArray = [];
      if (Array.isArray(res)) {
        usersArray = res;
      } else if (res && Array.isArray(res.users)) {
        usersArray = res.users;
      } else if (res && Array.isArray(res.content)) {
        usersArray = res.content;
      } else if (res && Array.isArray(res.data)) {
        usersArray = res.data;
      } else if (res && res.data && Array.isArray(res.data.content)) {
        usersArray = res.data.content;
      } else if (res && res.data && Array.isArray(res.data.users)) {
        usersArray = res.data.users;
      }

      setData({
        users: usersArray,
        pagination: res._pageInfo || res.pagination || res.page || null,
        totalPages: res._pageInfo?.totalPages || res.pagination?.totalPages || res.page?.totalPages || 1,
        totalElements: res._pageInfo?.totalElements || res.pagination?.totalCount || res.pagination?.totalElements || res.page?.totalElements || usersArray.length,
      });
    } catch (error) {
      console.error("Failed to fetch users", error);
      dispatch(addAlert({ type: "error", message: "Failed to fetch users" }));
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, apiParams, skipFetch, dispatch]);

  const fetchDependencies = useCallback(async () => {
    if (isSuperAdminGlobal) {
      try {
        const cRes = await getCompanies({ page: 0, pageSize: 200 });
        const rawComps = Array.isArray(cRes) ? cRes : (cRes?.companies || cRes?.content || cRes?.data?.content || cRes?.data || []);
        const mappedComps = (Array.isArray(rawComps) ? rawComps : []).map(c => ({ ...c, id: c.id || c.companyId, name: c.companyName || c.name || c.code || 'Unnamed Company' }));
        setCompanies(mappedComps);
        if (!activeCompanyId && mappedComps.length > 0) setResolvedCompanyId(mappedComps[0].id);
      } catch (err) {
        console.error("Failed to fetch companies", err);
      }
    }

    if (!skipFetch) {
      try {
        const rRes = await getRoles({ companyId: activeCompanyId, page: 0, pageSize: 200 });
        const rawRoles = Array.isArray(rRes) ? rRes : (rRes?.roles || rRes?.content || rRes?.data?.content || rRes?.data || []);
        setAvailableRoles(Array.isArray(rawRoles) ? rawRoles : []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }

      try {
        const cmRes = await getCompanyModulesByCompany(activeCompanyId);
        const rawMods = Array.isArray(cmRes) ? cmRes : (cmRes?.companyModuleResponse || cmRes?.content || cmRes?.data?.content || cmRes?.data || []);
        setRawCompanyModules(Array.isArray(rawMods) ? rawMods : []);
      } catch (err) {
        console.error("Failed to fetch company modules", err);
      }
    }
  }, [activeCompanyId, isSuperAdminGlobal, skipFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    const initializeCompanyId = async () => {
      if (!resolvedCompanyId && !isSuperAdminGlobal) {
        const authUser = JSON.parse(localStorage.getItem("auth_user"));
        if (authUser?.companyCode) {
          try {
            const res = await getCompanyByCode(authUser.companyCode);
            if (res?.id) {
              setResolvedCompanyId(res.id);
            }
          } catch (e) { console.warn("Failed to fetch company UUID", e); }
        }
      }
    };
    initializeCompanyId();
  }, [resolvedCompanyId, isSuperAdminGlobal]);

  const apiUsers = data?.users || [];
  const users = React.useMemo(() => {
    return apiUsers.map((u) => {
      let roleStr = "USER";
      const rawRole = (u.role !== undefined && u.role !== null) ? u.role : u.roles;
      if (typeof rawRole === 'string' && rawRole.trim()) {
        roleStr = rawRole.trim();
      } else if (Array.isArray(rawRole)) {
        if (rawRole.length > 0) {
          const first = rawRole[0];
          if (typeof first === 'string' && first.trim()) {
            roleStr = first.trim();
          } else if (first && typeof first === 'object') {
            roleStr = first.name || first.roleName || first.code || first.label || "USER";
          }
        }
      } else if (rawRole && typeof rawRole === 'object') {
        roleStr = rawRole.name || rawRole.roleName || rawRole.code || rawRole.label || "USER";
      }
      return {
        ...u,
        id: u.id,
        name: u.name || u.fullName || u.username || "",
        active: u.accountStatus === 'ACTIVE' || u.active === true,
        role: roleStr,
        created: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
        permissions: u.portalAccess?.map((pa) => pa.moduleName || pa.moduleId || pa.id) || [],
      };
    });
  }, [apiUsers]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTargetUser, setModuleTargetUser] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState(null);

  const canAssignModules = loggedInUser?.role === "super_admin" || loggedInUser?.role === "company_admin" || canEdit();

  const targetCompanyId = activeCompanyId;
  const availableModules = React.useMemo(() => {
    const rawModulesList = Array.isArray(rawCompanyModules) ? rawCompanyModules : [];
    const uniqueModulesMap = new Map();
    rawModulesList.forEach(m => {
      const modCompanyId = m.company?.id || m.companyId;
      if (targetCompanyId && modCompanyId && modCompanyId !== targetCompanyId) return;

      const modId = m.id || m.companyModuleId;
      const globalId = m.module?.id || m.moduleId;
      const modLabel = m.name || m.module?.name || m.moduleName || m.label || 'Unknown';
      if (!uniqueModulesMap.has(modLabel)) {
        uniqueModulesMap.set(modLabel, {
          id: modId,
          companyModuleId: modId,
          moduleId: globalId,
          globalId,
          name: modLabel,
          label: modLabel,
          host: m.host || m.module?.host,
          status: m.status !== false && m.status !== 'INACTIVE'
        });
      }
    });
    return Array.from(uniqueModulesMap.values());
  }, [rawCompanyModules, targetCompanyId]);

  const [initialPermissions, setInitialPermissions] = useState([]);

  const openCreateModal = () => {
    setCurrentUser(null);
    setInitialPermissions([]);
    setShowCreateModal(true);
  };

  const openRoleModal = (user) => {
    setRoleTargetUser(user);
    setShowRoleModal(true);
  };

  const openModuleModal = (user) => {
    setModuleTargetUser(user);
    let perms = [];
    if (user.portalAccess && Array.isArray(user.portalAccess)) {
      perms = user.portalAccess
        .filter(pa => pa.status === true || pa.status === undefined || pa.status === 'ACTIVE')
        .map(pa => {
          const mId = pa.moduleId || pa.module?.id || pa.companyModule?.id || pa.companyModuleId;
          if (mId) {
            const matched = availableModules.find(m => m.globalId === mId || m.id === mId || m.companyModuleId === mId);
            if (matched) return matched.id;
            return mId;
          }
          const mName = pa.moduleName || pa.module?.name || pa.module?.moduleName;
          if (mName) {
            const matched = availableModules.find(m => m.label?.toLowerCase() === mName.toLowerCase());
            if (matched) return matched.id;
          }
          return pa.id;
        }).filter(Boolean);
    } else {
      perms = (user.permissions || []).map(p => {
        if (!p) return p;
        const matched = availableModules.find(m => m.globalId === p || m.id === p || m.companyModuleId === p || m.label?.toLowerCase() === String(p).toLowerCase());
        return matched ? matched.id : p;
      }).filter(Boolean);
    }
    setInitialPermissions(perms);
    setShowModuleModal(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateUser = React.useCallback(async (formData) => {
    try {
      await updateUser(currentUser.id, {
        empId: formData.empId,
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
      });

      if (formData.accountStatus && formData.accountStatus !== currentUser.accountStatus) {
        await updateUserStatus(currentUser.id, formData.accountStatus);
      }

      if (formData.emailStatus && formData.emailStatus !== currentUser.emailStatus) {
        await verifyUserEmail(currentUser.id, formData.emailStatus);
      }

      dispatch(addAlert({ type: "success", message: `User "${formData.fullName}" updated successfully` }));
      setIsUpdateModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Update user error:", error);
      dispatch(addAlert({ type: "error", message: "Failed to update user" }));
    }
  }, [currentUser, dispatch, fetchUsers]);

  const handleDelete = React.useCallback(async (id, userName) => {
    if (await confirmDialog({ message: `Are you sure you want to delete user: ${userName}?` })) {
      try {
        await deleteUser(id);
        dispatch(addAlert({ type: "success", message: `User "${userName}" deleted successfully.` }));
        fetchUsers();
      } catch (error) {
        console.error("Delete user error:", error);
        dispatch(addAlert({ type: "error", message: "Failed to delete user" }));
      }
    }
  }, [dispatch, fetchUsers]);

  const handleResendSetupEmail = React.useCallback(async (targetUser) => {
    try {
      const res = await resendSetupEmail(targetUser.id);
      dispatch(addAlert({
        type: "success",
        message: res?.message || `Password setup email resent to ${targetUser.email}`
      }));
    } catch (err) {
      console.error("Resend email error:", err);
      dispatch(addAlert({
        type: "error",
        message: err?.response?.data?.message || "Failed to resend setup email"
      }));
    }
  }, [dispatch]);

  const openChangePasswordModal = (user) => {
    setPasswordTargetUser(user);
    setShowPasswordModal(true);
  };

  const openDetailsModal = (user) => {
    window.open(`${location.pathname}/${user.id}`, '_self');
  };

  const filteredUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const [key, direction] = (apiParams.sort || 'name,asc').split(',');
      const valA = key === 'created' ? a.createdAt : a[key];
      const valB = key === 'created' ? b.createdAt : b[key];

      if (!valA) return 1;
      if (!valB) return -1;

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, apiParams.sort]);

  const isClientPaginated = !data?.pagination;

  const displayedUsers = React.useMemo(() => {
    return isClientPaginated
      ? filteredUsers.slice(page * pageSize, (page + 1) * pageSize)
      : filteredUsers;
  }, [isClientPaginated, filteredUsers, page, pageSize]);

  const totalElements = isClientPaginated ? filteredUsers.length : data?.totalElements || data?.pagination?.totalCount || 0;
  const totalPages = isClientPaginated ? Math.ceil(filteredUsers.length / pageSize) : data?.totalPages || data?.pagination?.totalPages || 1;
  const totalUsersCount = totalElements || users.length;
  const activeUsersCount = users.filter((u) => u.active).length;
  const companyAdminsCount = users.filter((u) => u.role === "company_admin" || u.role === "Company Admin").length;


  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedRows([]);
  };

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'User',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200/50 shadow-2xs">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-semibold text-zinc-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
              {row.name}
            </p>
            <p className="text-xs text-zinc-500 truncate" title={row.email}>
              {row.email || '—'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      label: 'Role',
      sortable: false,
      render: (val, row) => {
        const rawRole = row?.role || val;
        let role = typeof rawRole === 'string' ? rawRole : '';
        if (!role && Array.isArray(rawRole) && rawRole.length > 0) {
          role = typeof rawRole[0] === 'string' ? rawRole[0] : (rawRole[0]?.name || rawRole[0]?.roleName || rawRole[0]?.code || '');
        } else if (!role && rawRole && typeof rawRole === 'object') {
          role = rawRole.name || rawRole.roleName || rawRole.code || '';
        }
        if (!role && row?.roles) {
          const rawRoles = row.roles;
          if (Array.isArray(rawRoles) && rawRoles.length > 0) {
            role = typeof rawRoles[0] === 'string' ? rawRoles[0] : (rawRoles[0]?.name || rawRoles[0]?.roleName || rawRoles[0]?.code || '');
          }
        }
        const safeRole = String(role || 'User');
        const color = safeRole === 'company_admin' || safeRole === 'Admin' || safeRole === 'super_admin'
          ? 'indigo'
          : safeRole === 'Manager' || safeRole === 'FINANCE_MANAGER'
          ? 'purple'
          : safeRole === 'ACCOUNTANT' || safeRole === 'Accountant'
          ? 'emerald'
          : 'zinc';
        const displayRole = safeRole === 'company_admin'
          ? 'Company Admin'
          : safeRole === 'employee'
          ? 'Employee'
          : safeRole.replace(/_/g, ' ');
        return (
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-md border bg-${color}-50 text-${color}-700 border-${color}-200/60 uppercase`}>
             {displayRole}
          </span>
        );
      }
    },
    {
      id: 'username',
      label: 'Username',
      sortable: false,
      render: (val, row) => <span className="text-sm text-zinc-700">{row.username || '-'}</span>
    },
    {
      id: 'empId',
      label: 'Employee ID',
      sortable: false,
      render: (val, row) => <span className="text-sm text-zinc-700 font-mono">{row.empId || 'N/A'}</span>
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
    },
    {
      id: 'emailStatus',
      label: 'Email Status',
      sortable: false,
      align: 'center',
      render: (val, row) => (
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-md border uppercase ${row.emailStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
          {row.emailStatus || 'UNVERIFIED'}
        </span>
      )
    }
  ], []);

  const basicFilters = useMemo(() => {
    const arr = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All Statuses', value: 'All' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Blocked', value: 'BLOCKED' },
        ]
      },
      {
        id: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { label: 'All Roles', value: 'All' },
          ...(Array.isArray(availableRoles) ? availableRoles : []).map(r => ({ label: r.name || r.roleName || 'Unnamed Role', value: r.name || r.roleName }))
        ]
      }
    ];
    if (isSuperAdminGlobal) {
      arr.push({
        id: 'companyId',
        label: 'Company',
        type: 'select',
        options: [
          { label: 'All Companies', value: '' },
          ...(Array.isArray(companies) ? companies : []).map(c => ({ label: c.name || c.companyName || c.code || 'Unnamed Company', value: c.id || c.companyId }))
        ]
      });
    }
    return arr;
  }, [availableRoles, isSuperAdminGlobal, companies]);

  const advancedFilters = useMemo(() => [
    {
      title: 'User Details',
      fields: [
        { id: 'name', label: 'Name', placeholder: 'Exact or partial name' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'user@company.com' },
        { id: 'username', label: 'Username', placeholder: 'Username' },
        { id: 'empId', label: 'Employee ID', placeholder: 'Employee ID' }
      ]
    },
    {
      title: 'Date Filters',
      colSpan: 'full',
      fields: [
        { id: 'createdFrom', label: 'Created From', type: 'date' },
        { id: 'createdTo', label: 'Created To', type: 'date' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => openDetailsModal(row),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'change-password',
      label: 'Change Password',
      icon: Key,
      onClick: (row) => openChangePasswordModal(row),
      tooltip: 'Change Password',
      className: 'hover:text-amber-600 hover:bg-amber-50'
    },
    ...(canEdit() ? [
      {
        key: 'assign-role',
        label: 'Assign Role',
        icon: UserCog,
        onClick: (row) => openRoleModal(row),
        tooltip: 'Assign Role',
        className: 'hover:text-emerald-600 hover:bg-emerald-50'
      },
      {
        key: 'assign-access',
        label: 'Manage Module Access',
        icon: Layers,
        onClick: (row) => openModuleModal(row),
        tooltip: 'Manage Module Access',
        className: 'hover:text-purple-600 hover:bg-purple-50'
      },
      {
        key: 'edit',
        label: 'Edit User',
        icon: Edit2,
        onClick: (row) => openEditModal(row),
        tooltip: 'Edit User',
        className: 'hover:text-indigo-600 hover:bg-indigo-50'
      }
    ] : []),
    ...(canDelete() ? [
      {
        key: 'delete',
        label: 'Delete User',
        icon: Trash2,
        danger: true,
        onClick: (row) => handleDelete(row.id, row.name),
        tooltip: 'Delete User'
      }
    ] : []),
    {
      key: 'resend-setup-email',
      label: 'Resend Setup Email',
      icon: Mail,
      onClick: (row) => handleResendSetupEmail(row),
      tooltip: 'Resend Setup Email',
      className: 'hover:text-sky-600 hover:bg-sky-50'
    }
  ], [canEdit, canDelete, handleDelete, handleResendSetupEmail]);

  const renderExpandedRow = (user) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</span>
          <p className="text-sm font-semibold text-zinc-900">{user.name || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Employee ID</span>
          <p className="text-sm font-semibold text-zinc-900">{user.empId || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</span>
          <div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {user.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</span>
          <p className="text-sm font-medium text-zinc-700">{user.email || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">System Role</span>
          <p className="text-sm font-medium text-zinc-700">{user.role === 'company_admin' ? 'Company Admin' : user.role === 'employee' ? 'Employee' : user.role || 'User'}</p>
        </div>
        {isSuperAdminGlobal && (
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Company</span>
            <p className="text-sm font-medium text-zinc-700">
              {user.companyId ? ((Array.isArray(companies) ? companies : []).find(c => (c.id || c.companyId) === user.companyId)?.name || (Array.isArray(companies) ? companies : []).find(c => (c.id || c.companyId) === user.companyId)?.companyName || user.companyId) : user.companyCode || 'N/A'}
            </p>
          </div>
        )}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Registered At</span>
          <p className="text-sm font-medium text-zinc-700">
            {user.created || '-'}
          </p>
        </div>
        {user.role === 'employee' && user.permissions?.length > 0 && (
          <div className="space-y-1 col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Module Access</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.permissions.map(p => {
                const modName = availableModules.find(m => m.id === p || m.globalId === p || m.label === p)?.label || p;
                return (
                  <span key={p} className="text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50 px-2 py-0.5 rounded">
                    {modName}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {user.notes && (
          <div className="space-y-1 col-span-full bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block">
              Onboarding Notes
            </span>
            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">{user.notes}</p>
          </div>
        )}
        {user.emailStatus !== 'VERIFIED' && (
          <div className="col-span-full flex items-center justify-between bg-sky-50/70 border border-sky-200/70 rounded-lg p-3">
            <div className="text-xs text-sky-800">
              <span className="font-bold">Pending Password Setup:</span> The user has not activated their account yet.
            </div>
            <button
              onClick={() => handleResendSetupEmail(user)}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Mail size={13} />
              <span>Resend Setup Email</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="User Management"
        description="Control organizational users, roles assignment, status and password resets"
      >
        <PermissionGuard permission="USER:CREATE">
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            <span>Provision User</span>
          </button>
        </PermissionGuard>
      </PageHeader>
      <ModuleTabs tabs={userTabs} activeKey="users" />
      
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="USER"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={displayedUsers}
          rowKey="id"
          loading={isLoading}
          emptyMessage={!activeCompanyId ? "Please Select a Company" : "No users found"}
          emptyDescription={!activeCompanyId ? "Select a company from the filter above to view its users." : "No users match your filters."}
          
          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search by name, email or username..."
          onSearchChange={setSearchTerm}
          createOption={{
            enabled: canCreate(),
            label: (val) => `Provision "${val}"`,
            description: 'Provision a new user account',
            onCreate: (term) => {
               // Open modal optionally pre-filled if logic supported
               openCreateModal();
            }
          }}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={(key, val) => {
            if (val === 'All' || val === '') removeFilter(key);
            else setFilter(key, val);
          }}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={fetchUsers}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={totalPages > 0 ? {
            page: paginationProps.page,
            pageSize: paginationProps.pageSize,
            totalPages: totalPages,
            totalElements: totalElements
          } : undefined}
          pageIndexBase={0}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          itemName="users"

          // Empty State
          emptyMessage={skipFetch ? 'No Company Selected' : 'No users found'}
          emptyDescription={
            skipFetch 
              ? 'Please select a company from the dropdown to view its users.' 
              : 'Try adjusting your search keywords or filter criteria to find users.'
          }
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="usermanagement-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />

      {/* Modals */}

      <UserCreateEditModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchUsers();
        }}
        currentUser={null}
        companyId={activeCompanyId}
        createUserMutation={createUser}
        updateUserMutation={updateUser}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Edit User"
        fields={FILTER_CONFIGS.users.updateConfig.fields}
        initialData={currentUser}
        onSubmit={handleUpdateUser}
        isSubmitting={false}
      />

      <UserModuleAccessModal
        isOpen={showModuleModal}
        onClose={() => {
          setShowModuleModal(false);
          setModuleTargetUser(null);
        }}
        onUpdated={fetchUsers}
        user={moduleTargetUser}
        companyId={activeCompanyId || moduleTargetUser?.companyId || moduleTargetUser?.company?.id}
        availableModules={availableModules}
        initialPermissions={initialPermissions}
        grantPortalAccessMutation={grantPortalAccess}
        revokePortalAccessMutation={removePortalAccess}
        togglePortalAccessMutation={togglePortalAccess}
        canAssignModules={canAssignModules}
      />

      <UserChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={passwordTargetUser}
        changeUserPasswordMutation={changePassword}
      />

      <UserAssignRoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
        }}
        onUpdated={fetchUsers}
        user={roleTargetUser}
        availableRoles={availableRoles}
        assignUserRoleMutation={assignRole}
      />

    </div>
  );
}
