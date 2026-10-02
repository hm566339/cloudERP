import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Camera, MapPin, Package,
  Calendar, Eye
} from 'lucide-react';
import { 
  useInventorySnapshotList, 
  useInventorySnapshotDelete, 
  useInventorySnapshotCreate, 
  useInventorySnapshotUpdate,
  useProductList,
  useWarehouseList,
  useWarehouseLocationList
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import Modal from '../../../components/common/Modal';
import InventorySnapshotForm from '../components/InventorySnapshotForm';
import useUrlFilters from '../../../hooks/useUrlFilters';

/**
 * Checks whether a given value is formatted as a raw UUID string.
 */
function isUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDisplayDate(dateStr, fallback = '—') {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return fallback;
  }
}

/**
 * Format currency to Indian Rupee format (e.g. ₹32,000.00)
 */
function formatCurrency(val) {
  if (val === undefined || val === null) return '₹0.00';
  const num = Number(val);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format quantity without trailing zeroes
 */
function formatQuantity(val) {
  if (val === undefined || val === null) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

const DEFAULT_COLUMNS = [
  'snapshotDate',
  'product',
  'warehouse',
  'location',
  'quantity',
  'averageCost',
  'stockValue',
  'valuationMethod'
];

export default function InventorySnapshotManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'snapshotDate', defaultSortOrder: 'desc' });

  // Lookups to guarantee clean, user-friendly labels without exposing raw UUIDs
  const { products } = useProductList({}, { page: 0, size: 1000 });
  const { warehouses } = useWarehouseList({}, { page: 0, size: 1000 });
  const { locations } = useWarehouseLocationList({}, { page: 0, size: 1000 });

  const productMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p?.id) map.set(p.id, p);
      });
    }
    return map;
  }, [products]);

  const warehouseMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(warehouses)) {
      warehouses.forEach(w => {
        if (w?.id) map.set(w.id, w);
      });
    }
    return map;
  }, [warehouses]);

  const locationMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(locations)) {
      locations.forEach(l => {
        if (l?.id) map.set(l.id, l);
      });
    }
    return map;
  }, [locations]);

  // Resolvers to extract user-friendly display labels
  const getProductName = (snap) => {
    if (snap.productName && !isUuid(snap.productName)) return snap.productName;
    if (snap.product?.name && !isUuid(snap.product.name)) return snap.product.name;
    if (snap.product?.productName && !isUuid(snap.product.productName)) return snap.product.productName;
    const p = productMap.get(snap.productId);
    if (p?.name && !isUuid(p.name)) return p.name;
    if (p?.productName && !isUuid(p.productName)) return p.productName;
    return '—';
  };

  const getWarehouseName = (snap) => {
    if (snap.warehouseName && !isUuid(snap.warehouseName)) return snap.warehouseName;
    if (snap.warehouse?.name && !isUuid(snap.warehouse.name)) return snap.warehouse.name;
    const w = warehouseMap.get(snap.warehouseId);
    if (w?.name && !isUuid(w.name)) return w.name;
    if (w?.warehouseName && !isUuid(w.warehouseName)) return w.warehouseName;
    return '—';
  };

  const getLocationName = (snap) => {
    if (snap.locationName && !isUuid(snap.locationName)) return snap.locationName;
    if (snap.location?.name && !isUuid(snap.location.name)) return snap.location.name;
    const l = locationMap.get(snap.locationId);
    if (l?.locationName && !isUuid(l.locationName)) return l.locationName;
    if (l?.name && !isUuid(l.name)) return l.name;
    return '—';
  };

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.snapshotScope && filters.snapshotScope.trim()) q.snapshotScope = filters.snapshotScope.trim();
    if (filters.productId && filters.productId.trim()) {
      const val = filters.productId.trim();
      if (isUuid(val)) {
        q.productId = val;
      } else {
        const matched = Array.from(productMap.values()).find(p => 
          (p.name && p.name.toLowerCase().includes(val.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(val.toLowerCase()))
        );
        q.productId = matched ? matched.id : val;
      }
    }
    if (filters.warehouseId && filters.warehouseId.trim()) {
      const val = filters.warehouseId.trim();
      if (isUuid(val)) {
        q.warehouseId = val;
      } else {
        const matched = Array.from(warehouseMap.values()).find(w =>
          (w.name && w.name.toLowerCase().includes(val.toLowerCase()))
        );
        q.warehouseId = matched ? matched.id : val;
      }
    }
    if (filters.batchId && filters.batchId.trim()) q.batchId = filters.batchId.trim();
    return q;
  }, [filters, productMap, warehouseMap]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : (apiParams.sort ? `${apiParams.sort},${apiParams.direction || 'desc'}` : 'snapshotDate,desc')
  }), [page, apiParams.size, sortBy, sortOrder, apiParams.sort, apiParams.direction]);

  const { inventorySnapshots, pagination: pageInfo, isLoading, isFetching, refetch } = useInventorySnapshotList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useInventorySnapshotCreate();
  const updateMutation = useInventorySnapshotUpdate();
  const deleteMutation = useInventorySnapshotDelete();

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Snapshot updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Snapshot generated successfully' }));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Operation failed' }));
    }
  };

  const handleDelete = async (id) => {
    confirmDialog(
      'Delete Snapshot Line',
      'Are you sure you want to delete this snapshot line?',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Snapshot line deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete snapshot line' }));
        }
      }
    );
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const columns = useMemo(() => [
    {
      id: 'snapshotDate',
      label: 'Snapshot Date',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
            <Calendar size={12} className="text-zinc-400 shrink-0" />
            <span>{formatDisplayDate(row.snapshotDate)}</span>
          </span>
          {row.snapshotScope && (
            <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono truncate max-w-[120px]">
              {row.snapshotScope}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'product',
      label: 'Product',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Package size={14} className="text-zinc-400 shrink-0" />
          <span 
            className="font-semibold text-zinc-900 text-xs truncate max-w-[220px]"
            title={getProductName(row) !== '—' ? getProductName(row) : undefined}
          >
            {getProductName(row)}
          </span>
        </div>
      )
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-700 text-xs">
          <MapPin size={13} className="text-zinc-400 shrink-0" />
          <span 
            className="truncate max-w-[140px]"
            title={getWarehouseName(row) !== '—' ? getWarehouseName(row) : undefined}
          >
            {getWarehouseName(row)}
          </span>
        </div>
      )
    },
    {
      id: 'location',
      label: 'Location',
      sortable: false,
      render: (val, row) => (
        <span 
          className="truncate max-w-[140px] block text-xs text-zinc-600"
          title={getLocationName(row) !== '—' ? getLocationName(row) : undefined}
        >
          {getLocationName(row)}
        </span>
      )
    },
    {
      id: 'quantity',
      label: 'Quantity',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 text-sm font-mono">
          {formatQuantity(row.quantity)}
        </span>
      )
    },
    {
      id: 'averageCost',
      label: 'Unit Cost',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-700 text-sm font-mono">
          {formatCurrency(row.averageCost)}
        </span>
      )
    },
    {
      id: 'stockValue',
      label: 'Stock Value',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-bold text-zinc-900 text-sm font-mono">
          {formatCurrency(row.stockValue)}
        </span>
      )
    },
    {
      id: 'valuationMethod',
      label: 'Valuation Method',
      sortable: false,
      align: 'center',
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-medium uppercase">
          {row.valuationMethod || 'FIFO'}
        </span>
      )
    }
  ], [productMap, warehouseMap, locationMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'productId',
      label: 'Product',
      type: 'text',
      placeholder: 'Search product...'
    },
    {
      id: 'warehouseId',
      label: 'Warehouse',
      type: 'text',
      placeholder: 'Search warehouse...'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Batch & Identification',
      fields: [
        { id: 'batchId', label: 'Batch', placeholder: 'Search batch...' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(`${window.location.pathname.replace(/\/$/, '')}/${row?.id}`),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'INVENTORY', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'INVENTORY', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate]);

  const renderExpandedRow = (snap) => {
    const prod = getProductName(snap);
    const wh = getWarehouseName(snap);
    const loc = getLocationName(snap);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Product Name</span>
          <p className="text-sm font-semibold text-zinc-900">{prod}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Warehouse</span>
          <p className="text-sm font-medium text-zinc-700">{wh}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
          <p className="text-sm font-medium text-zinc-700">{loc}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Snapshot Date</span>
          <p className="text-sm font-medium text-zinc-700">{formatDisplayDate(snap.snapshotDate)}</p>
        </div>
        {snap.snapshotScope && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Scope</span>
            <p className="text-sm font-medium text-zinc-700 font-mono">{snap.snapshotScope}</p>
          </div>
        )}
        {(snap.batchNumber || snap.batchNo) && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Batch No</span>
            <p className="text-sm font-medium text-zinc-700 font-mono">{snap.batchNumber || snap.batchNo}</p>
          </div>
        )}
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quantity</span>
          <p className="text-sm font-medium text-zinc-900 font-mono">{formatQuantity(snap.quantity)}</p>
        </div>
        {snap.reservedQuantity !== undefined && snap.reservedQuantity !== null && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reserved Qty</span>
            <p className="text-sm font-medium text-zinc-700 font-mono">{formatQuantity(snap.reservedQuantity)}</p>
          </div>
        )}
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Unit Cost</span>
          <p className="text-sm font-medium text-zinc-700 font-mono">{formatCurrency(snap.averageCost)}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Stock Value</span>
          <p className="text-sm font-bold text-zinc-900 font-mono">{formatCurrency(snap.stockValue)}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Valuation Method</span>
          <p className="text-sm font-medium text-zinc-700 font-mono uppercase">{snap.valuationMethod || 'FIFO'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Inventory Snapshots"
        description="Capture point-in-time stock quantities and valuations for audits"
      >
        <RequirePermission module="INVENTORY" action="CREATE">
          <button 
            type="button"
            onClick={() => handleOpenFormModal()} 
            className="btn-primary flex items-center gap-2"
          >
            <Camera size={16} />
            <span>Capture Snapshot</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={inventorySnapshots || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.snapshotScope || ''}
          searchPlaceholder="Search scope..."
          onSearchChange={(val) => setFilter('snapshotScope', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Advanced Filters
          advancedFilters={advancedFilters}

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

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || inventorySnapshots?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="snapshots"

          // Empty State
          emptyMessage="No snapshots found"
          emptyDescription="No inventory snapshots match your current search criteria."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Snapshot Info' : 'Capture Snapshot'}
        maxWidth="max-w-md"
      >
        <InventorySnapshotForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="inventorysnapshot-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
        totalItems={pageInfo?.totalElements || inventorySnapshots?.length || 0}
      />
    </div>
  );
}