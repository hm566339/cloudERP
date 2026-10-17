import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, MapPin
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import GlobalWarehouseLocationFormModal from '../components/GlobalWarehouseLocationFormModal';
import WarehouseLocationDetailsModal from '../components/WarehouseLocationDetailsModal';
import { 
  useWarehouseLocationList, 
  useWarehouseLocationCreate, 
  useWarehouseLocationUpdate, 
  useWarehouseLocationDelete 
} from '../../../api/inventory/hooks/useWarehouseLocation';

const LOCATION_TYPES = [
  { value: 'ZONE', label: 'Zone' },
  { value: 'AISLE', label: 'Aisle' },
  { value: 'RACK', label: 'Rack' },
  { value: 'BIN', label: 'Bin' },
  { value: 'SHELF', label: 'Shelf' }
];

const DEFAULT_COLUMNS = ['locationCode', 'locationName', 'locationType', 'warehouseId', 'isActive'];

const getTypeBadge = (type) => {
  switch (type?.toUpperCase()) {
    case 'ZONE':
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    case 'RACK':
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    case 'AISLE':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'BIN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'SHELF':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/80';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200/80';
  }
};

export default function WarehouseLocationManagementPage() {
  const dispatch = useAppDispatch();
  const { companyId } = useParams();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState(null);
  const [selectedLocationForView, setSelectedLocationForView] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'locationName', defaultSortOrder: 'asc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (companyId) q.companyId = companyId;
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.locationCode && filters.locationCode.trim()) q.locationCode = filters.locationCode.trim();
    if (filters.locationName && filters.locationName.trim()) q.locationName = filters.locationName.trim();
    if (filters.locationType && filters.locationType.trim()) q.locationType = filters.locationType.trim();
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    return q;
  }, [filters, companyId]);

  const { locations, pagination, isLoading, isFetching, refetch } = useWarehouseLocationList(
    queryFilters, 
    apiParams
  );

  const createLocation = useWarehouseLocationCreate();
  const updateLocation = useWarehouseLocationUpdate();
  const deleteLocation = useWarehouseLocationDelete();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Location',
      'Are you sure you want to delete this warehouse location?',
      async () => {
        try {
          await deleteLocation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Location deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete location' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      const finalPayload = companyId ? { ...payload, companyId } : payload;
      if (selectedLocationForEdit?.id) {
        await updateLocation.mutateAsync([selectedLocationForEdit.id, finalPayload]);
        dispatch(addAlert({ type: 'success', message: 'Location updated successfully' }));
      } else {
        await createLocation.mutateAsync(finalPayload);
        dispatch(addAlert({ type: 'success', message: 'Location created successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save location' }));
    }
  };

  const columns = useMemo(() => [
    {
      id: 'locationCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.locationCode || '-'}
        </span>
      )
    },
    {
      id: 'locationName',
      label: 'Location Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{row.locationName}</span>
          {row.parentLocationName && (
            <span className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
              <MapPin size={11} className="text-zinc-400" /> {row.parentLocationName}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'locationType',
      label: 'Type',
      sortable: true,
      render: (val, row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getTypeBadge(row.locationType)}`}>
          {row.locationType || '-'}
        </span>
      )
    },
    {
      id: 'warehouseId',
      label: 'Warehouse Reference',
      sortable: false,
      render: (val, row) => (
        <span 
          className="font-mono text-xs text-zinc-600 select-all cursor-text max-w-[280px] inline-block truncate"
          title={row.warehouseId || row.warehouseName}
        >
          {row.warehouseId || row.warehouseName || '-'}
        </span>
      )
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.isActive} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ]
    },
    {
      id: 'locationType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        ...LOCATION_TYPES.map(t => ({ label: t.label, value: t.value }))
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Location Identification',
      fields: [
        { id: 'locationCode', label: 'Location Code', placeholder: 'Search code...' },
        { id: 'locationName', label: 'Location Name (Exact)', placeholder: 'Search exact name...' },
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => setSelectedLocationForView(row.id),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'WAREHOUSE_LOCATIONS', action: 'UPDATE' },
      onClick: (row) => {
        setSelectedLocationForEdit(row);
        setIsFormOpen(true);
      },
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'WAREHOUSE_LOCATIONS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Warehouse Locations"
        description="Manage physical locations, zones, and bins globally"
        icon={MapPin}
      >
        <RequirePermission module="WAREHOUSE_LOCATIONS" action="CREATE">
          <button 
            onClick={() => { setSelectedLocationForEdit(null); setIsFormOpen(true); }} 
            className="btn-primary flex items-center gap-2"
            disabled={createLocation.isLoading}
          >
            <Plus size={16} />
            <span>Add Location</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={locations}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => setSelectedLocationForView(row.id)}

          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search locations..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new location',
            onCreate: (searchTerm) => {
              setSelectedLocationForEdit({ locationName: searchTerm });
              setIsFormOpen(true);
            }
          }}

          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          advancedFilters={advancedFilters}

          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          rowActions={rowActions}

          pagination={{
            page,
            pageSize: apiParams.size || pageSize || 10,
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.totalElements || locations?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="locations"

          emptyMessage="No locations found"
          emptyDescription="There are no locations matching your search criteria."
        />
      </div>

      <GlobalWarehouseLocationFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedLocationForEdit(null); }}
        onSubmit={handleFormSubmit}
        initialData={selectedLocationForEdit}
      />

      <WarehouseLocationDetailsModal
        isOpen={!!selectedLocationForView}
        onClose={() => setSelectedLocationForView(null)}
        locationId={selectedLocationForView}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="warehouse-locations-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
