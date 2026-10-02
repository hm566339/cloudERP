import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShieldCheck, Plus, Check, Settings, Trash2, Users, Key, Sliders, Save, RotateCcw,
  Search, Info, Layers, Lock, ShieldAlert, CheckCircle2, XCircle, Shield,
  Eye, Edit2, AlertCircle, CheckCircle, FileText
} from 'lucide-react'
import ModuleTabs from '../../../components/module-tabs/ModuleTabs';
import { userTabs } from '../../../components/module-tabs';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import Modal from '../../../components/common/Modal';
import ExportModal from '../../../components/common/ExportModal';
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import { useParams } from 'react-router-dom'
import { useRBAC } from '../../../utils/rbac'
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRoleStatus,
  getRolePermissions,
  syncRolePermissions
} from '../../../api/sso/role'
import { assignRole as assignUserRole, removeRole as removeUserRole } from '../../../api/sso/user'
import { getAllFeatures } from '../../../api/sso/feature'
import { getAllPermissions } from '../../../api/sso/permission'
import UserFeaturePermissionModal from '../components/UserFeaturePermissionModal'
import apiClient from '../../../api/common/client'
import { confirmDialog } from '../../../utils/confirmDialog'
import useDebounce from '../../../hooks/useDebounce'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import { FILTER_CONFIGS } from '../../../constants/filterConfigs'

export default function RoleList() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const dispatch = useAppDispatch()

  const { apiParams, filterBarProps, paginationProps } = useApiFilters(FILTER_CONFIGS.roles, { defaultPageSize: 10 });

  const [rolesData, setRolesData] = useState({ roles: [], totalPages: 1, totalCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const roles = rolesData.roles || []

  const fetchRoles = useCallback(async () => {
    if (!companyId) return
    setIsLoading(true)
    try {
      const data = await getRoles({ companyId, ...apiParams })
      const rolesArray = Array.isArray(data) ? data : data.roles || data.content || data.data?.content || data.data || []
      const pagination = data._pageInfo || data.pagination || null
      const totalPages = pagination?.totalPages || data.totalPages || data.data?.totalPages || 1
      const totalCount = pagination?.totalCount || pagination?.totalElements || data.totalElements || data.data?.totalElements || rolesArray.length

      setRolesData({
        roles: rolesArray.map(r => ({ ...r, active: r.status })),
        totalPages,
        totalCount
      })
    } catch (error) {
      console.error('Failed to fetch roles', error)
      dispatch(addAlert({ type: 'error', message: 'Failed to fetch roles' }))
    } finally {
      setIsLoading(false)
    }
  }, [companyId, JSON.stringify(apiParams), dispatch])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const { isAdmin } = useRBAC()

  const [selectedRole, setSelectedRole] = useState(null)
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [showAddRole, setShowAddRole] = useState(false)
  const [editRoleId, setEditRoleId] = useState(null)

  // Active Tab: 'users' or 'permissions'
  const [activeTab, setActiveTab] = useState(null)

  // Action-Level Permissions Matrix State
  const [allPermissions, setAllPermissions] = useState([])        // catalog: all available permissions
  const [featuresList, setFeaturesList] = useState([])            // feature catalog for module resolution
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  // rolePermissions: Set of permissionCodes that are enabled for the selected role
  const [rolePermissions, setRolePermissions] = useState(new Set())
  const [initialRolePermissions, setInitialRolePermissions] = useState(new Set())
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL')

  // User Feature + Permission Modal State
  const [permissionModalUser, setPermissionModalUser] = useState(null)

  const [showAssignUser, setShowAssignUser] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const debouncedSearch = useDebounce(userSearchQuery, 500)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [assignedPage, setAssignedPage] = useState(0);
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const debouncedAssignedSearch = useDebounce(assignedSearchTerm, 500);
  const [assignedStatus, setAssignedStatus] = useState('');

  const [usersData, setUsersData] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(['name', 'description', 'status']);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  // Load features catalog (for module resolution) + all permissions catalog on mount
  useEffect(() => {
    let isMounted = true
    Promise.all([
      getAllFeatures().catch(() => []),
      getAllPermissions().catch(() => [])
    ]).then(([features, perms]) => {
      if (isMounted) {
        setFeaturesList(Array.isArray(features) ? features : [])
        setAllPermissions(Array.isArray(perms) ? perms : [])
      }
    }).catch(err => {
      console.error('Failed to load permissions catalog', err)
    })
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (companyId && showAssignUser) {
      setIsSearchingUsers(true)
      apiClient.get(companyId ? `/api/sso/user/company/${companyId}` : `/api/sso/user`, {
        params: { search: userSearchQuery, page: 1, pageSize: 50 }
      })
        .then(res => setUsersData(res.data?.data || res.data))
        .catch(err => console.error("Failed to search users", err))
        .finally(() => setIsSearchingUsers(false));
    }
  }, [companyId, userSearchQuery, showAssignUser])

  const allUsers = usersData?.users || (Array.isArray(usersData) ? usersData : [])

  useEffect(() => {
    if (roles.length > 0 && (!selectedRole || !roles.find(r => r.id === selectedRole.id))) {
      setSelectedRole(roles[0])
    }
  }, [roles, selectedRole])

  useEffect(() => {
    if (selectedRole?.id) {
      setAssignedPage(0);
      setAssignedSearchTerm('');
      setAssignedStatus('');
    }
  }, [selectedRole?.id]);

  // Load action-level permissions for selected role
  useEffect(() => {
    if (!selectedRole?.id) {
      setRolePermissions(new Set())
      setInitialRolePermissions(new Set())
      return
    }
    setIsLoadingPermissions(true)
    getRolePermissions(selectedRole.id)
      .then(data => {
        const list = Array.isArray(data) ? data : []
        // Build a Set of "featureCode::action" keys that are enabled
        const enabledKeys = new Set(
          list.filter(p => p.active !== false).map(p => `${p.featureCode}::${p.action}`)
        )
        setRolePermissions(enabledKeys)
        setInitialRolePermissions(new Set(enabledKeys))
      })
      .catch(err => {
        console.error('Failed to load role permissions', err)
        setRolePermissions(new Set())
        setInitialRolePermissions(new Set())
      })
      .finally(() => setIsLoadingPermissions(false))
  }, [selectedRole?.id])

  const [selectedRoleData, setSelectedRoleData] = useState(null)
  const [isLoadingRoleDetails, setIsLoadingRoleDetails] = useState(false)

  const fetchRoleDetails = useCallback(async () => {
    if (!selectedRole?.id) return
    setIsLoadingRoleDetails(true)
    try {
      const data = await getRoleById(selectedRole.id, {
        page: assignedPage,
        pageSize: 10,
        search: debouncedAssignedSearch,
        status: assignedStatus === '' ? undefined : assignedStatus === 'true'
      })
      setSelectedRoleData(data)
    } catch (error) {
      console.error('Failed to fetch role details', error)
    } finally {
      setIsLoadingRoleDetails(false)
    }
  }, [selectedRole?.id, assignedPage, debouncedAssignedSearch, assignedStatus])

  useEffect(() => {
    fetchRoleDetails()
  }, [fetchRoleDetails])

  const assignedUsers = selectedRoleData?.users || []

  // Check unsaved changes for permissions matrix (Set comparison)
  const hasUnsavedChanges = useMemo(() => {
    if (rolePermissions.size !== initialRolePermissions.size) return true
    for (const key of rolePermissions) {
      if (!initialRolePermissions.has(key)) return true
    }
    return false
  }, [rolePermissions, initialRolePermissions])

  // All unique actions from the catalog
  const allActions = useMemo(() => {
    const set = new Set(allPermissions.map(p => p.action))
    const order = ['READ', 'WRITE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT']
    return [...order.filter(a => set.has(a)), ...Array.from(set).filter(a => !order.includes(a))]
  }, [allPermissions])

  // Group permissions by module → featureCode → action
  const groupedPermissions = useMemo(() => {
    const featureMap = {}
    allPermissions.forEach(p => {
      if (!featureMap[p.featureCode]) {
        const feat = featuresList.find(f => f.code === p.featureCode)
        featureMap[p.featureCode] = {
          featureCode: p.featureCode,
          featureName: p.featureName || p.featureCode,
          moduleName: feat?.moduleName || p.moduleName || 'CORE',
          actions: {}
        }
      }
      featureMap[p.featureCode].actions[p.action] = p
    })

    // Group by module
    const moduleMap = {}
    Object.values(featureMap).forEach(feat => {
      const term = permissionSearch.toLowerCase()
      if (selectedModuleFilter !== 'ALL' && feat.moduleName !== selectedModuleFilter) return
      if (term) {
        const matches = (
          feat.featureCode.toLowerCase().includes(term) ||
          feat.featureName.toLowerCase().includes(term) ||
          feat.moduleName.toLowerCase().includes(term)
        )
        if (!matches) return
      }
      if (!moduleMap[feat.moduleName]) moduleMap[feat.moduleName] = []
      moduleMap[feat.moduleName].push(feat)
    })
    return moduleMap
  }, [allPermissions, featuresList, permissionSearch, selectedModuleFilter])

  const availableModules = useMemo(() => {
    const set = new Set(allPermissions.map(p => {
      const feat = featuresList.find(f => f.code === p.featureCode)
      return feat?.moduleName || p.moduleName || 'CORE'
    }))
    return Array.from(set)
  }, [allPermissions, featuresList])

  const handleTogglePermission = (featureCode, action) => {
    const key = `${featureCode}::${action}`
    setRolePermissions(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const handleToggleModuleAll = (moduleName, enableAll) => {
    const moduleFeatures = groupedPermissions[moduleName] || []
    setRolePermissions(prev => {
      const next = new Set(prev)
      moduleFeatures.forEach(feat => {
        Object.keys(feat.actions).forEach(action => {
          const key = `${feat.featureCode}::${action}`
          if (enableAll) { next.add(key) } else { next.delete(key) }
        })
      })
      return next
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRole?.id) return
    setIsSavingPermissions(true)
    try {
      // Build the full permission sync payload from the catalog
      const permissionsPayload = allPermissions.map(p => ({
        featureCode: p.featureCode,
        action: p.action,
        enabled: rolePermissions.has(`${p.featureCode}::${p.action}`)
      }))
      await syncRolePermissions(selectedRole.id, permissionsPayload)
      setInitialRolePermissions(new Set(rolePermissions))
      dispatch(addAlert({
        type: 'success',
        message: `Permissions synced for role "${selectedRole.name}".`
      }))
    } catch (err) {
      console.error('Failed to sync role permissions', err)
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to sync role permissions'
      }))
    } finally {
      setIsSavingPermissions(false)
    }
  }

  const handleResetPermissions = () => {
    setRolePermissions(new Set(initialRolePermissions))
  }

  const handleAddRoleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = roleName.trim().toUpperCase().replace(/\s+/g, '_')
    if (!trimmedName) {
      dispatch(addAlert({ type: 'warning', message: 'Role Name is required' }))
      return
    }

    const ROLE_NAME_REGEX = /^[A-Z_]{3,20}$/
    if (!ROLE_NAME_REGEX.test(trimmedName)) {
      dispatch(addAlert({ 
        type: 'warning', 
        message: 'Role Name must contain only uppercase letters and underscores, between 3 and 20 characters (e.g. SALES_MANAGER)' 
      }))
      return
    }

    if (editRoleId) {
      try {
        const updated = await updateRole(editRoleId, { name: trimmedName, status: true })
        setSelectedRole(updated)
        dispatch(addAlert({ type: 'success', message: `Role updated to "${trimmedName}"` }))
        setShowAddRole(false)
        setEditRoleId(null)
        setRoleName('')
        setRoleDesc('')
        fetchRoles()
      } catch (error) {
        console.error('API updateRole failed.', error)
        dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || error?.message || 'Failed to update role.' }))
      }
      return
    }

    try {
      const created = await createRole(companyId, { name: trimmedName, status: true })
      setSelectedRole(created)
      setShowAddRole(false)
      setRoleName('')
      setRoleDesc('')
      dispatch(addAlert({ type: 'success', message: `Role "${trimmedName}" created.` }))
      fetchRoles()
    } catch (error) {
      console.error('API createRole failed.', error)
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || error?.message || 'Failed to create role.' }))
    }
  }

  const handleEditRole = (e, role) => {
    e.stopPropagation()
    setRoleName(role.name)
    setRoleDesc(role.description || '')
    setEditRoleId(role.id)
    setShowAddRole(true)
  }

  const handleDeleteRole = async (e, role) => {
    e.stopPropagation()
    if (await confirmDialog({ message: `Are you sure you want to delete role: ${role.name}? This action cannot be undone.` })) {
      try {
        await deleteRole(role.id)
        dispatch(addAlert({ type: 'success', message: 'Role deleted successfully.' }))
        if (selectedRole?.id === role.id) {
          setSelectedRole(null)
        }
        fetchRoles()
      } catch (error) {
        console.error("Delete role error", error)
        dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || error?.message || 'Failed to delete role.' }))
      }
    }
  }

  const handleToggleStatus = async (e, role) => {
    e.stopPropagation()
    try {
      await updateRoleStatus(role.id, !role.status)
      dispatch(addAlert({ type: 'success', message: `Role ${role.status ? 'disabled' : 'enabled'}` }))
      fetchRoles()
    } catch (error) {
      console.error("Toggle status error", error)
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || error?.message || 'Failed to update role status.' }))
    }
  }

  const handleRemoveUser = async (e, user) => {
    e.stopPropagation()
    if (await confirmDialog({ message: `Are you sure you want to remove ${user.fullName} from this role?` })) {
      try {
        await removeUserRole(user.id, selectedRole.id)
        dispatch(addAlert({ type: 'success', message: 'User removed from role successfully.' }))
        fetchRoleDetails()
      } catch (error) {
        console.error("Remove user role error", error)
        dispatch(addAlert({ type: 'error', message: 'Failed to remove user from role.' }))
      }
    }
  }

  const handleAssignUser = async () => {
    if (!selectedUserId) return
    try {
      await assignUserRole(selectedUserId, selectedRole.id)
      dispatch(addAlert({ type: 'success', message: 'User assigned to role successfully.' }))
      setShowAssignUser(false)
      setSelectedUserId('')
      setUserSearchQuery('')
      fetchRoleDetails()
    } catch (error) {
      console.error("Assign user role error", error)
      dispatch(addAlert({ type: 'error', message: 'Failed to assign user to role.' }))
    }
  }


  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Role Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-indigo-950 text-sm">{row.name}</span>
      )
    },
    {
      id: 'description',
      label: 'Description',
      sortable: false,
      render: (val, row) => (
        <span className="text-zinc-500 text-xs">{row.description || 'System Role'}</span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'users',
      label: 'Assigned Users',
      icon: Users,
      onClick: (row) => {
        setSelectedRole(row);
        setActiveTab('users');
      },
      tooltip: 'View Assigned Users',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },

    ...(isAdmin ? [
      {
        key: 'edit',
        label: 'Edit Role',
        icon: Edit2,
        onClick: (row) => handleEditRole({ stopPropagation: () => {} }, row),
        tooltip: 'Edit Role',
        className: 'hover:text-indigo-600 hover:bg-indigo-50'
      },
      {
        key: 'toggle-status',
        label: (row) => (row.status ? 'Deactivate' : 'Activate'),
        icon: (row) => (row.status ? AlertCircle : CheckCircle),
        onClick: (row) => handleToggleStatus({ stopPropagation: () => {} }, row),
        tooltip: (row) => (row.status ? 'Deactivate' : 'Activate'),
        className: (row) => row.status 
          ? 'hover:text-amber-600 hover:bg-amber-50' 
          : 'hover:text-emerald-600 hover:bg-emerald-50'
      },
      {
        key: 'delete',
        label: 'Delete Role',
        icon: Trash2,
        danger: true,
        onClick: (row) => handleDeleteRole({ stopPropagation: () => {} }, row),
        tooltip: 'Delete Role'
      }
    ] : [])
  ], [isAdmin, handleEditRole, handleToggleStatus, handleDeleteRole]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="Role Management"
        description="Design organizational security configurations by allocating system capabilities and overrides"
      >
        {isAdmin && (
          <button 
            onClick={() => {
              setRoleName('');
              setRoleDesc('');
              setEditRoleId(null);
              setShowAddRole(true);
            }} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Role</span>
          </button>
        )}
      </PageHeader>
      
      <ModuleTabs tabs={userTabs} activeKey="roles" />

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={roles}
          rowKey="id"
          loading={isLoading}
          
          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search roles..."
          onSearchChange={setSearchTerm}

          // Basic Filters
          filters={basicFilters}
          filterValues={filterBarProps.filters}
          onFilterChange={(key, val) => {
            if (val === 'All' || val === '') filterBarProps.removeFilter(key);
            else filterBarProps.setFilter(key, val);
          }}

          // Reset & Refresh & Export
          onReset={() => {
            filterBarProps.resetFilters();
            setSearchTerm('');
            setSelectedRows([]);
          }}
          onRefresh={fetchRoles}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Row Actions
          rowActions={rowActions}

          // Pagination
          pagination={rolesData.totalPages > 0 ? {
            page: paginationProps.page,
            pageSize: paginationProps.pageSize,
            totalPages: rolesData.totalPages,
            totalElements: rolesData.totalCount
          } : undefined}
          pageIndexBase={0}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          itemName="roles"

          // Empty State
          emptyMessage={'No roles found'}
          emptyDescription={'Try adjusting your search keywords or filter criteria.'}
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="rolemanagement-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />

      {/* Role Form Modal */}
      <Modal
        isOpen={showAddRole}
        onClose={() => {
          setShowAddRole(false);
          setEditRoleId(null);
        }}
        title={editRoleId ? "Edit Role" : "Create Role"}
        size="md"
      >
        <form onSubmit={handleAddRoleSubmit} className="space-y-4 p-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
              Role Name (UPPERCASE_WITH_UNDERSCORES)
            </label>
            <input
              type="text"
              placeholder="e.g. SALES_COORDINATOR"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-mono transition-all"
              autoFocus
            />
            <p className="text-[10px] text-zinc-400 mt-1">Allowed: 3-20 characters, A-Z and _ only.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddRole(false)
                setEditRoleId(null)
              }}
              className="flex-1 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all">
              {editRoleId ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Users Modal */}
      <Modal
        isOpen={activeTab === 'users'}
        onClose={() => setActiveTab(null)}
        title={
          <div className="flex items-center gap-2">
             <span>Assigned Users</span>
             <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-lg text-xs">
                {selectedRole?.name || '—'}
             </span>
          </div>
        }
        size="4xl"
      >
        <div className="p-5 flex flex-col h-[70vh] bg-zinc-50/50">
          <div className="flex justify-between items-center mb-4 gap-2">
             <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search assigned users..."
                  value={assignedSearchTerm}
                  onChange={(e) => setAssignedSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all max-w-sm"
                />
                <CustomSelect
                  value={assignedStatus}
                  onChange={(e) => setAssignedStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer min-w-[120px]"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="BLOCKED">Blocked</option>
                </CustomSelect>
             </div>
             {isAdmin && (
                <button
                  onClick={() => setShowAssignUser(!showAssignUser)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  <Plus size={14} strokeWidth={2} />
                  Assign User
                </button>
             )}
          </div>

          {showAssignUser && (() => {
            const filteredUsers = allUsers.filter(u => !assignedUsers.find(au => au.id === u.id))
            return (
              <div className="p-4 mb-4 bg-white border border-zinc-200 rounded-xl animate-slide-down flex flex-col gap-2 shadow-sm">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Select User (Search by Name or ID)
                </label>
                <div className="flex items-start gap-3 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value)
                        setSelectedUserId('')
                        setIsDropdownOpen(true)
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Type name, emp ID or username..."
                      className="w-full px-3 py-2 bg-white border border-zinc-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-medium outline-none transition-all shadow-sm"
                    />
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-zinc-200 shadow-xl rounded-lg z-50 py-1 divide-y divide-zinc-50">
                        {!userSearchQuery ? (
                          <div className="px-3 py-3 text-xs text-zinc-400 font-medium text-center">Type to search for users...</div>
                        ) : isSearchingUsers ? (
                          <div className="px-3 py-3 flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Searching...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-zinc-400 font-medium text-center">No users found matching "{userSearchQuery}"</div>
                        ) : (
                          filteredUsers.map(user => (
                            <div
                              key={user.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-zinc-50 transition-colors ${selectedUserId === user.id ? 'bg-primary/5 text-primary font-semibold' : 'text-zinc-700'}`}
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setUserSearchQuery(`${user.fullName || user.username} (${user.empId})`)
                                setIsDropdownOpen(false)
                              }}
                            >
                              <div className="font-semibold text-xs">{user.fullName || user.username}</div>
                              <div className="text-[10px] text-zinc-400 font-medium">{user.empId} • {user.email}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAssignUser}
                    disabled={!selectedUserId}
                    className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                  >
                    Assign User
                  </button>
                </div>
              </div>
            )
          })()}

          <div className="w-full flex-1 overflow-y-auto min-h-0 bg-white border border-zinc-200 rounded-xl shadow-2xs">
             {isLoadingRoleDetails ? (
               <div className="flex flex-col gap-0 overflow-hidden">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className={`animate-pulse flex items-center gap-4 p-4 ${i !== 2 ? 'border-b border-zinc-100' : ''}`}>
                     <div className="w-9 h-9 bg-zinc-100 rounded-full shrink-0" />
                     <div className="flex-1 space-y-2">
                       <div className="h-4 bg-zinc-100 rounded w-1/3" />
                       <div className="h-3 bg-zinc-50 rounded w-1/4" />
                     </div>
                   </div>
                 ))}
               </div>
             ) : assignedUsers.length > 0 ? (
               <div className="flex flex-col gap-0">
                 <div className="hidden md:flex items-center px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
                   <div className="w-[180px] shrink-0 pl-2">User</div>
                   <div className="flex-1 px-6">Details</div>
                   <div className="w-28 shrink-0 text-center">Status</div>
                   <div className="w-24 shrink-0 text-center">Actions</div>
                 </div>
                 {assignedUsers.map((user, index) => (
                   <div key={user.id} className={`hover:bg-zinc-50/60 transition-colors flex flex-col md:flex-row md:items-center ${index !== assignedUsers.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                     <div className="p-3.5 flex items-center gap-3 md:w-[180px] shrink-0 border-b md:border-b-0 md:border-r border-zinc-100">
                       <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                         {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                       </div>
                       <div className="min-w-0">
                         <p className="font-semibold text-zinc-900 text-xs truncate">{user.fullName || 'N/A'}</p>
                         <p className="text-[10px] font-mono text-zinc-400 truncate">{user.empId || 'No EmpID'}</p>
                       </div>
                     </div>
                     <div className="p-3.5 flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                       <div>
                         <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Username</div>
                         <div className="text-zinc-800 font-medium truncate">{user.username || 'N/A'}</div>
                       </div>
                       <div>
                         <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Email</div>
                         <div className="text-zinc-600 truncate">{user.email || 'N/A'}</div>
                       </div>
                     </div>
                     <div className="p-3.5 flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 md:border-l border-zinc-100 md:w-[140px] shrink-0">
                       <DataTableStatusBadge status={user.accountStatus} />
                       <div className="flex items-center gap-1">
                         <button
                           type="button"
                           onClick={() => setPermissionModalUser(user)}
                           className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                           title="Manage User Feature & Action Permissions"
                         >
                           <Key size={14} />
                         </button>
                         {isAdmin && (
                           <button
                             onClick={(e) => handleRemoveUser(e, user)}
                             className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                             title="Remove from role"
                           >
                             <Trash2 size={14} />
                           </button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                 <Users size={32} className="text-zinc-300 mb-3" />
                 <p className="text-sm font-semibold text-zinc-700">No users assigned to this role</p>
               </div>
             )}
          </div>
          
          {!isLoadingRoleDetails && selectedRoleData?.pagination && (
            <div className="pt-4 mt-auto">
              <Pagination
                page={assignedPage}
                totalPages={selectedRoleData.pagination.totalPages || 1}
                totalElements={selectedRoleData.pagination.totalCount || assignedUsers.length}
                pageSize={10}
                onPageChange={setAssignedPage}
                itemName="assigned users"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Permissions Matrix Modal */}
      <Modal
        isOpen={activeTab === 'permissions'}
        onClose={() => setActiveTab(null)}
        title={
          <div className="flex items-center gap-2">
             <span>Permissions Matrix</span>
             <span className="text-zinc-600 font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg text-xs tracking-wider uppercase">
                {selectedRole?.name || '—'}
             </span>
             {hasUnsavedChanges && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold uppercase px-2 py-0.5 rounded animate-pulse">
                  Unsaved Changes
                </span>
             )}
          </div>
        }
        size="6xl"
      >
        <div className="p-5 flex flex-col h-[75vh] bg-zinc-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search features by name, code..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
            <CustomSelect
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer min-w-[140px]"
            >
              <option value="ALL">All Modules</option>
              {availableModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </CustomSelect>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPermissions}
                disabled={!hasUnsavedChanges || isSavingPermissions}
                className="btn-secondary disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={!hasUnsavedChanges || isSavingPermissions}
                className="btn-primary disabled:opacity-50"
              >
                <Save size={14} />
                {isSavingPermissions ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoadingPermissions ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border border-zinc-100 rounded-xl bg-white space-y-3">
                    <div className="h-4 bg-zinc-100 rounded w-1/4" />
                    <div className="h-10 bg-zinc-50 rounded" />
                  </div>
                ))}
              </div>
            ) : Object.keys(groupedPermissions).length > 0 ? (
              <div className="space-y-4 pr-1 pb-4">
                {Object.entries(groupedPermissions).map(([moduleName, moduleFeatures]) => {
                  const totalPerms = moduleFeatures.reduce((sum, f) => sum + Object.keys(f.actions).length, 0)
                  const enabledPerms = moduleFeatures.reduce((sum, f) => {
                    return sum + Object.keys(f.actions).filter(action => rolePermissions.has(`${f.featureCode}::${action}`)).length
                  }, 0)
                  const allEnabled = enabledPerms === totalPerms && totalPerms > 0

                  return (
                    <div key={moduleName} className="border border-zinc-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-3 sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-zinc-500" />
                          <span className="font-bold text-xs text-zinc-800 uppercase tracking-wider">{moduleName}</span>
                          <span className="text-[10px] font-semibold text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded-full">
                            {enabledPerms} / {totalPerms} enabled
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(moduleName, !allEnabled)}
                            className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 hover:underline px-2 py-0.5 uppercase tracking-wider"
                          >
                            {allEnabled ? 'Disable All' : 'Enable All'}
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <div className="flex items-center border-b border-zinc-100 bg-zinc-50/50 px-4 py-2 gap-4 min-w-[500px]">
                          <div className="flex-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Feature</div>
                          {allActions.map(action => (
                            <div key={action} className="w-16 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">{action}</div>
                          ))}
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {moduleFeatures.map((feat) => (
                            <div key={feat.featureCode} className="flex items-center px-4 py-3 gap-4 hover:bg-zinc-50/60 transition-colors min-w-[500px]">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-zinc-900">{feat.featureName}</span>
                                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{feat.featureCode}</span>
                                </div>
                              </div>
                              {allActions.map(action => {
                                const perm = feat.actions[action]
                                const key = `${feat.featureCode}::${action}`
                                const isEnabled = rolePermissions.has(key)
                                if (!perm) return <div key={action} className="w-16 flex justify-center shrink-0"><span className="text-zinc-200 text-[10px]">—</span></div>
                                
                                return (
                                  <div key={action} className="w-16 flex justify-center shrink-0">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={isEnabled}
                                      disabled={!isAdmin}
                                      onClick={() => handleTogglePermission(feat.featureCode, action)}
                                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isEnabled ? 'bg-zinc-900' : 'bg-zinc-200'
                                      }`}
                                    >
                                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center bg-white flex flex-col items-center justify-center">
                <Shield size={24} className="text-zinc-300 mb-2" />
                <h3 className="text-xs font-bold text-zinc-700">No permissions matched</h3>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* User Feature Permission Modal (nested originally) */}
      {permissionModalUser && (
        <UserFeaturePermissionModal
          user={permissionModalUser}
          isOpen={Boolean(permissionModalUser)}
          onClose={() => setPermissionModalUser(null)}
          onSuccess={fetchRoleDetails}
          selectedRole={selectedRole}
        />
      )}
    </div>
  )
}
