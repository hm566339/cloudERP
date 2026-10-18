import React, { useState, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Box, ShieldCheck, Tag, Info, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { featuresApi } from '../../../api/sso/feature';
import { getAllPermissions, createPermission } from '../../../api/sso/permission';
import { getModules } from '../../../api/sso/module';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { securityTabs, userTabs } from '../../../components/module-tabs';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import FeatureFormModal from '../components/FeatureFormModal';
import PermissionGuard from '../../../components/common/PermissionGuard';

const DEFAULT_COLUMNS = [
  'moduleName',
  'name',
  'code',
  'actions',
  'status',
  'createdAt'
];

const getFeatureList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getModuleList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.modules)) return response.modules;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.records)) return response.records;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return response._pageInfo || {};
  return (
    response?.pagination ||
    response?.data?.pagination ||
    response?.data?._pageInfo ||
    response?._pageInfo ||
    response ||
    {}
  );
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

// Standard action set the SSO permission model expects for each feature.
// Used by role/user permission sync (see PermissionFormModal / RolePermissionsSettings).
const STANDARD_FEATURE_ACTIONS = ['READ', 'WRITE', 'DELETE'];

// Provision the standard permission records for a feature so role/user permission
// sync does not fail with "Permission not found for feature [X] and action [Y]".
// Only creates records that are missing from the permission catalog (idempotent).
const grantFeaturePermissions = async (featureCode) => {
  if (!featureCode) return 0;

  const existing = await getAllPermissions();
  const permissions = Array.isArray(existing) ? existing : [];

  const existingActions = new Set(
    permissions
      .filter((p) => (p.featureCode || p.code) === featureCode)
      .map((p) => p.action)
  );

  let created = 0;
  for (const action of STANDARD_FEATURE_ACTIONS) {
    if (existingActions.has(action)) continue;
    await createPermission({
      featureCode,
      action,
      description: `Standard ${action} permission for feature ${featureCode}`,
      active: true
    });
    created += 1;
  }
  return created;
};

export default function FeatureList() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const deleteInFlightRef = useRef(false);

  // URL Filters: search, pagination, sorting, status filter
  const {
    page,
    setPage,
    setPageSize,
    apiParams,
    sortBy,
    sortOrder,
    handleColumnSort,
    filters,
    setFilter,
    resetFilters
  } = useUrlFilters({
    defaultPageSize: 10,
    defaultSortBy: 'name',
    defaultSortOrder: 'asc'
  });

  // Query filters builder
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) {
      q.search = filters.searchKey.trim();
      q.searchKey = filters.searchKey.trim();
    }
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.moduleName && filters.moduleName.trim()) q.moduleName = filters.moduleName.trim();
    if (filters.active !== undefined && filters.active !== '') {
      q.active = filters.active === 'true' || filters.active === true;
    }
    return q;
  }, [filters]);

  // Data fetching via useApiQuery
  const {
    data: responseData,
    isLoading,
    refetch,
    isFetching
  } = useApiQuery(featuresApi.getList, { ...queryFilters, ...apiParams });

  // Mutations via useApiMutation
  const createMutation = useApiMutation(featuresApi.create);
  const updateMutation = useApiMutation(featuresApi.update);
  const deleteMutation = useApiMutation(featuresApi.delete);

  // Available modules from the SSO module catalog for the module dropdown
  const { data: modulesResponse } = useApiQuery(getModules, { page: 0, pageSize: 100 });

  // Normalize data array
  const rawFeatures = useMemo(() => {
    const list = getFeatureList(responseData);
    return list.map((item) => ({
      ...item,
      _rowKey: item.id ?? item.featureId ?? item.code // Ensure unique rowKey without overwriting the real id
    }));
  }, [responseData]);

  const pageInfo = useMemo(() => getPageInfo(responseData), [responseData]);
  const isServerPaginated = Boolean(pageInfo?.totalPages || pageInfo?.totalElements);

  // Extract unique available modules for filters and modal:
  // prefer the SSO module catalog (/api/sso/module), fall back to modules seen on features
  const moduleCatalogNames = useMemo(() => {
    const list = getModuleList(modulesResponse);
    return list.map((m) => m.name || m.moduleName || m.code).filter(Boolean);
  }, [modulesResponse]);

  const availableModules = useMemo(() => {
    const set = new Set(moduleCatalogNames);
    rawFeatures.forEach((f) => {
      if (f.moduleName) set.add(f.moduleName);
    });
    return Array.from(set).sort();
  }, [moduleCatalogNames, rawFeatures]);

  // Client-side filtering & sorting fallback when API returns all items without server pagination
  const filteredFeatures = useMemo(() => {
    if (isServerPaginated) return rawFeatures;

    return rawFeatures
      .filter((feature) => {
        const code = String(feature.code || '').toLowerCase();
        const name = String(feature.name || '').toLowerCase();
        const desc = String(feature.description || '').toLowerCase();
        const mod = String(feature.moduleName || '').toLowerCase();

        // Search by code or name
        const searchVal = String(filters.searchKey || filters.search || '').trim().toLowerCase();
        if (searchVal) {
          const match =
            code.includes(searchVal) ||
            name.includes(searchVal) ||
            desc.includes(searchVal) ||
            mod.includes(searchVal);
          if (!match) return false;
        }

        // Status filter: Active / Inactive
        if (filters.active !== undefined && filters.active !== '') {
          const isActiveFilter = filters.active === 'true' || filters.active === true;
          const featureActive = feature.active !== false;
          if (featureActive !== isActiveFilter) return false;
        }

        // Module filter
        if (filters.moduleName && filters.moduleName !== 'All') {
          if (feature.moduleName !== filters.moduleName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortBy) return 0;
        const key = sortBy === 'status' ? 'active' : sortBy;
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';

        if (typeof valA === 'boolean' || typeof valB === 'boolean') {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return sortOrder === 'desc' ? numB - numA : numA - numB;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [rawFeatures, isServerPaginated, filters, sortBy, sortOrder]);

  // Paginated records for table
  const displayedFeatures = useMemo(() => {
    if (isServerPaginated) return rawFeatures;
    const start = page * apiParams.size;
    return filteredFeatures.slice(start, start + apiParams.size);
  }, [isServerPaginated, rawFeatures, filteredFeatures, page, apiParams.size]);

  const totalPages = isServerPaginated
    ? pageInfo?.totalPages || 1
    : Math.ceil(filteredFeatures.length / apiParams.size) || 1;

  const totalElements = isServerPaginated
    ? pageInfo?.totalElements || rawFeatures.length
    : filteredFeatures.length;

  // Reset all filters
  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  // Open Create Modal
  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedFeature(prefillData);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (feature) => {
    setSelectedFeature(feature);
    setIsFormOpen(true);
  };

  // Delete Feature confirmation & API execution
  const handleDelete = async (feature) => {
    const featureId = feature?.id ?? feature?.featureId;
    const displayName = feature?.name || feature?.code || 'this feature';

    if (!featureId) {
      dispatch(
        addAlert({
          type: 'error',
          message: 'Feature ID is missing. Cannot delete this feature.'
        })
      );
      return;
    }

    if (deleteInFlightRef.current) {
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete Feature',
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      isDestructive: true
    });

    if (!confirmed) return;

    deleteInFlightRef.current = true;
    try {
      await deleteMutation.mutateAsync(featureId);
      dispatch(
        addAlert({
          type: 'success',
          message: `Feature "${displayName}" deleted successfully`
        })
      );
      refetch();
    } catch (error) {
      console.error('[FeatureList] Failed to delete feature:', error);
      dispatch(
        addAlert({
          type: 'error',
          message:
            error?.response?.data?.message ||
            error?.data?.message ||
            error?.message ||
            'Failed to delete feature'
        })
      );
    } finally {
      deleteInFlightRef.current = false;
    }
  };

  // Create / Update form submission
  const handleFormSubmit = async (payload) => {
    try {
      if (selectedFeature?.id) {
        await updateMutation.mutateAsync({ id: selectedFeature.id, ...payload });
        dispatch(
          addAlert({
            type: 'success',
            message: `Feature "${payload.name}" updated successfully`
          })
        );
      } else {
        const created = await createMutation.mutateAsync(payload);
        const createdCode = created?.code || payload.code;

        try {
          const provisioned = await grantFeaturePermissions(createdCode);
          dispatch(
            addAlert({
              type: 'success',
              message:
                provisioned > 0
                  ? `Feature "${payload.name}" created and ${provisioned} standard permission record(s) provisioned.`
                  : `Feature "${payload.name}" created successfully (permissions already present).`
            })
          );
        } catch (permError) {
          console.error('Failed to provision feature permissions:', permError);
          dispatch(
            addAlert({
              type: 'warning',
              message: `Feature "${payload.name}" was created, but its standard permissions could not be provisioned. Role permission sync may fail until permissions are created manually.`
            })
          );
        }
      }
      setIsFormOpen(false);
      setSelectedFeature(null);
      refetch();
    } catch (error) {
      console.error('Failed to save feature:', error);
      dispatch(
        addAlert({
          type: 'error',
          message:
            error?.response?.data?.message ||
            error?.data?.message ||
            error?.message ||
            'Failed to save feature'
        })
      );
      throw error;
    }
  };

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        id: 'moduleName',
        label: 'Module',
        sortable: true,
        render: (val, row) => (
          <div className="flex items-center gap-1.5 text-zinc-800 text-xs font-semibold">
            <Box size={13} className="text-indigo-500 shrink-0" />
            <span>{row.moduleName || '-'}</span>
          </div>
        )
      },
      {
        id: 'name',
        label: 'Feature Name',
        sortable: true,
        render: (val, row) => (
          <div>
            <span className="font-semibold text-zinc-900 block">{row.name || '-'}</span>
            {row.description && (
              <span className="text-[11px] text-zinc-500 truncate max-w-xs block" title={row.description}>
                {row.description}
              </span>
            )}
          </div>
        )
      },
      {
        id: 'code',
        label: 'Feature Code',
        sortable: true,
        render: (val, row) => (
          <span className="font-mono text-xs font-semibold bg-zinc-100 px-2 py-1 rounded text-zinc-700 border border-zinc-200">
            {row.code || '-'}
          </span>
        )
      },
      {
        id: 'actions',
        label: 'Actions',
        sortable: false,
        render: () => (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded bg-blue-50 text-blue-700 border border-blue-200">
              READ
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              WRITE
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded bg-rose-50 text-rose-700 border border-rose-200">
              DELETE
            </span>
          </div>
        )
      },
      {
        id: 'status',
        label: 'Active',
        sortable: true,
        sortKey: 'active',
        align: 'center',
        render: (val, row) => (
          <DataTableStatusBadge status={row.active !== false ? 'ACTIVE' : 'INACTIVE'} />
        )
      },
      {
        id: 'createdAt',
        label: 'Created At',
        sortable: true,
        render: (val, row) => (
          <span className="text-zinc-600 text-xs font-medium">
            {formatDate(row.createdAt)}
          </span>
        )
      }
    ],
    []
  );

  // Quick toolbar filters
  const basicFilters = useMemo(
    () => [
      {
        id: 'active',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' }
        ]
      },
      {
        id: 'moduleName',
        label: 'Module',
        type: 'select',
        options: [
          { label: 'All Modules', value: '' },
          ...availableModules.map((m) => ({ label: m, value: m }))
        ]
      }
    ],
    [availableModules]
  );

  // Row actions configuration
  const rowActions = useMemo(
    () => [
      {
        key: 'edit',
        label: 'Edit',
        icon: Edit2,
        onClick: (row) => handleEdit(row),
        tooltip: 'Edit Feature',
        className: 'hover:text-indigo-600 hover:bg-indigo-50'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        danger: true,
        onClick: (row) => handleDelete(row),
        tooltip: 'Delete Feature'
      }
    ],
    []
  );

  // Sub-row drawer renderer
  const renderExpandedRow = (feature) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-2">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Feature Code
        </span>
        <p className="text-sm font-semibold font-mono text-zinc-900">{feature.code || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Feature Name
        </span>
        <p className="text-sm font-semibold text-zinc-900">{feature.name || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Module Name
        </span>
        <p className="text-sm font-medium text-zinc-700">{feature.moduleName || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Status
        </span>
        <div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
              feature.active !== false
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {feature.active !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Created At
        </span>
        <p className="text-sm font-medium text-zinc-700">{formatDate(feature.createdAt)}</p>
      </div>
      <div className="space-y-1 col-span-2 md:col-span-4 lg:col-span-5">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
          Description
        </span>
        <p className="text-sm font-medium text-zinc-700">
          {feature.description || 'No description provided.'}
        </p>
      </div>
    </div>
  );

  // Tabs selection: securityTabs when under /settings/security, userTabs otherwise
  const isSecuritySettings = location.pathname.includes('/settings/security');
  const currentTabs = isSecuritySettings ? securityTabs : userTabs;
  const currentActiveKey = isSecuritySettings ? 'feature-permissions' : 'portal-access';

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="Feature Permissions"
        description="Global system features and module permissions master catalog."
      >
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
            <Globe size={14} className="text-indigo-600" />
            <span>Global System Feature — Available to all organizations and companies</span>
          </div>
          <PermissionGuard permission="FEATURE:CREATE">
            <button
              onClick={() => handleCreate()}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Create Feature</span>
            </button>
          </PermissionGuard>
        </div>
      </PageHeader>

      <ModuleTabs tabs={currentTabs} activeKey={currentActiveKey} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-transparent border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-indigo-600 shrink-0" />
            <span className="font-semibold">Global System Feature — Available to all organizations and companies</span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden md:inline">
            Platform master data definition • Tenant isolation maintained through company roles
          </span>
        </div>
        <DataTable
          permissionFeature="FEATURE"
          showIndex
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={displayedFeatures}
          rowKey="_rowKey"
          loading={isLoading}
          isRefreshing={isFetching}
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by code or name..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new feature',
            onCreate: (searchTerm) => handleCreate({ name: searchTerm })
          }}
          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}
          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}
          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}
          // Row Actions (Edit, Delete)
          rowActions={rowActions}
          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}
          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size,
            totalPages: totalPages,
            totalElements: totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="features"
          // Empty State
          emptyMessage="No features found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find system features."
        />
      </div>

      <FeatureFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedFeature(null);
        }}
        initialData={selectedFeature}
        availableModules={availableModules}
        onSubmit={handleFormSubmit}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="features-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
