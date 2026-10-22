import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Layers, Package, MapPin
} from 'lucide-react';
import { 
  useInventoryCostLayerList, 
  useInventoryCostLayerDelete, 
  useInventoryCostLayerCreate, 
  useInventoryCostLayerUpdate,
  useProductList,
  useWarehouseList
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import Modal from '../../../components/common/Modal';
import ExportModal from '../../../components/common/ExportModal';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import InventoryCostLayerForm from '../components/InventoryCostLayerForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['productLocation', 'batchId', 'receivedQuantity', 'remainingQuantity', 'unitCost', 'totalCost'];

export default function InventoryCostLayerManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

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
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const { products } = useProductList({}, { page: 0, size: 200 });
  const productMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p?.id) map.set(p.id, p);
      });
    }
    return map;
  }, [products]);

  const { warehouses } = useWarehouseList({}, { page: 0, size: 200 });
  const warehouseMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(warehouses)) {
      warehouses.forEach((w) => {
        if (w?.id) map.set(w.id, w.warehouseName || w.name);
      });
    }
    return map;
  }, [warehouses]);

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.batchId && filters.batchId.trim()) q.batchId = filters.batchId.trim();
    if (filters.sourceMovementId && filters.sourceMovementId.trim()) q.sourceMovementId = filters.sourceMovementId.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { inventoryCostLayers, pagination: pageInfo, isLoading, isFetching, refetch } = useInventoryCostLayerList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useInventoryCostLayerCreate();
  const updateMutation = useInventoryCostLayerUpdate();
  const deleteMutation = useInventoryCostLayerDelete();

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Cost layer updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Cost layer created successfully' }));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Operation failed' }));
      throw error;
    }
  };

  const handleDelete = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    confirmDialog(
      'Delete Cost Layer',
      'Are you sure you want to delete this cost layer? This may affect inventory valuation.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Cost layer deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete layer' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'productLocation',
      label: 'Product & Warehouse',
      sortable: false,
      render: (val, row) => {
        const prod = productMap.get(row.productId);
        const wh = warehouseMap.get(row.warehouseId);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
              <Package size={14} className="text-zinc-400 shrink-0" />
              <span className="truncate max-w-[200px]" title={prod?.productName || row.productId}>
                {prod?.productName || row.productName || (row.productId ? String(row.productId).substring(0, 8) + '...' : '-')}
              </span>
            </span>
            <span className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-zinc-400" />
              WH: {wh || row.warehouseName || (row.warehouseId ? String(row.warehouseId).substring(0, 8) : '-')}
            </span>
          </div>
        );
      }
    },
    {
      id: 'batchId',
      label: 'Batch',
      sortable: false,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
          {row.batchId ? String(row.batchId).substring(0, 8) + '...' : '-'}
        </span>
      )
    },
    {
      id: 'receivedQuantity',
      label: 'Received Qty',
      sortable: true,
      sortKey: 'receivedQuantity',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700">
          {row.receivedQuantity || 0}
        </span>
      )
    },
    {
      id: 'remainingQuantity',
      label: 'Remaining Qty',
      sortable: true,
      sortKey: 'remainingQuantity',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-zinc-900">
          {row.remainingQuantity || 0}
        </span>
      )
    },
    {
      id: 'unitCost',
      label: 'Unit Cost',
      sortable: true,
      sortKey: 'unitCost',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700">
          {row.unitCost !== undefined && row.unitCost !== null
            ? Number(row.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </span>
      )
    },
    {
      id: 'totalCost',
      label: 'Total Cost',
      sortable: true,
      sortKey: 'totalCost',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-zinc-900">
          {row.totalCost !== undefined && row.totalCost !== null
            ? Number(row.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00'}
        </span>
      )
    }
  ], [productMap, warehouseMap]);

  const basicFilters = useMemo(() => [], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Layer Identification',
      fields: [
        { id: 'productId', label: 'Product ID', placeholder: 'Product ID or UUID' },
        { id: 'warehouseId', label: 'Warehouse ID', placeholder: 'Warehouse ID or UUID' },
        { id: 'batchId', label: 'Batch ID', placeholder: 'Batch ID or UUID' },
        { id: 'sourceMovementId', label: 'Movement ID', placeholder: 'Source Movement ID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/cost-layers/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
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
  ], [navigate, buildPath]);

  const renderExpandedRow = (layer) => (
    <ExpandedRowDetails data={layer} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Inventory Cost Layers"
        description="Track FIFO/LIFO valuation layers, cost allocations, and remaining balances"
        icon={Layers}
      >
        <RequirePermission module="INVENTORY" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Cost Layer</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={inventoryCostLayers || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/cost-layers/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.productId || ''}
          searchPlaceholder="Search product ID..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('productId', val);
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
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || inventoryCostLayers?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="cost layers"

          emptyMessage="No inventory cost layers found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find cost layers."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Cost Layer' : 'New Cost Layer'}
        maxWidth="max-w-2xl"
      >
        <InventoryCostLayerForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="inventory-cost-layers-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}