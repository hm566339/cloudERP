import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { 
  Plus, Edit2, Trash2, Eye, MapPin, Warehouse
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import WarehouseFormModal from '../components/WarehouseFormModal';
import WarehouseLocationConfirmModal from '../components/WarehouseLocationConfirmModal';
import WarehouseLocationFormModal from '../components/WarehouseLocationFormModal';
import { 
  useWarehouseList, 
  useWarehouseCreate, 
  useWarehouseUpdate, 
  useWarehouseDelete,
  WAREHOUSE_TYPES
} from '../../../api/inventory';
import { useWarehouseLocationCreate } from '../../../api/inventory/hooks/useWarehouseLocation';

const DEFAULT_COLUMNS = ['warehouseCode', 'warehouseName', 'warehouseType', 'location', 'status'];

export default function WarehouseManagement() {
  const dispatch = useAppDispatch();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [pendingLocationWarehouse, setPendingLocationWarehouse] = useState(null);
  const [subLocationWarehouse, setSubLocationWarehouse] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'warehouseName', defaultSortOrder: 'asc' });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = {};
    if (companyId) q.companyId = companyId;

    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.warehouseCode && filters.warehouseCode.trim()) q.warehouseCode = filters.warehouseCode.trim();
    if (filters.warehouseName && filters.warehouseName.trim()) q.warehouseName = filters.warehouseName.trim();
    if (filters.warehouseType && filters.warehouseType.trim()) q.warehouseType = filters.warehouseType.trim();
    if (filters.city && filters.city.trim()) q.city = filters.city.trim();
    if (filters.state && filters.state.trim()) q.state = filters.state.trim();
    if (filters.country && filters.country.trim()) q.country = filters.country.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();

    return q;
  }, [filters, companyId]);

  const { warehouses, pagination, isLoading, isFetching, refetch } = useWarehouseList(
    queryFilters, 
    apiParams
  );

  const deleteWarehouse = useWarehouseDelete();
  const createWarehouse = useWarehouseCreate();
  const updateWarehouse = useWarehouseUpdate();
  const createWarehouseLocation = useWarehouseLocationCreate();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Warehouse',
      'Are you sure you want to delete this warehouse? This action cannot be undone.',
      async () => {
        try {
          await deleteWarehouse.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Warehouse deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete warehouse' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (payload.id) {
        await updateWarehouse.mutateAsync([payload.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Warehouse updated successfully' }));
        setIsFormOpen(false);
        refetch();
      } else {
        const response = await createWarehouse.mutateAsync(payload);
        const newWarehouse = response?.data || response;
        setIsFormOpen(false);
        setPendingLocationWarehouse(newWarehouse);
      }
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save warehouse' }));
    }
  };

  const handleConfirmLocation = async (addressData) => {
    if (!pendingLocationWarehouse?.id) return;
    
    try {
      const hasAddressChanged = ['addressLine1', 'addressLine2', 'city', 'state', 'country', 'pinCode'].some(
        key => addressData[key] !== pendingLocationWarehouse[key]
      );

      if (hasAddressChanged) {
        await updateWarehouse.mutateAsync([
          pendingLocationWarehouse.id, 
          { ...pendingLocationWarehouse, ...addressData }
        ]);
      }

      const locationName = `${pendingLocationWarehouse.warehouseName} - ${addressData.city || 'Location'}`;
      
      await createWarehouseLocation.mutateAsync({
        warehouseId: pendingLocationWarehouse.id,
        parentLocationId: null,
        locationName: locationName,
        locationType: "ZONE",
        isActive: pendingLocationWarehouse.status === 'ACTIVE'
      });

      dispatch(addAlert({ type: 'success', message: 'Warehouse created successfully' }));
      setPendingLocationWarehouse(null);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to confirm location' }));
    }
  };

  const handleSubLocationSubmit = async (payload) => {
    try {
      await createWarehouseLocation.mutateAsync(payload);
      dispatch(addAlert({ type: 'success', message: 'Location added successfully' }));
      setSubLocationWarehouse(null);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to add location' }));
    }
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedWarehouse(prefillData);
    setIsFormOpen(true);
  };

  const getTypeName = (val) => {
    return WAREHOUSE_TYPES.find(t => t.value === val)?.label || val;
  };

  const columns = useMemo(() => [
    {
      id: 'warehouseCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.warehouseCode || '-'}
        </span>
      )
    },
    {
      id: 'warehouseName',
      label: 'Warehouse Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.warehouseName || '-'}</span>
      )
    },
    {
      id: 'warehouseType',
      label: 'Type',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-700">{getTypeName(row.warehouseType) || '-'}</span>
      )
    },
    {
      id: 'location',
      label: 'Location',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium">
            {row.city ? `${row.city}${row.state ? `, ${row.state}` : ''}` : row.state || '-'}
          </span>
          {row.country && (
            <span className="text-zinc-500 text-xs">
              {row.country}{row.pinCode ? ` - ${row.pinCode}` : ''}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} />
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
        { label: 'Inactive', value: 'INACTIVE' },
      ]
    },
    {
      id: 'warehouseType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        ...WAREHOUSE_TYPES.map(t => ({ label: t.label, value: t.value }))
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Warehouse Identification',
      fields: [
        { id: 'warehouseCode', label: 'Warehouse Code', placeholder: 'Search code...' },
        { id: 'warehouseName', label: 'Warehouse Name', placeholder: 'Search name...' },
      ]
    },
    {
      title: 'Location Details',
      fields: [
        { id: 'city', label: 'City', placeholder: 'Filter by city...' },
        { id: 'state', label: 'State', placeholder: 'Filter by state...' },
        { id: 'country', label: 'Country', placeholder: 'Filter by country...' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'add-location',
      label: 'Add Location',
      icon: Plus,
      permission: { module: 'WAREHOUSE_LOCATIONS', action: 'CREATE' },
      onClick: (row) => setSubLocationWarehouse(row),
      tooltip: 'Add Warehouse Location',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/warehouse/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'WAREHOUSES', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'WAREHOUSES', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (wh) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Warehouse Name</span>
        <p className="text-sm font-semibold text-zinc-900">{wh.warehouseName || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Code</span>
        <p className="text-sm font-semibold text-zinc-900">{wh.warehouseCode || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${wh.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {wh.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Type</span>
        <p className="text-sm font-medium text-zinc-700">{getTypeName(wh.warehouseType) || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
        <p className="text-sm font-medium text-zinc-700">{wh.city || '-'}{wh.state ? `, ${wh.state}` : ''}</p>
        <p className="text-xs text-zinc-500">{wh.country || '-'}{wh.pinCode ? ` ${wh.pinCode}` : ''}</p>
      </div>
      <div className="space-y-1 col-span-2">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Full Address</span>
        <p className="text-sm font-medium text-zinc-700">{wh.addressLine1 || '-'}</p>
        {wh.addressLine2 && <p className="text-xs text-zinc-500">{wh.addressLine2}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Warehouse Management"
        description="Manage physical storage locations, capacities, and types"
        icon={Warehouse}
      >
        <RequirePermission module="WAREHOUSES" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Warehouse</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={warehouses}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/warehouse/${row.id}`))}

          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search warehouses..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new warehouse',
            onCreate: (searchTerm) => handleCreate({ warehouseName: searchTerm })
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

          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          pagination={{
            page,
            pageSize: apiParams.size || pageSize || 10,
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.totalElements || warehouses?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="warehouses"

          emptyMessage="No warehouses found"
          emptyDescription="There are no warehouses matching your search criteria."
        />
      </div>

      <WarehouseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedWarehouse}
      />

      <WarehouseLocationConfirmModal
        isOpen={!!pendingLocationWarehouse}
        onClose={() => setPendingLocationWarehouse(null)}
        onConfirm={handleConfirmLocation}
        warehouse={pendingLocationWarehouse}
      />

      <WarehouseLocationFormModal
        isOpen={!!subLocationWarehouse}
        onClose={() => setSubLocationWarehouse(null)}
        onSubmit={handleSubLocationSubmit}
        warehouse={subLocationWarehouse}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="warehouse-management-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}