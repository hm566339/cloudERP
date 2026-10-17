import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, Activity
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import Modal from '../../../components/common/Modal';
import InventoryStockForm from '../components/InventoryStockForm';
import { 
  useInventoryStockList, 
  useInventoryStockDelete, 
  useOpeningStockCreate, 
  useInventoryStockUpdate 
} from '../../../api/inventory';

const DEFAULT_COLUMNS = [
  'productId',
  'warehouseId',
  'locationId',
  'quantity',
  'reservedQuantity',
  'availableQuantity',
  'averageCost',
  'stockValue',
  'lastMovementAt'
];

export default function StockTracking() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.auth?.user);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.productName = filters.searchKey.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.locationId && filters.locationId.trim()) q.locationId = filters.locationId.trim();
    if (filters.batchId && filters.batchId.trim()) q.batchId = filters.batchId.trim();
    
    if (filters.minQuantity !== undefined && filters.minQuantity !== '') {
      q.minQuantity = Number(filters.minQuantity);
    }
    if (filters.maxQuantity !== undefined && filters.maxQuantity !== '') {
      q.maxQuantity = Number(filters.maxQuantity);
    }
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: apiParams.sort || undefined
  }), [page, apiParams.size, apiParams.sort]);

  const { inventoryStocks: stocks, pagination: pageInfo, isLoading, isFetching, refetch } = useInventoryStockList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useOpeningStockCreate();
  const updateMutation = useInventoryStockUpdate();
  const deleteMutation = useInventoryStockDelete();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Stock Record',
      'Are you sure you want to delete this live stock record? This is highly destructive.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Stock record deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete stock record' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (selectedStock?.id) {
        await updateMutation.mutateAsync([selectedStock.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Stock ledger updated successfully' }));
      } else {
        const openingStockPayload = {
          openingStockNo: `OS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          openingDate: new Date().toISOString().split('T')[0],
          warehouseId: payload.warehouseId,
          status: 'APPROVED',
          lines: [
            {
              warehouseLocationId: payload.locationId,
              productId: payload.productId,
              batchId: payload.batchId || null,
              serialId: null,
              quantity: payload.quantity,
              unitCost: payload.averageCost,
              totalValue: payload.stockValue,
              uomId: payload.uomId
            }
          ],
          remarks: 'Initial stock entry via manual addition',
          approvedBy: currentUser?.id,
          approvedAt: new Date().toISOString()
        };
        await createMutation.mutateAsync(openingStockPayload);
        dispatch(addAlert({ type: 'success', message: 'Stock initialized successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save stock record' }));
    }
  };

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedStock(prefillData);
    setIsFormOpen(true);
  };

  React.useEffect(() => {
    if (location.state?.openAddStock) {
      handleCreate({ productId: location.state.prefillProductId });
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state]);

  const handleExport = () => {
    if (!stocks || stocks.length === 0) {
      window.print();
      return;
    }
    const headers = ['Product', 'Warehouse', 'Location', 'Quantity', 'Reserved', 'Available', 'Avg Cost', 'Stock Value'];
    const rows = stocks.map(s => [
      `"${((s.productName || s.productId) || '').replace(/"/g, '""')}"`,
      `"${((s.warehouseName || s.warehouseId) || '').replace(/"/g, '""')}"`,
      `"${((s.locationName || s.locationId) || '').replace(/"/g, '""')}"`,
      s.quantity || 0,
      s.reservedQuantity || 0,
      s.availableQuantity || 0,
      s.averageCost || 0,
      s.stockValue || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InventoryStock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo(() => [
    {
      id: 'productId',
      label: 'Product',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{row.productName || row.productId || '-'}</span>
          {row.productCode && <span className="text-zinc-500 text-xs font-mono">{row.productCode}</span>}
        </div>
      )
    },
    {
      id: 'warehouseId',
      label: 'Warehouse',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-800 font-medium">{row.warehouseName || row.warehouseId || '-'}</span>
      )
    },
    {
      id: 'locationId',
      label: 'Location',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-700">{row.locationName || row.locationId || '-'}</span>
      )
    },
    {
      id: 'quantity',
      label: 'Quantity',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? 0}
        </span>
      )
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {row.reservedQuantity?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? 0}
        </span>
      )
    },
    {
      id: 'availableQuantity',
      label: 'Available',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-bold text-emerald-700 font-mono">
          {row.availableQuantity?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? 0}
        </span>
      )
    },
    {
      id: 'averageCost',
      label: 'Avg. Cost',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-700 font-mono">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.averageCost || 0)}
        </span>
      )
    },
    {
      id: 'stockValue',
      label: 'Stock Value',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.stockValue || 0)}
        </span>
      )
    },
    {
      id: 'lastMovementAt',
      label: 'Last Movement',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-600 text-xs">
          {row.lastMovementAt ? new Date(row.lastMovementAt).toLocaleString() : '-'}
        </span>
      )
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'warehouseId',
      label: 'Warehouse',
      type: 'text',
      placeholder: 'Warehouse'
    },
    {
      id: 'locationId',
      label: 'Location',
      type: 'text',
      placeholder: 'Location'
    },
    {
      id: 'minQuantity',
      label: 'Min Quantity',
      type: 'number',
      placeholder: 'Min Qty'
    },
    {
      id: 'maxQuantity',
      label: 'Max Quantity',
      type: 'number',
      placeholder: 'Max Qty'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Batch & Tracking',
      fields: [
        { id: 'batchId', label: 'Batch ID', placeholder: 'e.g. BATCH-001' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => setExpandedRowId(expandedRowId === row.id ? null : row.id),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Stock Adjustment',
      icon: Edit2,
      permission: { module: 'INVENTORY', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Stock Adjustment',
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
  ], [expandedRowId]);

  const renderExpandedRow = (stock) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Product Name</span>
        <p className="text-sm font-semibold text-zinc-900">{stock.productName || stock.productId || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Warehouse</span>
        <p className="text-sm font-semibold text-zinc-900">{stock.warehouseName || stock.warehouseId || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
        <p className="text-sm font-medium text-zinc-700">{stock.locationName || stock.locationId || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Available Qty</span>
        <p className="text-sm font-bold text-emerald-700 font-mono">{stock.availableQuantity?.toLocaleString() ?? 0}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reserved Qty</span>
        <p className="text-sm font-medium text-zinc-700 font-mono">{stock.reservedQuantity?.toLocaleString() ?? 0}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Qty</span>
        <p className="text-sm font-medium text-zinc-900 font-mono">{stock.quantity?.toLocaleString() ?? 0}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Avg Cost</span>
        <p className="text-sm font-medium text-zinc-700 font-mono">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stock.averageCost || 0)}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Stock Value</span>
        <p className="text-sm font-bold text-zinc-900 font-mono">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stock.stockValue || 0)}</p>
      </div>
      {stock.batchNo && (
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Batch No</span>
          <p className="text-sm font-medium text-zinc-700 font-mono">{stock.batchNo}</p>
        </div>
      )}
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Movement</span>
        <p className="text-sm font-medium text-zinc-700">{stock.lastMovementAt ? new Date(stock.lastMovementAt).toLocaleString() : '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Current Stock"
        description="Manage products, warehouse locations, quantities, costs, and stock values"
        icon={Activity}
      >
        <RequirePermission module="STOCK" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>Add Stock</span>
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
          data={stocks || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Product name..."
          onSearchChange={(val) => setFilter('searchKey', val)}

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
            totalElements: pageInfo?.totalElements || stocks?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="stock items"

          // Empty State
          emptyMessage="No stock records found"
          emptyDescription="Try adjusting your search keywords or filter criteria."
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStock ? 'Manual Stock Adjustment' : 'Add Stock'}
        maxWidth="max-w-2xl"
      >
        <InventoryStockForm
          initialData={selectedStock}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        reportName="inventorystock-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
        totalItems={pageInfo?.totalElements || stocks?.length || 0}
      />
    </div>
  );
}
