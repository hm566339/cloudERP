import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle, Key } from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { getAllPermissions, createPermission } from '../../../api/sso/permission';
import PermissionFormModal from '../components/PermissionFormModal';

import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { securityTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import PermissionGuard from '../../../components/common/PermissionGuard';

export default function PermissionList() {
  const dispatch = useAppDispatch();

  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(['featureCode', 'featureName', 'action', 'permissionCode', 'description', 'active']);
  const [sortBy, setSortBy] = useState('featureName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      dispatch(addAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load permissions. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [dispatch]);

  const handleCreatePermission = async (formData) => {
    try {
      await createPermission(formData);
      dispatch(addAlert({
        type: 'success',
        title: 'Success',
        message: 'Permission created successfully'
      }));
      setIsCreateModalOpen(false);
      fetchPermissions();
    } catch (error) {
      dispatch(addAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create permission'
      }));
      throw error;
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        permission.featureCode?.toLowerCase().includes(searchLower) ||
        permission.featureName?.toLowerCase().includes(searchLower) ||
        permission.action?.toLowerCase().includes(searchLower) ||
        permission.permissionCode?.toLowerCase().includes(searchLower) ||
        permission.description?.toLowerCase().includes(searchLower);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = permission.active !== false;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = permission.active === false;
      }

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const aVal = String(a[sortBy] || '').toLowerCase();
      const bVal = String(b[sortBy] || '').toLowerCase();
      if (sortOrder === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });
  }, [permissions, searchTerm, sortBy, sortOrder, statusFilter]);

  const paginatedPermissions = useMemo(() => {
    const start = page * pageSize;
    return filteredPermissions.slice(start, start + pageSize);
  }, [filteredPermissions, page, pageSize]);

  const columns = useMemo(() => [
    {
      id: 'featureCode',
      label: 'Feature Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs font-medium bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
          {row.featureCode}
        </span>
      )
    },
    {
      id: 'featureName',
      label: 'Feature Name',
      sortable: true,
      render: (val, row) => <div className="font-medium text-zinc-900 truncate">{row.featureName}</div>
    },
    {
      id: 'action',
      label: 'Action',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {row.action}
        </span>
      )
    },
    {
      id: 'permissionCode',
      label: 'Permission Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-[10px] text-zinc-500 truncate block max-w-[150px]" title={row.permissionCode}>
          {row.permissionCode}
        </span>
      )
    },
    {
      id: 'description',
      label: 'Description',
      sortable: false,
      render: (val, row) => (
        <div className="text-xs text-zinc-500 truncate max-w-xs" title={row.description || '-'}>
          {row.description || '-'}
        </div>
      )
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active !== false ? 'ACTIVE' : 'INACTIVE'} />
    }
  ], []);

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(columnId);
  };

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ]
    }
  ], []);

  const handleFilterChange = (filterId, value) => {
    if (filterId === 'status') {
      setStatusFilter(value);
      setPage(0);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSelectedRows([]);
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="User Permissions"
        description="Manage permission definitions and action-level access controls."
      >
        <PermissionGuard permission="PERMISSION:CREATE">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Permission</span>
          </button>
        </PermissionGuard>
      </PageHeader>
      
      <ModuleTabs tabs={securityTabs} activeKey="user-permissions" />

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="PERMISSION"
          showIndex
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          data={paginatedPermissions}
          columns={columns}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          loading={isLoading}
          
          searchable
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search permissions..."
          
          filters={basicFilters}
          filterValues={{ status: statusFilter }}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          
          onSortChange={handleSort}
          
          pagination={{
            page,
            pageSize,
            totalElements: filteredPermissions.length,
            totalPages: Math.ceil(filteredPermissions.length / pageSize),
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(0);
            }
          }}
          
          emptyMessage="No permissions found"
          emptyDescription={searchTerm ? "No permissions match your search criteria" : "Get started by creating your first permission definition."}
        />
      </div>

      <PermissionFormModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePermission}
      />
    </div>
  );
}
