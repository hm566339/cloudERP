import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, ArrowRightLeft, Package, MapPin
} from 'lucide-react';
import { 
  useStockMovementLineList, 
  useStockMovementLineDelete, 
  useStockMovementLineCreate, 
  useStockMovementLineUpdate,
  useProductList
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import Modal from '../../../components/common/Modal';
import ExportModal from '../../../components/common/ExportModal';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import StockMovementLineForm from '../components/StockMovementLineForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['product', 'warehouses', 'quantity', 'unitCost', 'totalCost'];

export default function StockMovementLineManagement() {
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

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.stockMovementId && filters.stockMovementId.trim()) q.stockMovementId = filters.stockMovementId.trim();
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.sourceWarehouseId && filters.sourceWarehouseId.trim()) q.sourceWarehouseId = filters.sourceWarehouseId.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { stockMovementLines, pagination: pageInfo, isLoading, isFetching, refetch } = useStockMovementLineList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useStockMovementLineCreate();
  const updateMutation = useStockMovementLineUpdate();
  const deleteMutation = useStockMovementLineDelete();

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
        dispatch(addAlert({ type: 'success', message: 'Movement line updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Movement line created successfully' }));
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
      'Delete Movement Line',
      'Are you sure you want to delete this movement line? This is usually an immutable log.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Movement line deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete line' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'product',
      label: 'Product & Movement ID',
      sortable: false,
      render: (val, row) => {
        const prod = productMap.get(row.productId);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
              <Package size={14} className="text-zinc-400 shrink-0" />
              <span className="truncate max-w-[200px]" title={prod?.productName || row.productId}>
                {prod?.productName || row.productName || (row.productId ? String(row.productId).substring(0, 8) + '...' : '-')}
              </span>
            </span>
            <span className="font-mono text-zinc-500 text-xs mt-0.5">
              Mov: {row.stockMovementId ? String(row.stockMovementId).substring(0, 8) + '...' : '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'warehouses',
      label: 'Source → Destination',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col gap-0.5 text-xs text-zinc-700">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-zinc-400" />
            From: {row.sourceWarehouseName || (row.sourceWarehouseId ? String(row.sourceWarehouseId).substring(0, 8) + '...' : '-')}
          </span>
          <span className="text-[11px] text-zinc-500 ml-3">
            └ To: {row.destinationWarehouseName || (row.destinationWarehouseId ? String(row.destinationWarehouseId).substring(0, 8) + '...' : '-')}
          </span>
        </div>
      )
    },
    {
      id: 'quantity',
      label: 'Quantity',
      sortable: true,
      sortKey: 'quantity',
      align: 'right',
      render: (val, row) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-zinc-900 font-mono text-sm">{row.quantity || 0}</span>
          {(row.quantityBefore !== undefined || row.quantityAfter !== undefined) && (
            <span className="text-[10px] text-zinc-400 font-mono">
              {row.quantityBefore ?? 0} → {row.quantityAfter ?? 0}
            </span>
          )}
        </div>
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
  ], [productMap]);

  const basicFilters = useMemo(() => [], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Movement Identification',
      fields: [
        { id: 'stockMovementId', label: 'Movement ID', placeholder: 'Stock movement ID' },
        { id: 'productId', label: 'Product ID', placeholder: 'Product ID or UUID' },
        { id: 'sourceWarehouseId', label: 'Source Warehouse ID', placeholder: 'Warehouse ID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/stock-movement-lines/${row.id}`)),
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

  const renderExpandedRow = (line) => (
    <ExpandedRowDetails data={line} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Stock Movement Lines"
        description="Detailed product line records for stock movement transactions"
        icon={ArrowRightLeft}
      >
        <RequirePermission module="INVENTORY" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Movement Line</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={stockMovementLines || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/stock-movement-lines/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.productId || ''}
          searchPlaceholder="Search product ID or movement..."
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
            totalElements: pageInfo?.totalElements || stockMovementLines?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="movement lines"

          emptyMessage="No stock movement lines found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find movement lines."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Movement Line' : 'New Movement Line'}
        maxWidth="max-w-2xl"
      >
        <StockMovementLineForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="stock-movement-lines-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}