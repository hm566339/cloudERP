import React, { useState, useMemo } from 'react';
import { Network, Plus, Edit2, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRBAC } from '../../../utils/rbac';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ModuleRouteFormModal from '../components/ModuleRouteFormModal';
import { getModuleRoutes, deleteModuleRoute, updateModuleRouteStatus } from '../../../api/sso';

const DEFAULT_COLUMNS = [
  'moduleName',
  'apiPattern',
  'serviceUrl',
  'active',
  'routeOrder'
];

const getRouteList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.moduleRoutes)) return response.moduleRoutes;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.records)) return response.records;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return {};
  return response?.pagination || response?.data?.pagination || response?._pageInfo || {};
};

export default function ModuleRoutesList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isSuperAdmin } = useRBAC();
  
  // Only super admin can access this page
  const isSuperAdminGlobal = isSuperAdmin && location.pathname.startsWith('/super-admin');

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.search && filters.search.trim()) q.search = filters.search.trim();
    if (filters.active !== undefined && filters.active !== '' && filters.active !== 'All') {
      q.active = filters.active;
    }
    return q;
  }, [filters]);

  const { data: responseData, isLoading, refetch } = useApiQuery(
    getModuleRoutes,
    { ...queryFilters, ...apiParams },
    { skip: !isSuperAdminGlobal }
  );

  const routes = getRouteList(responseData);
  const pageInfo = getPageInfo(responseData);

  const deleteMutation = useApiMutation(deleteModuleRoute);
  const activateMutation = useApiMutation((id) => updateModuleRouteStatus(id, true));
  const deactivateMutation = useApiMutation((id) => updateModuleRouteStatus(id, false));

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Route',
      'Are you sure you want to delete this route mapping? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Module route deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete route' }));
        }
      }
    );
  };

  const toggleStatus = async (route) => {
    const isActivating = !route.active;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Route`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} this route mapping?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync(route.id);
          } else {
            await deactivateMutation.mutateAsync(route.id);
          }
          dispatch(addAlert({ type: 'success', message: `Route ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleEdit = (route) => {
    setSelectedRoute(route);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedRoute(null);
    setIsFormOpen(true);
  };

  const columns = useMemo(() => [
    {
      id: 'moduleName',
      label: 'Module Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.moduleName || '-'}</span>
      )
    },
    {
      id: 'apiPattern',
      label: 'Route / API Path',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.apiPattern || '-'}
        </span>
      )
    },
    {
      id: 'serviceUrl',
      label: 'Service URL',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-zinc-600 truncate max-w-[200px] block">
          {row.serviceUrl || '-'}
        </span>
      )
    },
    {
      id: 'routeOrder',
      label: 'Order',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <span className="text-sm text-zinc-500">{row.routeOrder ?? '-'}</span>
      )
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(row);
          }}
          className="hover:opacity-80 transition-opacity"
          title={`Click to ${row.active ? 'deactivate' : 'activate'}`}
        >
          <DataTableStatusBadge
            isActive={row.active}
            activeText="Active"
            inactiveText="Inactive"
          />
        </button>
      )
    }
  ], [toggleStatus]);

  const basicFilters = useMemo(() => [
    {
      id: 'active',
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
      label: 'Edit Route',
      icon: Edit2,
      onClick: handleEdit
    },
    {
      label: 'Delete Route',
      icon: Trash2,
      onClick: (row) => handleDelete(row.id),
      danger: true
    }
  ], [handleEdit, handleDelete]);

  if (!isSuperAdminGlobal) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-zinc-100 m-6">
        <h2 className="text-xl font-semibold text-zinc-800">Access Denied</h2>
        <p className="text-zinc-500 mt-2">You do not have permission to view module routes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Module Routes"
        description="Manage module routes and API endpoint configurations."
      >
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>Create Route</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={routes}
          rowKey="id"
          loading={isLoading}
          
          // Search
          searchable
          searchValue={filters.search || ''}
          searchPlaceholder="Search routes..."
          onSearchChange={(val) => {
            setFilter('search', val);
            setPage(0);
          }}

          // Column Visibility
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}

          // Basic Filters
          filters={basicFilters}
          filterValues={{ active: filters.active || 'All' }}
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
          itemName="routes"

          emptyMessage="No module routes found"
          emptyDescription="Try adjusting your search or filters to find what you're looking for."
        />
      </div>

      {isFormOpen && (
        <ModuleRouteFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedRoute}
          onSuccess={() => {
            setIsFormOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
