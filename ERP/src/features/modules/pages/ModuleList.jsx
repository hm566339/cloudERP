import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Eye, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ModuleFormModal from '../components/ModuleFormModal';
import { getModules, deleteModule, updateModuleStatus } from '../../../api/sso/module';

const DEFAULT_COLUMNS = [
  'name',
  'host',
  'status',
  'createdAt'
];

const getModuleList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.modules)) return response.modules;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.records)) return response.records;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return {};
  return response?.pagination || response?.data?.pagination || response?._pageInfo || {};
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export default function ModuleList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.search && filters.search.trim()) q.search = filters.search.trim();
    if (filters.status !== undefined && filters.status !== '' && filters.status !== 'All') {
      q.status = filters.status;
    }
    return q;
  }, [filters]);

  const { data: responseData, isLoading, refetch } = useApiQuery(
    getModules,
    { ...queryFilters, ...apiParams }
  );

  const modules = getModuleList(responseData);
  const pageInfo = getPageInfo(responseData);

  const deleteMutation = useApiMutation(deleteModule);
  const activateMutation = useApiMutation((id) => updateModuleStatus(id, true));
  const deactivateMutation = useApiMutation((id) => updateModuleStatus(id, false));

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Module',
      'Are you sure you want to delete this module? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Module deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete module' }));
        }
      }
    );
  };

  const toggleStatus = async (mod) => {
    const isActivating = !mod.moduleStatus;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Module`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${mod.name}?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync(mod.id);
          } else {
            await deactivateMutation.mutateAsync(mod.id);
          }
          dispatch(addAlert({ type: 'success', message: `Module ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleEdit = (mod) => {
    setSelectedModule(mod);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedModule(null);
    setIsFormOpen(true);
  };
  
  const handleView = (mod) => {
    navigate(`${location.pathname}/${mod.id}`);
  };

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Module',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
            <Globe size={16} className="text-zinc-500" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900">{row.name}</div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">{row.id?.substring(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      id: 'host',
      label: 'Host URL',
      sortable: true,
      render: (val, row) => (
        <div className="max-w-[200px] truncate text-sm text-zinc-600">
          {row.host || '-'}
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(row);
          }}
          className="hover:opacity-80 transition-opacity"
          title={`Click to ${row.moduleStatus ? 'deactivate' : 'activate'}`}
        >
          <DataTableStatusBadge
            isActive={row.moduleStatus}
            activeText="Active"
            inactiveText="Inactive"
          />
        </button>
      )
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-zinc-600">{formatDate(row.createdAt)}</span>
      )
    }
  ], [toggleStatus]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleView
    },
    {
      label: 'Edit Module',
      icon: Edit2,
      onClick: handleEdit,
      permission: { module: 'MODULES', action: 'WRITE' }
    },
    {
      label: 'Delete Module',
      icon: Trash2,
      onClick: (row) => handleDelete(row.id),
      danger: true,
      permission: { module: 'MODULES', action: 'DELETE' }
    }
  ], [handleEdit, handleDelete]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Module Management"
        description="Manage system modules and their configurations."
      >
        <RequirePermission module="MODULES" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Module</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="MODULES"
          columns={columns}
          data={modules}
          rowKey="id"
          loading={isLoading}
          
          // Search
          searchable
          searchValue={filters.search || ''}
          searchPlaceholder="Search modules..."
          onSearchChange={(val) => {
            setFilter('search', val);
            setPage(0);
          }}

          // Column Visibility
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}

          // Basic Filters
          filters={basicFilters}
          filterValues={{ status: filters.status || 'All' }}
          onFilterChange={(key, val) => {
            if (val === 'All' || val === '') {
              setFilter(key, undefined);
            } else {
              setFilter(key, val);
            }
            setPage(0);
          }}

          // Reset
          onReset={handleReset}

          // Row Actions
          rowActions={rowActions}
          onRowClick={handleView}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Pagination
          pagination={pageInfo?.totalPages ? {
            page,
            pageSize: pageInfo.pageSize ?? 10,
            totalPages: pageInfo.totalPages,
            totalElements: pageInfo.totalCount
          } : undefined}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          itemName="modules"

          emptyMessage="No modules found"
          emptyDescription="Try adjusting your search or filters to find what you're looking for."
        />
      </div>

      {isFormOpen && (
        <ModuleFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedModule}
          onSuccess={() => {
            setIsFormOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}